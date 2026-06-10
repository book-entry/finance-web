import { describe, it, expect } from 'vitest';
import type { Category } from '../api/categories';
import { styleForCategory, DEFAULT_CATEGORY_SEED } from './categoryStyles';

function mk(o: Partial<Category>): Category {
  return {
    categoryId: 'c-1',
    name: 'Other',
    colourHex: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...o,
  };
}

describe('styleForCategory', () => {
  it('returns the preset for a known name (case-insensitive)', () => {
    const s = styleForCategory(mk({ name: 'GROCERIES' }));
    expect(s.color).toBe('#84CC16');
    expect(s.glyph).toBe('G');
    expect(s.emoji).toBe('🥬');
  });

  it('prefers the user-supplied colourHex over the preset', () => {
    const s = styleForCategory(mk({ name: 'Dining', colourHex: '#000000' }));
    expect(s.color).toBe('#000000');
    expect(s.emoji).toBe('🍜');
  });

  it('derives a 1-2 letter glyph for unknown names', () => {
    expect(styleForCategory(mk({ name: 'Pet care' })).glyph).toBe('PC');
    expect(styleForCategory(mk({ name: 'Streaming' })).glyph).toBe('S');
  });

  it('falls back to slate + generic dot for unknown names with no colour', () => {
    const s = styleForCategory(mk({ name: 'Pet care' }));
    expect(s.color).toBe('#94A3B8');
    expect(s.emoji).toBe('•');
  });
});

describe('DEFAULT_CATEGORY_SEED', () => {
  it('seeds 13 categories that all map to a preset', () => {
    expect(DEFAULT_CATEGORY_SEED.length).toBe(13);
    for (const seed of DEFAULT_CATEGORY_SEED) {
      const style = styleForCategory(mk({ name: seed.name }));
      expect(style.color).toBe(seed.colourHex);
    }
  });
});
