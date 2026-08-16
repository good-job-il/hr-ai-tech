import { httpClient } from '@/api/client/httpClient';

export interface SavedJobRecord {
  id: number;
  job_id: number;
  job_title: string | null;
  company: string | null;
  created_date: string;
}

export const savedJobService = {
  list: (jobId?: number) => httpClient.get<SavedJobRecord[]>(
    `/jobs/saved${jobId ? `?job_id=${jobId}` : ''}`,
    { cache: false },
  ),
  save: (payload: { job_id: number; job_title?: string | null; company?: string | null }) =>
    httpClient.post<SavedJobRecord>('/jobs/saved', payload),
  remove: (id: number) => httpClient.delete<void>(`/jobs/saved/${id}`),
};
