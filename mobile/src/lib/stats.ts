import type { Item } from './types';

export const CO2_PER_ITEM_KG = 1;

export function computeStats(items: Item[]) {
  const used = items.filter((i) => i.status === 'used');
  const wasted = items.filter((i) => i.status === 'wasted');
  const closed = used.length + wasted.length;
  const useRate = closed ? used.length / closed : 0;
  const valueUsed = used.reduce((s, i) => s + (i.priceHKD ?? 0), 0);
  const valueWasted = wasted.reduce((s, i) => s + (i.priceHKD ?? 0), 0);
  const co2 = used.length * CO2_PER_ITEM_KG;
  const recent = [...used, ...wasted]
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
    .slice(0, 12);
  return { used: used.length, wasted: wasted.length, useRate, valueUsed, valueWasted, co2, recent };
}
