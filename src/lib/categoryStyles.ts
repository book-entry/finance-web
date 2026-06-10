import type { Category } from '../api/categories';

/**
 * Visual presets for the 13 categories the prototype showcases. Matched
 * case-insensitively by name. Any user-created category outside this list
 * falls back to the slate accent + an initial-derived glyph.
 */
export type CategoryStyle = {
  color: string;
  glyph: string;
  emoji: string;
};

const PRESETS: Record<string, CategoryStyle> = {
  groceries: { color: '#84CC16', glyph: 'G', emoji: '🥬' },
  dining: { color: '#F97316', glyph: 'D', emoji: '🍜' },
  transport: { color: '#06B6D4', glyph: 'T', emoji: '🚇' },
  shopping: { color: '#EC4899', glyph: 'S', emoji: '🛍️' },
  'bills & utils': { color: '#A855F7', glyph: 'B', emoji: '🧾' },
  bills: { color: '#A855F7', glyph: 'B', emoji: '🧾' },
  utilities: { color: '#A855F7', glyph: 'U', emoji: '🧾' },
  entertainment: { color: '#F59E0B', glyph: 'E', emoji: '🎬' },
  subscriptions: { color: '#6366F1', glyph: 'Sb', emoji: '📺' },
  health: { color: '#EF4444', glyph: 'H', emoji: '💊' },
  coffee: { color: '#B45309', glyph: 'C', emoji: '☕' },
  travel: { color: '#14B8A6', glyph: 'Tr', emoji: '✈️' },
  income: { color: '#10B981', glyph: 'I', emoji: '💰' },
  salary: { color: '#10B981', glyph: 'S', emoji: '💰' },
  transfer: { color: '#64748B', glyph: 'Tx', emoji: '↔️' },
  other: { color: '#94A3B8', glyph: '?', emoji: '•' },
};

const FALLBACK: CategoryStyle = {
  color: '#94A3B8',
  glyph: '?',
  emoji: '•',
};

/** Letters from the first 1–2 words, uppercased. e.g. "Pet care" → "PC". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Look up the preset style for a category. Falls back to:
 *   • the user-supplied {@link Category#colourHex} if present
 *   • derived initials for the glyph
 *   • a generic placeholder emoji
 */
export function styleForCategory(category: Category): CategoryStyle {
  const preset = PRESETS[category.name.trim().toLowerCase()];
  if (preset) {
    return {
      color: category.colourHex ?? preset.color,
      glyph: preset.glyph,
      emoji: preset.emoji,
    };
  }
  return {
    color: category.colourHex ?? FALLBACK.color,
    glyph: initialsOf(category.name),
    emoji: FALLBACK.emoji,
  };
}

/** Pre-seed list for first-time bulk upsert. */
export const DEFAULT_CATEGORY_SEED: { name: string; colourHex: string }[] = [
  { name: 'Groceries', colourHex: '#84CC16' },
  { name: 'Dining', colourHex: '#F97316' },
  { name: 'Transport', colourHex: '#06B6D4' },
  { name: 'Shopping', colourHex: '#EC4899' },
  { name: 'Bills & Utils', colourHex: '#A855F7' },
  { name: 'Entertainment', colourHex: '#F59E0B' },
  { name: 'Subscriptions', colourHex: '#6366F1' },
  { name: 'Health', colourHex: '#EF4444' },
  { name: 'Coffee', colourHex: '#B45309' },
  { name: 'Travel', colourHex: '#14B8A6' },
  { name: 'Income', colourHex: '#10B981' },
  { name: 'Transfer', colourHex: '#64748B' },
  { name: 'Other', colourHex: '#94A3B8' },
];
