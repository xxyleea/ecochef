export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayISO(dt);
}

/** Whole days from today until the ISO date (negative = past). */
export function daysUntil(iso: string, now = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export type Freshness = 'expired' | 'today' | 'soon' | 'ok';

export function freshness(iso: string): Freshness {
  const n = daysUntil(iso);
  if (n < 0) return 'expired';
  if (n === 0) return 'today';
  if (n <= 3) return 'soon';
  return 'ok';
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
