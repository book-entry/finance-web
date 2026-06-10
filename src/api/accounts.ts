import { apiClient } from './client';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'EXPENSE' | 'REVENUE';
export type AccountStatus = 'ACTIVE' | 'CLOSED';

export type Account = {
  accountId: string;
  accountName: string;
  bankName: string;
  bankCode?: string | null;
  accountCode?: string | null;
  accountType: AccountType;
  currency: string;
  openingBalance: number;
  status: AccountStatus;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAccountInput = {
  accountName: string;
  bankName: string;
  bankCode?: string;
  accountCode?: string;
  accountType: AccountType;
  currency: string;
  openingBalance?: number;
  description?: string;
};

export type UpdateAccountInput = Partial<{
  accountName: string;
  bankName: string;
  bankCode: string;
  accountCode: string;
  description: string;
}>;

const base = '/account/v1/accounts';

export const accountsApi = {
  list: async (params?: { status?: AccountStatus; type?: AccountType }) => {
    const { data } = await apiClient.get<Account[]>(base, { params });
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Account>(`${base}/${id}`);
    return data;
  },
  create: async (input: CreateAccountInput) => {
    const { data } = await apiClient.post<Account>(base, input);
    return data;
  },
  update: async (id: string, input: UpdateAccountInput) => {
    const { data } = await apiClient.put<Account>(`${base}/${id}`, input);
    return data;
  },
  close: async (id: string) => {
    await apiClient.delete(`${base}/${id}`);
  },
};
