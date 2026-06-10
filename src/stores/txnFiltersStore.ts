import { create } from 'zustand';

export type CategoryFilter = string | 'uncategorized' | null;

type TxnFiltersState = {
  accountId: string | null;
  categoryFilter: CategoryFilter;
  search: string;
  selectedIds: Set<string>;
  setAccount: (id: string | null) => void;
  setCategory: (value: CategoryFilter) => void;
  setSearch: (value: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: Iterable<string>) => void;
  clearSelected: () => void;
  selectAll: (ids: Iterable<string>) => void;
};

export const useTxnFiltersStore = create<TxnFiltersState>((set) => ({
  accountId: null,
  categoryFilter: null,
  search: '',
  selectedIds: new Set(),
  setAccount: (accountId) => set({ accountId, selectedIds: new Set() }),
  setCategory: (categoryFilter) => set({ categoryFilter, selectedIds: new Set() }),
  setSearch: (search) => set({ search }),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  setSelected: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelected: () => set({ selectedIds: new Set() }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
}));
