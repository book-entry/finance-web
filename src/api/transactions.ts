import { apiClient, toArray } from './client';

export type EntryType = 'DEBIT' | 'CREDIT';
export type TransactionSource = 'MANUAL' | 'BULK' | 'API';

export type CategoryRef = {
  id: string;
  name: string;
  isNew: boolean;
};

export type Transaction = {
  transactionId: string;
  accountId: string;
  entryType: EntryType;
  amount: number;
  currency: string;
  transactionDate: string;
  reference?: string | null;
  description?: string | null;
  source: TransactionSource;
  category?: CategoryRef | null;
  createdAt: string;
};

export type TransactionPage = {
  data: Transaction[];
  total: number;
  page: number;
  size: number;
};

export type CategorisedTransaction = {
  transaction: Transaction;
  category: CategoryRef;
};

export type TransactionListParams = {
  accountId?: string;
  categoryId?: string;
  categoryIds?: string[];
  uncategorized?: boolean;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  size?: number;
};

export type CreateTransactionInput = {
  accountId: string;
  entryType: EntryType;
  amount: number;
  currency: string;
  transactionDate: string;
  reference?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
};

/** Editable fields on PATCH /v1/transactions/{id}. */
export type UpdateTransactionInput = Partial<{
  description: string;
  reference: string;
  transactionDate: string;
}>;

export type AccountBalance = {
  accountId: string;
  currency: string;
  totalCredit: number;
  totalDebit: number;
  /** `totalCredit - totalDebit`, excludes the account-service-side openingBalance. */
  balance: number;
  txnCount: number;
  lastTxnDate: string | null;
};

export type BalancesResponse = {
  asOf: string;
  balances: AccountBalance[];
};

export type CountsResponse = {
  total: number;
  uncategorized: number;
  byCategory: Record<string, number>;
};

export type BulkCategoryInput = {
  transactionIds: string[];
} & ({ categoryId: string } | { categoryName: string });

export type BulkCategoryResponse = {
  updated: number;
  skipped: number;
  notFound: string[];
  category: CategoryRef;
};

export type BulkDeleteResponse = {
  deleted: number;
  notFound: string[];
};

const base = '/transaction/v1/transactions';

export const transactionsApi = {
  list: async (params: TransactionListParams = {}) => {
    const { data } = await apiClient.get<TransactionPage>(base, {
      params: serialiseListParams(params),
    });
    // Guard the row array so a skewed/unexpected page shape can't crash the
    // table with ".map is not a function".
    return { ...data, data: toArray<Transaction>(data?.data) } as TransactionPage;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Transaction>(`${base}/${id}`);
    return data;
  },
  create: async (input: CreateTransactionInput) => {
    const { data } = await apiClient.post<Transaction>(base, input);
    return data;
  },
  update: async (id: string, input: UpdateTransactionInput) => {
    const { data } = await apiClient.patch<Transaction>(`${base}/${id}`, input);
    return data;
  },
  categorise: async (
    id: string,
    body: { categoryId: string } | { categoryName: string },
  ) => {
    const { data } = await apiClient.patch<CategorisedTransaction>(
      `${base}/${id}/category`,
      body,
    );
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`${base}/${id}`);
  },
  bulkCategorise: async (input: BulkCategoryInput) => {
    const { data } = await apiClient.patch<BulkCategoryResponse>(
      `${base}/bulk-category`,
      input,
    );
    return data;
  },
  bulkDelete: async (transactionIds: string[]) => {
    const { data } = await apiClient.delete<BulkDeleteResponse>(`${base}/bulk`, {
      data: { transactionIds },
    });
    return data;
  },
  balances: async (params: { asOf?: string; accountIds?: string[] } = {}) => {
    const { data } = await apiClient.get<BalancesResponse>(`${base}/balances`, {
      params: serialiseBalanceParams(params),
    });
    return { ...data, balances: toArray<AccountBalance>(data?.balances) } as BalancesResponse;
  },
  counts: async () => {
    const { data } = await apiClient.get<CountsResponse>(`${base}/counts`);
    return data;
  },
};

/**
 * Axios serialises arrays as `categoryIds=a&categoryIds=b` by default, which
 * Spring's `@RequestParam List<UUID>` doesn't accept. We use the comma-list
 * form that Spring's binder unwraps natively.
 */
function serialiseListParams(p: TransactionListParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (p.accountId) out.accountId = p.accountId;
  if (p.categoryId) out.categoryId = p.categoryId;
  if (p.categoryIds && p.categoryIds.length) out.categoryIds = p.categoryIds.join(',');
  if (p.uncategorized) out.uncategorized = true;
  if (p.from) out.from = p.from;
  if (p.to) out.to = p.to;
  if (p.q && p.q.trim()) out.q = p.q.trim();
  if (p.page) out.page = p.page;
  if (p.size) out.size = p.size;
  return out;
}

function serialiseBalanceParams(p: {
  asOf?: string;
  accountIds?: string[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.asOf) out.asOf = p.asOf;
  if (p.accountIds && p.accountIds.length) out.accountIds = p.accountIds.join(',');
  return out;
}
