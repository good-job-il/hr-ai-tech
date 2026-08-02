import { httpClient } from '@/api/client/httpClient';
import { ResourceService, ResourceQuery } from './resourceService';
import { Job } from '@/types/entities';

export interface JobQuery extends ResourceQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  organization_id?: number;
  employer_company_id?: number;
  recruiter_id?: number;
  domain_id?: number;
  is_closed?: boolean;
  is_deleted?: boolean;
}

export class JobService extends ResourceService<Job, JobQuery> {
  constructor() { super('/jobs'); }
  close(id: number | string) { return this.update(id, { is_closed: true }); }
  reopen(id: number | string) { return this.update(id, { is_closed: false }); }
  incrementViews(id: number | string) { return httpClient.post<void>(`/jobs/${id}/view`); }
}

export const jobService = new JobService();
