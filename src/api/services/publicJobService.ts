import { httpClient } from '@/api/client/httpClient';
import { asList, buildQuery } from './resourceService';
import type { PaginatedResponse } from '@/types/api';
import type { Job } from '@/types/entities';
import type { JobQuery } from './jobService';

export type PublicJobQuery = Pick<JobQuery,
  'page' | 'limit' | 'sort' | 'order' | 'search' | 'employer_company_id' | 'domain_id' | 'type' | 'seniority'
>;

export const publicJobService = {
  async list(query: PublicJobQuery = {}): Promise<Job[]> {
    const response = await httpClient.get<Job[] | PaginatedResponse<Job>>(
      `/public/jobs${buildQuery(query)}`,
      { cache: false },
    );
    return asList(response);
  },
  get: (id: number | string) => httpClient.get<Job>(`/public/jobs/${id}`, { cache: false }),
  incrementViews: (id: number | string) => httpClient.post<void>(`/jobs/${id}/view`),
};
