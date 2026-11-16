// Run: node --experimental-strip-types lib/freshness.test.ts  (Node 22.6+)
import assert from 'node:assert/strict';
import { applyRules, type FreshnessVerdict } from './freshness.ts';

const base: FreshnessVerdict = {
  condition: 'fresh', daysLeftMin: 3, daysLeftMax: 5, confidence: 'medium',
  visibleSigns: [], highRisk: false, safetyNote: '', advice: '',
};

// 1. Visible mould forces discard, even if the model said fresh.
let r = applyRules({ ...base, visibleSigns: ['white fuzzy mould on the cut edge'] }, 'produce');
assert.equal(r.condition, 'discard');
assert.equal(r.daysLeftMax, 0);

// 2. Slime on meat is discard.
r = applyRules({ ...base, visibleSigns: ['slimy surface'] }, 'meat');
assert.equal(r.condition, 'discard');

// 3. High-risk food is never "fresh" and always gets a smell note.
r = applyRules(base, 'meat');
assert.equal(r.condition, 'use_soon');
assert.equal(r.highRisk, true);
assert.match(r.safetyNote, /smell/i);

// 4. Produce that looks fine keeps its verdict and does not get the meat note.
r = applyRules(base, 'produce');
assert.equal(r.condition, 'fresh');
assert.equal(r.safetyNote, '');

// 5. Model marking a high-risk item as high-risk without a category match is also handled.
r = applyRules({ ...base, highRisk: true }, 'other');
assert.equal(r.condition, 'use_soon');

// 6. Days are clamped: negative to 0, max not below min, huge to 60.
r = applyRules({ ...base, daysLeftMin: -4, daysLeftMax: -1 }, 'produce');
assert.equal(r.daysLeftMin, 0);
assert.equal(r.daysLeftMax, 0);
r = applyRules({ ...base, daysLeftMin: 9, daysLeftMax: 2 }, 'produce');
assert.equal(r.daysLeftMax, 9);
r = applyRules({ ...base, daysLeftMin: 5, daysLeftMax: 400 }, 'produce');
assert.equal(r.daysLeftMax, 60);

// 7. "Sprouting" counts as visible spoilage (potato case).
r = applyRules({ ...base, visibleSigns: ['sprouting eyes'] }, 'produce');
assert.equal(r.condition, 'discard');

// 8. Words that merely contain a risky substring must not trigger discard.
r = applyRules({ ...base, visibleSigns: ['bright orange colour, firm, pushed-out shape is fine'] }, 'produce');
assert.equal(r.condition, 'fresh');
r = applyRules({ ...base, visibleSigns: ['carrot top still green'] }, 'produce');
assert.equal(r.condition, 'fresh');

console.log('freshness rules: all tests passed');
