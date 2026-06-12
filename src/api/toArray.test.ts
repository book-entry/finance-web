import { describe, it, expect } from 'vitest';
import { toArray } from './client';

describe('toArray', () => {
  it('returns a bare array unchanged', () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });
  it('unwraps a { data: [] } envelope', () => {
    expect(toArray({ data: ['a', 'b'] })).toEqual(['a', 'b']);
  });
  it('unwraps a Spring { content: [] } page', () => {
    expect(toArray({ content: [{ id: 1 }], totalElements: 1 })).toEqual([{ id: 1 }]);
  });
  it('falls back to [] for null / undefined', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
  });
  it('falls back to [] for an unexpected object shape (no crash)', () => {
    expect(toArray({ oops: true })).toEqual([]);
    expect(toArray('a string')).toEqual([]);
  });
});
