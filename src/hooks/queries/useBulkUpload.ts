import { useMutation, useQuery } from '@tanstack/react-query';
import { bulkUploadApi } from '../../api/bulkUpload';
import { transactionKeys } from './useTransactions';
import { useQueryClient } from '@tanstack/react-query';

export function useBulkUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ blob, fileName }: { blob: Blob; fileName?: string }) =>
      bulkUploadApi.upload(blob, fileName),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['bulk-upload', 'job', jobId],
    queryFn: () => bulkUploadApi.status(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1500;
      return data.status === 'COMPLETED' || data.status === 'FAILED' ? false : 1500;
    },
  });
}
