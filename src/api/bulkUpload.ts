import { apiClient } from './client';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ErrorRow = {
  row: number;
  reason: string;
};

export type JobStatusResponse = {
  jobId: string;
  status: JobStatus;
  totalRows?: number;
  successCount?: number;
  errorCount?: number;
  errorRows?: ErrorRow[];
  createdAt: string;
  completedAt?: string;
};

export type UploadAcceptedResponse = {
  jobId: string;
};

const base = '/ingestion/v1/bulk-upload';

export const bulkUploadApi = {
  /** Multipart upload — returns 202 with a jobId for polling. */
  upload: async (csvFile: Blob | File, fileName = 'canonical.csv') => {
    const formData = new FormData();
    formData.append('file', csvFile, fileName);
    const { data } = await apiClient.post<UploadAcceptedResponse>(base, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  /** Poll job state — returns terminal status when status is COMPLETED or FAILED. */
  status: async (jobId: string) => {
    const { data } = await apiClient.get<JobStatusResponse>(`${base}/${jobId}`);
    return data;
  },
};
