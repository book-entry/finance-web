import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';
export type LayoutMode = 'sidebar' | 'topnav';
export type ChipStyle = 'icon' | 'emoji' | 'dot';
export type Currency = 'HKD' | 'USD' | 'SGD' | 'CNY';
export type WeekStart = 'SUN' | 'MON';

/**
 * Per-device prefs. The money / categorisation toggles below will move to
 * server-side roaming storage when REQ-settings-backend §4 (P2) ships;
 * the field shape here is chosen to match the planned backend wire shape
 * so the migration is a one-line `useQuery` swap.
 */
type PrefsState = {
  theme: ThemeMode;
  layout: LayoutMode;
  chipStyle: ChipStyle;
  currency: Currency;
  weekStartsOn: WeekStart;
  roundToNearestDollar: boolean;
  autoCategorizeOnImport: boolean;
  setTheme: (v: ThemeMode) => void;
  setLayout: (v: LayoutMode) => void;
  setChipStyle: (v: ChipStyle) => void;
  setCurrency: (v: Currency) => void;
  setWeekStartsOn: (v: WeekStart) => void;
  setRoundToNearestDollar: (v: boolean) => void;
  setAutoCategorizeOnImport: (v: boolean) => void;
};

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      layout: 'sidebar',
      chipStyle: 'icon',
      currency: 'HKD',
      weekStartsOn: 'MON',
      roundToNearestDollar: false,
      autoCategorizeOnImport: true,
      setTheme: (theme) => set({ theme }),
      setLayout: (layout) => set({ layout }),
      setChipStyle: (chipStyle) => set({ chipStyle }),
      setCurrency: (currency) => set({ currency }),
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setRoundToNearestDollar: (roundToNearestDollar) =>
        set({ roundToNearestDollar }),
      setAutoCategorizeOnImport: (autoCategorizeOnImport) =>
        set({ autoCategorizeOnImport }),
    }),
    { name: 'splitwallet:prefs' },
  ),
);
