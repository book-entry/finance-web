import { apiClient, toArray } from './client';

export type Category = {
  categoryId: string;
  userId?: string;
  name: string;
  colourHex?: string | null;
  createdAt: string;
};

export type CategorySummary = {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  totalAmount: number;
  currency: string | null;
};

export type BulkCategoryItem = {
  name: string;
  colourHex?: string;
};

export type CategoryBulkResponse = {
  created: number;
  skipped: number;
  categories: { categoryId: string; name: string }[];
};

export type CreateCategoryInput = {
  name: string;
  colourHex?: string;
};

export type UpdateCategoryInput = Partial<{
  name: string;
  colourHex: string;
}>;

const base = '/transaction/v1/categories';

export const categoriesApi = {
  list: async () => {
    const { data } = await apiClient.get<Category[]>(base);
    return toArray<Category>(data);
  },
  create: async (input: CreateCategoryInput) => {
    const { data } = await apiClient.post<Category>(base, input);
    return data;
  },
  // Spec §3.3 — request body is a bare array of items, not wrapped in an object.
  bulkUpsert: async (items: BulkCategoryItem[]) => {
    const { data } = await apiClient.post<CategoryBulkResponse>(`${base}/bulk`, items);
    return {
      ...data,
      categories: toArray<{ categoryId: string; name: string }>(data?.categories),
    } as CategoryBulkResponse;
  },
  summary: async (id: string) => {
    const { data } = await apiClient.get<CategorySummary>(`${base}/${id}/summary`);
    return data;
  },
  update: async (id: string, input: UpdateCategoryInput) => {
    const { data } = await apiClient.put<Category>(`${base}/${id}`, input);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`${base}/${id}`);
  },
};
