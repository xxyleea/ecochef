import { create } from 'zustand';

import type { DraftItem, ScanMode } from './types';

/** Transient (not persisted) state handed from the Scan tab to the Review modal. */
interface DraftState {
  mode: ScanMode | 'sample' | null;
  drafts: DraftItem[];
  notes: string | null;
  set: (mode: DraftState['mode'], drafts: DraftItem[], notes: string | null) => void;
  update: (key: string, patch: Partial<DraftItem>) => void;
  clear: () => void;
}

export const useDrafts = create<DraftState>()((set, get) => ({
  mode: null,
  drafts: [],
  notes: null,
  set: (mode, drafts, notes) => set({ mode, drafts, notes }),
  update: (key, patch) => set({ drafts: get().drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)) }),
  clear: () => set({ mode: null, drafts: [], notes: null }),
}));
