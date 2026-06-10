/** Split an array into chunks of at most `size` items. */
export function chunked<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error('chunked() size must be > 0');
  if (items.length <= size) return items.length ? [items] : [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
