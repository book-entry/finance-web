import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoriesApi,
  type BulkCategoryItem,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '../../api/categories';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  summary: (id: string) => [...categoryKeys.all, 'summary', id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.list(),
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useBulkUpsertCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: BulkCategoryItem[]) => categoriesApi.bulkUpsert(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useCategorySummary(id: string | null) {
  return useQuery({
    queryKey: id ? categoryKeys.summary(id) : ['categories', 'summary', 'none'],
    queryFn: () => categoriesApi.summary(id!),
    enabled: id !== null,
  });
}
