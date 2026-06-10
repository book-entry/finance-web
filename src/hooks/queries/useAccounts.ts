import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, type CreateAccountInput } from '../../api/accounts';

export const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: () => accountsApi.list(),
    staleTime: 60_000,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

/**
 * Soft-close an account (DELETE /v1/accounts/{id} → status=CLOSED on the
 * backend). Transactions and balances are preserved; the card just becomes
 * "Closed" in the list.
 */
export function useCloseAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.close(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
