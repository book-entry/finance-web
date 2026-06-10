import { describe, it, expect } from 'vitest';
import { formatHKD, formatHKDCompact } from './money';

describe('formatHKD', () => {
  it('formats positive values without a sign by default', () => {
    expect(formatHKD(1234.5)).toBe('HK$1,234.50');
  });

  it('uses U+2212 minus for negative values, not a hyphen', () => {
    const out = formatHKD(-89);
    expect(out).toBe('HK$−89.00');
    expect(out.includes('-')).toBe(false);
  });

  it('honors alwaysSign for positives', () => {
    expect(formatHKD(56800, { alwaysSign: true })).toBe('HK$+56,800.00');
  });

  it('drops the HK$ prefix when bare', () => {
    expect(formatHKD(-12.3, { bare: true })).toBe('−12.30');
  });
});

describe('formatHKDCompact', () => {
  it('uses k for values ≥ 1000', () => {
    expect(formatHKDCompact(26800)).toBe('HK$26.8k');
  });

  it('formats sub-thousand values without k', () => {
    expect(formatHKDCompact(642)).toBe('HK$642');
  });

  it('uses the U+2212 minus for negatives', () => {
    expect(formatHKDCompact(-3240)).toBe('−HK$3.2k');
  });
});
