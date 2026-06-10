import { describe, it, expect } from 'vitest';
import { chunked } from './chunked';

describe('chunked', () => {
  it('returns an empty list for empty input', () => {
    expect(chunked([], 5)).toEqual([]);
  });
  it('returns a single chunk when input fits', () => {
    expect(chunked([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });
  it('slices on size boundaries', () => {
    expect(chunked([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });
  it('throws on a non-positive size', () => {
    expect(() => chunked([1], 0)).toThrow();
    expect(() => chunked([1], -1)).toThrow();
  });
});
