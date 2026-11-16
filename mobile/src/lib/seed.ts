import { addDays, todayISO } from './dates';
import type { DraftItem } from './types';

/** Demo groceries so the app is explorable without scanning anything. */
export function sampleDrafts(): DraftItem[] {
  const t = todayISO();
  const rows: Omit<DraftItem, 'key' | 'include'>[] = [
    { name: 'Choy sum', nameZh: '菜心', category: 'produce', quantity: 1, unit: 'bunch', storage: 'fridge', expiresAt: addDays(t, 1), expirySource: 'estimate', confidence: 0.7, priceHKD: 12, storageTip: 'Wrap in a dry paper towel inside a bag.' },
    { name: 'Tomatoes', nameZh: '番茄', category: 'produce', quantity: 4, unit: 'pcs', storage: 'pantry', expiresAt: addDays(t, 2), expirySource: 'estimate', confidence: 0.6, priceHKD: 15, storageTip: 'Keep stem-side down, out of the sun; fridge once ripe.' },
    { name: 'Firm tofu', nameZh: '硬豆腐', category: 'tofu', quantity: 1, unit: 'box', storage: 'fridge', expiresAt: addDays(t, 3), expirySource: 'label', confidence: 0.95, priceHKD: 9, storageTip: 'After opening, cover with water and change it daily.' },
    { name: 'Pork mince', nameZh: '免治豬肉', category: 'meat', quantity: 300, unit: 'g', storage: 'fridge', expiresAt: addDays(t, 1), expirySource: 'estimate', confidence: 0.8, priceHKD: 28, storageTip: 'Freeze flat in a bag if not cooking within a day.' },
    { name: 'Eggs', nameZh: '雞蛋', category: 'eggs', quantity: 10, unit: 'pcs', storage: 'fridge', expiresAt: addDays(t, 18), expirySource: 'label', confidence: 0.95, priceHKD: 26, storageTip: 'Keep in the carton on a fridge shelf, not the door.' },
    { name: 'Fresh milk', nameZh: '鮮奶', category: 'dairy', quantity: 1, unit: 'L', storage: 'fridge', expiresAt: addDays(t, 5), expirySource: 'label', confidence: 0.95, priceHKD: 24, storageTip: 'Store at the back of the fridge where it is coldest.' },
    { name: 'White bread', nameZh: '白方包', category: 'bakery', quantity: 1, unit: 'loaf', storage: 'pantry', expiresAt: addDays(t, 4), expirySource: 'label', confidence: 0.9, priceHKD: 17, storageTip: 'Freeze slices you won’t eat in 3 days; toast from frozen.' },
    { name: 'Spring onion', nameZh: '葱', category: 'produce', quantity: 1, unit: 'bunch', storage: 'fridge', expiresAt: addDays(t, 6), expirySource: 'estimate', confidence: 0.6, priceHKD: 5, storageTip: 'Stand roots in a glass of water in the fridge.' },
    { name: 'Jasmine rice', nameZh: '香米', category: 'grains', quantity: 5, unit: 'kg', storage: 'pantry', expiresAt: addDays(t, 300), expirySource: 'estimate', confidence: 0.7, priceHKD: 68, storageTip: 'Airtight container keeps out bugs and humidity.' },
  ];
  return rows.map((r, i) => ({ ...r, key: `seed-${i}`, include: true }));
}
