import { useQuery } from '@tanstack/react-query';
import {
  reportsApi,
  type ReportsSummaryParams,
} from '../../api/reports';

export const reportsKeys = {
  all: ['reports'] as const,
  summary: (params: ReportsSummaryParams) =>
    [...reportsKeys.all, 'summary', params] as const,
};

/**
 * One-shot Dashboard / Reports aggregate. Server-side aggregation means
 * the page does not depend on how many transactions the user has — a 10k-row
 * user gets the same payload size as an empty one.
 */
export function useReportsSummary(params: ReportsSummaryParams) {
  return useQuery({
    queryKey: reportsKeys.summary(params),
    queryFn: () => reportsApi.summary(params),
    staleTime: 60_000,
  });
}
