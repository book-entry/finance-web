const PALETTE = [
  '#F97316',
  '#EC4899',
  '#06B6D4',
  '#A855F7',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
  '#EF4444',
  '#84CC16',
  '#0EA5E9',
  '#D946EF',
];

/**
 * Stable, hash-derived color for a merchant name so the same merchant gets
 * the same tile every time. Ported from `merchColor()` in the prototype.
 */
export function merchantColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/**
 * 1–2 letter glyph for the merchant tile. Single word → first letter; multi
 * word → first letter of first two words. Always uppercase.
 */
export function merchantInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
