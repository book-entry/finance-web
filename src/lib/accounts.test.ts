import { describe, it, expect } from 'vitest';
import type { Account } from '../api/accounts';
import {
  inferSubtype,
  gradientFor,
  lastFour,
  totalsFor,
  accountTypeLabel,
  balanceDeltasByAccount,
  currentBalance,
} from './accounts';
import type { Transaction } from '../api/transactions';

function mk(overrides: Partial<Account> = {}): Account {
  return {
    accountId: 'a-1',
    accountName: 'HSBC One',
    bankName: 'HSBC',
    bankCode: null,
    accountCode: '4012 8888 8888 8842',
    accountType: 'ASSET',
    currency: 'HKD',
    openingBalance: 1000,
    status: 'ACTIVE',
    description: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('inferSubtype', () => {
  it('flags LIABILITY accounts as credit', () => {
    expect(inferSubtype(mk({ accountType: 'LIABILITY', accountName: 'Red CC' }))).toBe('credit');
  });
  it('flags AlipayHK as a wallet', () => {
    expect(
      inferSubtype(mk({ bankName: 'AlipayHK', accountName: 'AlipayHK Wallet' })),
    ).toBe('wallet');
  });
  it('flags accounts named "Savings" as savings', () => {
    expect(inferSubtype(mk({ accountName: 'HSBC Savings' }))).toBe('savings');
  });
  it('defaults to current', () => {
    expect(inferSubtype(mk({ accountName: 'HSBC One' }))).toBe('current');
  });
});

describe('gradientFor', () => {
  it('picks the red HSBC gradient for current accounts', () => {
    expect(gradientFor(mk({ bankName: 'HSBC', accountName: 'HSBC One' }))).toContain(
      '#DB0011',
    );
  });
  it('picks the dark gradient for HSBC credit cards', () => {
    expect(
      gradientFor(mk({ bankName: 'HSBC', accountName: 'Red Credit Card', accountType: 'LIABILITY' })),
    ).toContain('#1E1B4B');
  });
  it('picks the green gradient for Standard Chartered', () => {
    expect(gradientFor(mk({ bankName: 'Standard Chartered' }))).toContain('#0E9F6E');
  });
  it('picks the orange gradient for Bank of China', () => {
    expect(gradientFor(mk({ bankName: 'Bank of China' }))).toContain('#C2410C');
  });
  it('falls back to indigo deep for unknown banks', () => {
    expect(gradientFor(mk({ bankName: 'Mystery Bank' }))).toContain('#4F46E5');
  });
});

describe('lastFour', () => {
  it('returns the last 4 digits stripping separators', () => {
    expect(lastFour('4012 8888 8888 8842')).toBe('8842');
  });
  it('handles IBAN-style codes by taking the final 4 chars', () => {
    expect(lastFour('HK 12 BCHK 0000 0001 2345 67')).toBe('4567');
  });
  it('returns null for empty / undefined', () => {
    expect(lastFour(null)).toBeNull();
    expect(lastFour(undefined)).toBeNull();
  });
  it('returns the whole string if shorter than 4 chars', () => {
    expect(lastFour('12')).toBe('12');
  });
});

describe('totalsFor', () => {
  it('sums assets and treats LIABILITY as debt', () => {
    const totals = totalsFor([
      mk({ accountType: 'ASSET', openingBalance: 1000 }),
      mk({ accountType: 'ASSET', openingBalance: 500 }),
      mk({ accountType: 'LIABILITY', openingBalance: 300 }),
    ]);
    expect(totals.assets).toBe(1500);
    expect(totals.debt).toBe(300);
    expect(totals.net).toBe(1200);
  });
  it('returns zeros for an empty list', () => {
    expect(totalsFor([])).toEqual({ assets: 0, debt: 0, net: 0 });
  });
});

describe('accountTypeLabel', () => {
  it('maps each enum to a sentence-case label', () => {
    expect(accountTypeLabel('ASSET')).toBe('Asset');
    expect(accountTypeLabel('LIABILITY')).toBe('Liability');
  });
});

describe('balance derivation from transactions', () => {
  const tx = (
    accountId: string,
    type: 'DEBIT' | 'CREDIT',
    amount: number,
  ): Transaction => ({
    transactionId: `t-${accountId}-${amount}`,
    accountId,
    entryType: type,
    amount,
    currency: 'HKD',
    transactionDate: '2026-05-24',
    reference: null,
    description: 'x',
    source: 'MANUAL',
    category: null,
    createdAt: '2026-05-24T00:00:00Z',
  });

  it('sums signed deltas grouped by accountId', () => {
    const deltas = balanceDeltasByAccount([
      tx('a', 'CREDIT', 100),
      tx('a', 'DEBIT', 30),
      tx('b', 'DEBIT', 50),
    ]);
    expect(deltas.get('a')).toBe(70);
    expect(deltas.get('b')).toBe(-50);
  });

  it('currentBalance adds the delta to the opening balance', () => {
    const account = mk({ accountId: 'a', openingBalance: 1000 });
    const deltas = balanceDeltasByAccount([tx('a', 'DEBIT', 200), tx('a', 'CREDIT', 50)]);
    expect(currentBalance(account, deltas)).toBe(850);
  });

  it('currentBalance falls back to opening balance when no deltas map is supplied', () => {
    const account = mk({ openingBalance: 500 });
    expect(currentBalance(account)).toBe(500);
  });

  it('totalsFor sees the live balance, not the opening balance', () => {
    const accounts = [
      mk({ accountId: 'a', accountType: 'ASSET', openingBalance: 1000 }),
      mk({ accountId: 'b', accountType: 'LIABILITY', openingBalance: 0 }),
    ];
    const deltas = balanceDeltasByAccount([
      tx('a', 'DEBIT', 300),
      tx('b', 'DEBIT', 500),
    ]);
    const totals = totalsFor(accounts, deltas);
    expect(totals.assets).toBe(700);
    expect(totals.debt).toBe(500);
    expect(totals.net).toBe(200);
  });
});
