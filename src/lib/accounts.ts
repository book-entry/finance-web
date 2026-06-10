import type { Account, AccountType } from '../api/accounts';
import type { BalancesResponse, Transaction } from '../api/transactions';

/**
 * Consumer-friendly subtype inferred from accountType + bank/account names.
 * Used only for picking the bank-card gradient — the backend doesn't store this.
 */
export type AccountSubtype = 'current' | 'savings' | 'credit' | 'wallet';

const WALLET_BANKS = ['alipay', 'wechat', 'octopus', 'payme', 'tng'];

export function inferSubtype(account: Account): AccountSubtype {
  const name = account.accountName.toLowerCase();
  const bank = account.bankName.toLowerCase();

  if (WALLET_BANKS.some((w) => bank.includes(w)) || name.includes('wallet')) {
    return 'wallet';
  }
  if (
    account.accountType === 'LIABILITY' ||
    name.includes('credit') ||
    name.includes('card')
  ) {
    return 'credit';
  }
  if (name.includes('saving')) return 'savings';
  return 'current';
}

const GRADIENT_FALLBACK = 'linear-gradient(135deg, #4F46E5 0%, #1E1B4B 100%)';

/**
 * Pick a gradient for a bank card. Recognizes the HK banks the prototype
 * showcases; everything else falls back to the indigo deep gradient.
 */
export function gradientFor(account: Account): string {
  const bank = account.bankName.toLowerCase();
  const subtype = inferSubtype(account);

  if (bank.includes('hsbc')) {
    if (subtype === 'credit') return 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)';
    if (subtype === 'savings') return 'linear-gradient(135deg, #4F46E5 0%, #1E1B4B 100%)';
    return 'linear-gradient(135deg, #DB0011 0%, #7B0008 100%)';
  }
  if (bank.includes('standard chartered') || bank.includes('scb')) {
    return 'linear-gradient(135deg, #0E9F6E 0%, #064E3B 100%)';
  }
  if (bank.includes('bank of china') || bank === 'boc' || bank.includes('boc ')) {
    return 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)';
  }
  if (bank.includes('hang seng')) {
    return 'linear-gradient(135deg, #15803D 0%, #052E16 100%)';
  }
  if (bank.includes('citi')) {
    return 'linear-gradient(135deg, #0EA5E9 0%, #075985 100%)';
  }
  if (bank.includes('alipay')) {
    return 'linear-gradient(135deg, #0EA5E9 0%, #0C4A6E 100%)';
  }
  return GRADIENT_FALLBACK;
}

/** Last 4 visible chars of accountCode, stripping spaces & non-alphanumerics. */
export function lastFour(accountCode: string | null | undefined): string | null {
  if (!accountCode) return null;
  const digits = accountCode.replace(/[^A-Za-z0-9]/g, '');
  if (digits.length < 4) return digits || null;
  return digits.slice(-4);
}

/**
 * Group transactions by `accountId` and reduce each bucket to a signed delta
 * applied to the account's `openingBalance`. Kept as a pure helper for tests
 * and any offline / pre-fetch context; the live data path uses
 * {@link balanceDeltasFromBalancesResponse} below.
 */
export function balanceDeltasByAccount(
  transactions: Transaction[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of transactions) {
    const delta = t.entryType === 'CREDIT' ? t.amount : -t.amount;
    m.set(t.accountId, (m.get(t.accountId) ?? 0) + delta);
  }
  return m;
}

/**
 * Build the same `accountId → signed delta` map directly from the
 * transaction-service's pre-computed {@code /balances} response. The server
 * has already done the SUM, so each account's `balance` field is the delta
 * we add to `openingBalance`.
 */
export function balanceDeltasFromBalancesResponse(
  response: BalancesResponse | undefined,
): Map<string, number> {
  const m = new Map<string, number>();
  if (!response) return m;
  for (const b of response.balances) {
    m.set(b.accountId, b.balance);
  }
  return m;
}

/**
 * Map account → transaction count, sourced from the same {@code /balances}
 * response so the counts shown on the account chips don't lie above any
 * page-size cap.
 */
export function txnCountsFromBalancesResponse(
  response: BalancesResponse | undefined,
): Map<string, number> {
  const m = new Map<string, number>();
  if (!response) return m;
  for (const b of response.balances) {
    m.set(b.accountId, b.txnCount);
  }
  return m;
}

/**
 * Current balance for one account = `openingBalance + sum(credit − debit)`.
 * Pass a precomputed delta map from {@link balanceDeltasByAccount} to avoid
 * re-summing the transaction list for every card.
 */
export function currentBalance(
  account: Account,
  deltas?: Map<string, number>,
): number {
  const opening = account.openingBalance ?? 0;
  const delta = deltas?.get(account.accountId) ?? 0;
  return opening + delta;
}

export type AccountTotals = {
  assets: number;
  debt: number;
  net: number;
};

/**
 * Roll-up totals for the Accounts page header. Assets are anything stored as
 * a positive value; debt is the absolute value of LIABILITY accounts.
 *
 * When `deltas` is supplied, each account's balance is `opening + delta`
 * (today's number). Without it, totals reflect the opening balance only.
 */
export function totalsFor(
  accounts: Account[],
  deltas?: Map<string, number>,
): AccountTotals {
  let assets = 0;
  let debt = 0;
  for (const account of accounts) {
    const balance = currentBalance(account, deltas);
    if (account.accountType === 'LIABILITY') {
      debt += Math.abs(balance);
    } else {
      assets += balance;
    }
  }
  return { assets, debt, net: assets - debt };
}

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  EXPENSE: 'Expense',
  REVENUE: 'Revenue',
};

export function accountTypeLabel(type: AccountType): string {
  return TYPE_LABELS[type];
}
