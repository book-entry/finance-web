import { describe, it, expect } from 'vitest';
import type { Transaction } from '../api/transactions';
import {
  signedAmount,
  displayName,
  formatTxnAmount,
  formatDayNet,
  formatDayHeader,
  groupByDay,
} from './transactions';

function mk(o: Partial<Transaction>): Transaction {
  return {
    transactionId: o.transactionId ?? 't',
    accountId: o.accountId ?? 'a',
    entryType: o.entryType ?? 'DEBIT',
    amount: o.amount ?? 0,
    currency: o.currency ?? 'HKD',
    transactionDate: o.transactionDate ?? '2026-05-24',
    reference: o.reference ?? null,
    description: o.description ?? null,
    source: o.source ?? 'MANUAL',
    category: o.category ?? null,
    createdAt: '2026-05-24T00:00:00Z',
  };
}

describe('signedAmount', () => {
  it('returns positive for CREDIT (income)', () => {
    expect(signedAmount(mk({ entryType: 'CREDIT', amount: 56800 }))).toBe(56800);
  });
  it('returns negative for DEBIT (spend)', () => {
    expect(signedAmount(mk({ entryType: 'DEBIT', amount: 384.2 }))).toBe(-384.2);
  });
});

describe('displayName', () => {
  it('uses description first, then reference, then a fallback', () => {
    expect(displayName(mk({ description: 'ParknShop' }))).toBe('ParknShop');
    expect(displayName(mk({ description: '', reference: 'INV-001' }))).toBe('INV-001');
    expect(displayName(mk({}))).toBe('Untitled transaction');
  });
});

describe('formatTxnAmount', () => {
  it('formats HKD spend with U+2212', () => {
    expect(formatTxnAmount(mk({ entryType: 'DEBIT', amount: 384.2 }))).toBe('HK$−384.20');
  });
  it('formats HKD income with a leading +', () => {
    expect(formatTxnAmount(mk({ entryType: 'CREDIT', amount: 56800 }))).toBe('HK$+56,800.00');
  });
  it('formats foreign currency with explicit code prefix', () => {
    expect(
      formatTxnAmount(mk({ entryType: 'DEBIT', amount: 12.5, currency: 'USD' })),
    ).toBe('−USD 12.50');
  });
});

describe('formatDayNet', () => {
  it('sums day rows and renders with a sign', () => {
    const txns = [
      mk({ entryType: 'CREDIT', amount: 56800 }),
      mk({ entryType: 'DEBIT', amount: 1500 }),
    ];
    expect(formatDayNet(txns)).toBe('HK$+55,300.00');
  });
});

describe('formatDayHeader', () => {
  const today = new Date(2026, 4, 24); // May 24, 2026 local time
  it('says "Today" for the local-day match', () => {
    expect(formatDayHeader('2026-05-24', today)).toBe('Today');
  });
  it('says "Yesterday" for the day before', () => {
    expect(formatDayHeader('2026-05-23', today)).toBe('Yesterday');
  });
  it('falls back to weekday + month + day', () => {
    const out = formatDayHeader('2026-05-20', today);
    expect(out).toMatch(/^Wed(nesday)?, /);
    expect(out).toContain('May');
    expect(out).toContain('20');
  });
});

describe('groupByDay', () => {
  it('groups by transactionDate, newest day first', () => {
    const groups = groupByDay(
      [
        mk({ transactionId: '1', transactionDate: '2026-05-23', amount: 10, entryType: 'DEBIT' }),
        mk({ transactionId: '2', transactionDate: '2026-05-24', amount: 20, entryType: 'DEBIT' }),
        mk({ transactionId: '3', transactionDate: '2026-05-23', amount: 5, entryType: 'CREDIT' }),
      ],
      new Date(2026, 4, 24),
    );
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-05-24', '2026-05-23']);
    expect(groups[1].transactions.map((t) => t.transactionId)).toEqual(['1', '3']);
    expect(groups[0].label).toBe('Today');
    expect(groups[1].label).toBe('Yesterday');
  });
});
