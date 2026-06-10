import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { meApi, type Me, type UpdateMeInput } from '../../api/me';

export const meKeys = {
  all: ['me'] as const,
};

/**
 * Current authenticated user profile (P1 lean scope — Firebase passthrough).
 * Held with a long stale time because the only thing that changes it
 * client-side is the explicit PATCH from the Profile tab — that mutation
 * primes the cache directly via `setQueryData`, so background refetch
 * doesn't have to do the same work.
 */
export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    queryFn: () => meApi.get(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMeInput) => meApi.patch(input),
    onSuccess: (next: Me) => {
      qc.setQueryData<Me>(meKeys.all, next);
    },
  });
}
