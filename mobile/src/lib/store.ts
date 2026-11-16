import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { addDays, todayISO } from './dates';
import { deviceLang, type Lang } from './locale';
import type { DraftItem, Item, Storage } from './types';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface AppState {
  items: Item[];
  lang: Lang;
  remindersOn: boolean;
  hydrated: boolean;
  addDrafts: (drafts: DraftItem[]) => void;
  addItem: (item: Omit<Item, 'id' | 'addedAt' | 'status'>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  /** Use some or all of an item. amount undefined = all. */
  consume: (id: string, amount?: number) => void;
  toss: (id: string) => void;
  moveTo: (id: string, storage: Storage, newExpiry?: string) => void;
  remove: (id: string) => void;
  markUsedByNames: (names: string[]) => void;
  setLang: (lang: Lang) => void;
  setReminders: (on: boolean) => void;
  clearAll: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      lang: deviceLang(),
      remindersOn: true,
      hydrated: false,

      addDrafts: (drafts) => {
        const now = new Date().toISOString();
        const fresh: Item[] = drafts
          .filter((d) => d.include)
          .map((d) => ({
            id: uid(),
            name: d.name.trim() || 'Item',
            nameZh: d.nameZh?.trim() || undefined,
            category: d.category,
            quantity: d.quantity > 0 ? d.quantity : 1,
            unit: d.unit || 'pcs',
            storage: d.storage,
            addedAt: now,
            expiresAt: d.expiresAt,
            expirySource: d.expirySource,
            confidence: d.confidence,
            priceHKD: d.priceHKD,
            storageTip: d.storageTip,
            status: 'active',
          }));
        set({ items: [...fresh, ...get().items] });
      },

      addItem: (item) =>
        set({
          items: [{ ...item, id: uid(), addedAt: new Date().toISOString(), status: 'active' }, ...get().items],
        }),

      updateItem: (id, patch) => set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),

      consume: (id, amount) => {
        const now = new Date().toISOString();
        const items = get().items;
        const item = items.find((i) => i.id === id);
        if (!item) return;
        if (amount === undefined || amount >= item.quantity) {
          set({ items: items.map((i) => (i.id === id ? { ...i, status: 'used', closedAt: now } : i)) });
          return;
        }
        // Split: the used portion becomes a closed record, the rest stays active.
        const share = amount / item.quantity;
        const usedPart: Item = {
          ...item,
          id: uid(),
          quantity: amount,
          priceHKD: item.priceHKD !== undefined ? +(item.priceHKD * share).toFixed(1) : undefined,
          status: 'used',
          closedAt: now,
        };
        const rest: Item = {
          ...item,
          quantity: +(item.quantity - amount).toFixed(2),
          priceHKD: item.priceHKD !== undefined ? +(item.priceHKD * (1 - share)).toFixed(1) : undefined,
        };
        set({ items: [usedPart, ...items.map((i) => (i.id === id ? rest : i))] });
      },

      toss: (id) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, status: 'wasted', closedAt: new Date().toISOString() } : i,
          ),
        }),

      moveTo: (id, storage, newExpiry) =>
        set({
          items: get().items.map((i) => {
            if (i.id !== id) return i;
            // Freezing extends life a lot; default to +60 days from today when no better estimate is given.
            const expiresAt = newExpiry ?? (storage === 'freezer' ? addDays(todayISO(), 60) : i.expiresAt);
            return { ...i, storage, expiresAt, expirySource: newExpiry ? i.expirySource : 'estimate' };
          }),
        }),

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      markUsedByNames: (names) => {
        const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
        const now = new Date().toISOString();
        set({
          items: get().items.map((i) =>
            i.status === 'active' && wanted.has(i.name.trim().toLowerCase())
              ? { ...i, status: 'used', closedAt: now }
              : i,
          ),
        });
      },

      setLang: (lang) => set({ lang }),
      setReminders: (on) => set({ remindersOn: on }),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'ecochef-v1',
      // During web server-rendering there is no `window`; use a no-op store there.
      storage: createJSONStorage(() =>
        typeof window === 'undefined'
          ? { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }
          : AsyncStorage,
      ),
      partialize: (s) => ({ items: s.items, lang: s.lang, remindersOn: s.remindersOn }),
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

export function activeItems(items: Item[]): Item[] {
  return items
    .filter((i) => i.status === 'active')
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
}
