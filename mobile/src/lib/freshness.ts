// Pure rules for the freshness check. No SDK or React imports, so they can be tested directly.
import type { Category } from './types';

export type Condition = 'fresh' | 'use_soon' | 'discard' | 'unsure';

export interface FreshnessVerdict {
  condition: Condition;
  daysLeftMin: number; // 0 = use today
  daysLeftMax: number;
  confidence: 'low' | 'medium' | 'high';
  visibleSigns: string[];
  highRisk: boolean;
  safetyNote: string;
  advice: string;
}

/** Foods where looks-fine does not mean safe: spoilage bacteria often change neither look nor smell. */
export const HIGH_RISK: Category[] = ['meat', 'seafood', 'dairy', 'eggs', 'tofu'];

export function isHighRisk(category: Category): boolean {
  return HIGH_RISK.includes(category);
}

/** Any of these in the model's notes means visible spoilage, whatever it said about the verdict. */
const SPOILAGE = /\b(mould|mold|slime|slimy|fuzzy|rotten|rotting|sprout|sprouts|sprouting|swollen|bulging|leaking|fizzing|maggots?|fungus|fungi)\b/i;

/**
 * Apply hard safety rules on top of the model's verdict.
 * - Visible spoilage always means discard.
 * - High-risk foods are never "fresh": at best "use soon", and the safety note always says to smell-check.
 * - Days are clamped to a sane range and min <= max.
 */
export function applyRules(v: FreshnessVerdict, category: Category): FreshnessVerdict {
  const highRisk = isHighRisk(category) || v.highRisk;
  const signsText = v.visibleSigns.join(' ');
  let condition = v.condition;
  let note = v.safetyNote.trim();

  if (SPOILAGE.test(signsText)) condition = 'discard';

  if (highRisk && condition === 'fresh') condition = 'use_soon';

  const min = clamp(Math.round(v.daysLeftMin), 0, 60);
  const max = clamp(Math.round(v.daysLeftMax), min, 60);

  if (highRisk && !note.toLowerCase().includes('smell'))
    note = `${note ? note + ' ' : ''}Smell it and check the texture before eating; looks alone can't show it's safe.`.trim();

  if (condition === 'discard') {
    return { ...v, condition, daysLeftMin: 0, daysLeftMax: 0, highRisk, safetyNote: note, confidence: v.confidence };
  }
  return { ...v, condition, daysLeftMin: min, daysLeftMax: max, highRisk, safetyNote: note };
}

/** Conservative expiry to save: the low end of the range, so the app warns early rather than late. */
export function expiryFromVerdict(todayISO: string, v: FreshnessVerdict, addDays: (iso: string, n: number) => string): string {
  return addDays(todayISO, v.daysLeftMin);
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
