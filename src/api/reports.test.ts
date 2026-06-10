import { describe, expect, it } from 'vitest';
import { serialiseSummaryParams } from './reports';

describe('serialiseSummaryParams', () => {
  it('only sends range when no optional params provided', () => {
    expect(serialiseSummaryParams({ range: 'month' })).toEqual({
      range: 'month',
    });
  });

  it('includes asOf when provided', () => {
    expect(
      serialiseSummaryParams({ range: 'year', asOf: '2026-06-04' }),
    ).toEqual({ range: 'year', asOf: '2026-06-04' });
  });

  it('joins accountIds with commas so Spring binds List<UUID> natively', () => {
    expect(
      serialiseSummaryParams({
        range: 'month',
        accountIds: ['a', 'b', 'c'],
      }),
    ).toEqual({ range: 'month', accountIds: 'a,b,c' });
  });

  it('omits empty accountIds (would otherwise short-circuit on the server)', () => {
    expect(
      serialiseSummaryParams({ range: 'month', accountIds: [] }),
    ).toEqual({ range: 'month' });
  });
});
