import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  transactionsApi,
  type BulkCategoryInput,
  type CreateTransactionInput,
  type TransactionListParams,
  type UpdateTransactionInput,
} from '../../api/transactions';
import { categoryKeys } from './useCategories';
import { accountKeys } from './useAccounts';
import { reportsKeys } from './useReportsSummary';
import { chunked } from '../../lib/chunked';

const BULK_CHUNK = 500;

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params: TransactionListParams) =>
    [...transactionKeys.all, 'list', params] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
  balances: () => [...transactionKeys.all, 'balances'] as const,
  counts: () => [...transactionKeys.all, 'counts'] as const,
};

const invalidateAfterMutation = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: transactionKeys.all });
  void qc.invalidateQueries({ queryKey: accountKeys.all });
  void qc.invalidateQueries({ queryKey: reportsKeys.all });
};

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => transactionsApi.list(params),
    staleTime: 30_000,
  });
}

/** Per-account balance roll-ups computed by the transaction service. */
export function useTransactionBalances() {
  return useQuery({
    queryKey: transactionKeys.balances(),
    queryFn: () => transactionsApi.balances(),
    staleTime: 60_000,
  });
}

/** Total + uncategorized + per-category counts. Honest at any data size. */
export function useTransactionCounts() {
  return useQuery({
    queryKey: transactionKeys.counts(),
    queryFn: () => transactionsApi.counts(),
    staleTime: 60_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionsApi.create(input),
    onSuccess: () => {
      invalidateAfterMutation(qc);
      void qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      transactionsApi.update(id, input),
    onSuccess: () => invalidateAfterMutation(qc),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { categoryId: string } | { categoryName: string };
    }) => transactionsApi.categorise(id, body),
    onSuccess: (result) => {
      invalidateAfterMutation(qc);
      if (result.category.isNew) {
        void qc.invalidateQueries({ queryKey: categoryKeys.all });
      }
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => invalidateAfterMutation(qc),
  });
}

export type BulkCategoryOutcome = {
  updated: number;
  skipped: number;
  notFoundCount: number;
  /** Whether the resolution created a new category (true only when name path). */
  isNew: boolean;
  /** The resolved category name (echoed back from server). */
  name: string;
};

/**
 * Bulk re-categorise. Chunks over the 500-row server cap when needed; a name
 * input is resolved server-side once per chunk, so subsequent chunks pass the
 * already-resolved categoryId to avoid creating duplicates.
 */
export function useBulkCategorize() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkCategoryInput): Promise<BulkCategoryOutcome> => {
      const chunks = chunked(input.transactionIds, BULK_CHUNK);
      let updated = 0;
      let skipped = 0;
      const notFound: string[] = [];
      let resolvedCategoryId: string | null =
        'categoryId' in input ? input.categoryId : null;
      let resolvedName = 'categoryName' in input ? input.categoryName : '';
      let isNew = false;

      for (let i = 0; i < chunks.length; i++) {
        const ids = chunks[i];
        const body: BulkCategoryInput =
          resolvedCategoryId !== null
            ? { transactionIds: ids, categoryId: resolvedCategoryId }
            : { transactionIds: ids, categoryName: resolvedName };
        const result = await transactionsApi.bulkCategorise(body);
        updated += result.updated;
        skipped += result.skipped;
        notFound.push(...result.notFound);
        // Snapshot the server's resolution so later chunks reuse the same id.
        resolvedCategoryId = result.category.id;
        resolvedName = result.category.name;
        if (i === 0) isNew = result.category.isNew;
      }
      return { updated, skipped, notFoundCount: notFound.length, isNew, name: resolvedName };
    },
    onSuccess: (_result, variables) => {
      invalidateAfterMutation(qc);
      if ('categoryName' in variables) {
        void qc.invalidateQueries({ queryKey: categoryKeys.all });
      }
    },
  });
}

export type BulkDeleteOutcome = {
  deleted: number;
  notFoundCount: number;
};

/** Bulk soft-delete. Chunks at 500 like the bulk-category endpoint. */
export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionIds: string[]): Promise<BulkDeleteOutcome> => {
      const chunks = chunked(transactionIds, BULK_CHUNK);
      let deleted = 0;
      const notFound: string[] = [];
      for (const ids of chunks) {
        const result = await transactionsApi.bulkDelete(ids);
        deleted += result.deleted;
        notFound.push(...result.notFound);
      }
      return { deleted, notFoundCount: notFound.length };
    },
    onSuccess: () => invalidateAfterMutation(qc),
  });
}
