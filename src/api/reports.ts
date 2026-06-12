import { apiClient, toArray } from './client';

/** Mirrors `ReportsSummaryResponse.range` on the backend (REQ-reports-summary §2.1). */
export type ReportsRange = 'month' | 'year';

/**
 * `null` on either side ⇒ frontend treats it as "can't compute" (drawn as em-dash
 * in the stat card). Backend sets these to null when transactions in scope span
 * multiple currencies — naive cross-currency sums would mislead the user.
 */
export type NetWorth = {
  current: number | null;
  previous: number | null;
  delta: number | null;
};

export type CategorySpend = {
  /** `null` is the uncategorised bucket. */
  categoryId: string | null;
  /** `null` when category is uncategorised OR when the category was soft-deleted between insert and query. */
  name: string | null;
  total: number;
  txnCount: number;
};

export type MonthlyTotal = {
  /** ISO `YYYY-MM` — backend serialises `YearMonth` with this pattern. */
  month: string;
  total: number;
};

export type MerchantSpend = {
  description: string;
  total: number;
  txnCount: number;
};

export type ReportsSummary = {
  range: ReportsRange;
  asOf: string;
  /** `null` when transactions in scope span multiple currencies — render a banner. */
  currency: string | null;
  netWorth: NetWorth;
  spendByCategory: CategorySpend[];
  incomeByMonth: MonthlyTotal[];
  spendByMonth: MonthlyTotal[];
  topMerchants: MerchantSpend[];
};

export type ReportsSummaryParams = {
  range: ReportsRange;
  asOf?: string;
  accountIds?: string[];
};

const base = '/transaction/v1/reports';

export const reportsApi = {
  summary: async (params: ReportsSummaryParams): Promise<ReportsSummary> => {
    const { data } = await apiClient.get<ReportsSummary>(`${base}/summary`, {
      params: serialiseSummaryParams(params),
    });
    // Guard each list field so an unexpected shape can't crash the report cards.
    return {
      ...data,
      spendByCategory: toArray<CategorySpend>(data?.spendByCategory),
      incomeByMonth: toArray<MonthlyTotal>(data?.incomeByMonth),
      spendByMonth: toArray<MonthlyTotal>(data?.spendByMonth),
      topMerchants: toArray<MerchantSpend>(data?.topMerchants),
    } as ReportsSummary;
  },
};

/**
 * Spring's `@RequestParam List<UUID>` accepts comma-joined values directly;
 * axios's default repeated-key form (`accountIds=a&accountIds=b`) requires
 * extra binder config that none of the other endpoints rely on. Stick with
 * the project convention from `transactions.ts`.
 */
export function serialiseSummaryParams(
  p: ReportsSummaryParams,
): Record<string, string> {
  const out: Record<string, string> = { range: p.range };
  if (p.asOf) out.asOf = p.asOf;
  if (p.accountIds && p.accountIds.length) out.accountIds = p.accountIds.join(',');
  return out;
}
