export type Storage = 'fridge' | 'freezer' | 'pantry';
export type Category =
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'eggs'
  | 'tofu'
  | 'bakery'
  | 'grains'
  | 'condiments'
  | 'snacks'
  | 'drinks'
  | 'frozen'
  | 'other';
export type ExpirySource = 'label' | 'estimate' | 'manual';
export type ItemStatus = 'active' | 'used' | 'wasted';

export interface Item {
  id: string;
  name: string;
  nameZh?: string;
  category: Category;
  quantity: number;
  unit: string;
  storage: Storage;
  addedAt: string; // ISO
  expiresAt: string; // ISO date (yyyy-mm-dd)
  expirySource: ExpirySource;
  confidence?: number; // 0..1 for AI estimates
  priceHKD?: number;
  storageTip?: string;
  status: ItemStatus;
  closedAt?: string;
}

/** An item proposed by a scan, before the user confirms it. */
export interface DraftItem {
  key: string;
  name: string;
  nameZh?: string;
  category: Category;
  quantity: number;
  unit: string;
  storage: Storage;
  expiresAt: string;
  expirySource: ExpirySource;
  confidence?: number;
  priceHKD?: number;
  storageTip?: string;
  include: boolean;
}

export type ScanMode = 'receipt' | 'haul' | 'label';

export interface Recipe {
  title: string;
  titleZh: string;
  minutes: number;
  servings: number;
  uses: string[]; // inventory item names used
  missing: string[];
  steps: string[];
  why: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export const CATEGORIES: Category[] = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'eggs',
  'tofu',
  'bakery',
  'grains',
  'condiments',
  'snacks',
  'drinks',
  'frozen',
  'other',
];
