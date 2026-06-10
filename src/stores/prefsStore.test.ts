import { beforeEach, describe, expect, it } from 'vitest';
import { usePrefsStore } from './prefsStore';

beforeEach(() => {
  localStorage.clear();
  usePrefsStore.setState({
    theme: 'dark',
    layout: 'sidebar',
    chipStyle: 'icon',
    currency: 'HKD',
    weekStartsOn: 'MON',
    roundToNearestDollar: false,
    autoCategorizeOnImport: true,
  });
});

describe('prefsStore', () => {
  it('defaults to dark / sidebar / icon', () => {
    const s = usePrefsStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.layout).toBe('sidebar');
    expect(s.chipStyle).toBe('icon');
  });

  it('switches layout independently of theme', () => {
    usePrefsStore.getState().setLayout('topnav');
    expect(usePrefsStore.getState().layout).toBe('topnav');
    expect(usePrefsStore.getState().theme).toBe('dark');
  });

  it('persists changes to localStorage', () => {
    usePrefsStore.getState().setTheme('light');
    const raw = localStorage.getItem('splitwallet:prefs');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.theme).toBe('light');
  });

  it('rotates through all chip styles', () => {
    const { setChipStyle } = usePrefsStore.getState();
    setChipStyle('emoji');
    expect(usePrefsStore.getState().chipStyle).toBe('emoji');
    setChipStyle('dot');
    expect(usePrefsStore.getState().chipStyle).toBe('dot');
    setChipStyle('icon');
    expect(usePrefsStore.getState().chipStyle).toBe('icon');
  });
});
