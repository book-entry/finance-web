import type { Transaction } from '../api/transactions';
import { formatHKD } from './money';

/**
 * Signed amount in the rendering convention: CREDIT = positive (income),
 * DEBIT = negative (spend). The backend stores `amount` as a positive
 * decimal with the sign implied by `entryType` (spec §1.3).
 */
export function signedAmount(transaction: Transaction): number {
  return transaction.entryType === 'CREDIT' ? transaction.amount : -transaction.amount;
}

/** "Display name" for the merchant — backend has no first-class merchant field. */
export function displayName(transaction: Transaction): string {
  return (
    transaction.description?.trim() ||
    transaction.reference?.trim() ||
    'Untitled transaction'
  );
}

/** Format the signed amount according to currency. Uses HKD-aware formatter. */
export function formatTxnAmount(transaction: Transaction): string {
  const signed = signedAmount(transaction);
  if (transaction.currency === 'HKD') {
    return formatHKD(signed, { alwaysSign: signed > 0 });
  }
  const abs = Math.abs(signed);
  const sign = signed < 0 ? '−' : signed > 0 ? '+' : '';
  const body = new Intl.NumberFormat('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${transaction.currency} ${body}`;
}

/** Render the day-net total beside a day header. Currency-mixed days roll up in HKD. */
export function formatDayNet(transactions: Transaction[]): string {
  const total = transactions.reduce((acc, t) => acc + signedAmount(t), 0);
  return formatHKD(total, { alwaysSign: total > 0 });
}

/**
 * "Today" / "Yesterday" / "Monday, May 21" — anchored to the local-time
 * boundary so the first hours of a new local day still classify properly.
 */
export function formatDayHeader(dateStr: string, now: Date = new Date()): string {
  const d = parseDate(dateStr);
  const a = startOfDay(d);
  const b = startOfDay(now);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-HK', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export type DayGroup = {
  dateKey: string;
  label: string;
  net: string;
  transactions: Transaction[];
};

/**
 * Group transactions by their `transactionDate` (YYYY-MM-DD); newest day
 * first. Within a day rows preserve the API ordering.
 */
export function groupByDay(transactions: Transaction[], now: Date = new Date()): DayGroup[] {
  const byKey = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.transactionDate;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(t);
    else byKey.set(key, [t]);
  }
  return [...byKey.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([dateKey, txns]) => ({
      dateKey,
      label: formatDayHeader(dateKey, now),
      net: formatDayNet(txns),
      transactions: txns,
    }));
}

// ── internals ─────────────────────────────────────────────────────────────

function parseDate(value: string): Date {
  // Force local-time interpretation by appending T00:00:00 so day grouping
  // doesn't drift to the previous calendar day in HK time.
  return new Date(`${value}T00:00:00`);
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
