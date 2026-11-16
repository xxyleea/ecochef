import { daysUntil, isValidISODate, todayISO, addDays } from './dates';
import type { DraftItem, Item, Recipe, ScanMode, ChatMessage, Category, Storage } from './types';

/**
 * In development, relative URLs hit the Expo dev server's API routes.
 * For production native builds set EXPO_PUBLIC_API_URL (or the expo-router `origin` plugin option).
 */
const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the EcoChef server.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`);
  return data as T;
}

interface ScanResponse {
  items: {
    name: string;
    nameZh: string;
    category: Category;
    quantity: number;
    unit: string;
    storage: Storage;
    expiresAt: string;
    expirySource: 'label' | 'estimate';
    confidence: number;
    priceHKD: number | null;
    storageTip: string;
  }[];
  notes: string | null;
}

export async function scanPhoto(
  mode: ScanMode,
  imageBase64: string,
  mediaType: string,
): Promise<{ drafts: DraftItem[]; notes: string | null }> {
  const today = todayISO();
  const mt = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType) ? mediaType : 'image/jpeg';
  const data = await post<ScanResponse>('/api/scan', { mode, imageBase64, mediaType: mt, today });
  const drafts = data.items.map((it, idx) => ({
    key: `${Date.now()}-${idx}`,
    name: it.name,
    nameZh: it.nameZh || undefined,
    category: it.category,
    quantity: it.quantity > 0 ? it.quantity : 1,
    unit: it.unit || 'pcs',
    storage: it.storage,
    // Guard against malformed dates from the model: fall back to a 3-day estimate.
    expiresAt: isValidISODate(it.expiresAt) ? it.expiresAt : addDays(today, 3),
    expirySource: it.expirySource,
    confidence: Math.max(0, Math.min(1, it.confidence)),
    priceHKD: it.priceHKD ?? undefined,
    storageTip: it.storageTip || undefined,
    include: true,
  }));
  return { drafts, notes: data.notes };
}

export async function fetchRecipes(items: Item[], request?: string): Promise<Recipe[]> {
  const inventory = items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit,
    daysLeft: daysUntil(i.expiresAt),
  }));
  const data = await post<{ recipes: Recipe[] }>('/api/recipes', { inventory, request, count: 3 });
  return data.recipes;
}

export function inventorySummary(items: Item[]): string {
  return items
    .map((i) => {
      const d = daysUntil(i.expiresAt);
      const when = d < 0 ? `expired ${-d}d ago` : d === 0 ? 'expires today' : `${d}d left`;
      return `- ${i.name}${i.nameZh ? ` (${i.nameZh})` : ''}: ${i.quantity} ${i.unit}, ${i.storage}, ${when}`;
    })
    .join('\n');
}

export async function askChef(messages: ChatMessage[], items: Item[]): Promise<string> {
  const data = await post<{ reply: string }>('/api/chat', {
    messages: messages.slice(-20),
    inventorySummary: inventorySummary(items),
    today: todayISO(),
  });
  return data.reply;
}

export interface FreshnessVerdictResponse {
  condition: 'fresh' | 'use_soon' | 'discard' | 'unsure';
  daysLeftMin: number;
  daysLeftMax: number;
  confidence: 'low' | 'medium' | 'high';
  visibleSigns: string[];
  highRisk: boolean;
  safetyNote: string;
  advice: string;
  itemName: string;
  itemNameZh: string;
}

export async function checkFreshness(
  item: Item,
  photos: { base64: string; mediaType: string }[],
): Promise<FreshnessVerdictResponse> {
  const mt = (m: string) => (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(m) ? m : 'image/jpeg');
  return post<FreshnessVerdictResponse>('/api/freshness', {
    category: item.category,
    storage: item.storage,
    nameHint: item.name,
    daysSinceAdded: Math.floor((Date.now() - new Date(item.addedAt).getTime()) / 86_400_000),
    today: todayISO(),
    photos: photos.map((p) => ({ base64: p.base64, mediaType: mt(p.mediaType) })),
  });
}
