import { ResourceService, ResourceQuery } from './resourceService';
import { Application } from '@/types/entities';

export interface ApplicationQuery extends ResourceQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  job_id?: number;
  candidate_id?: number;
  candidate_email?: string;
  employer_company_id?: number;
  recruiter_id?: number;
  assigned_to?: number;
  status?: string;
  is_deleted?: boolean;
  search?: string;
}

export class ApplicationService extends ResourceService<Application, ApplicationQuery> {
  constructor() { super('/applications'); }
  updateStatus(id: number | string, status: string) { return this.update(id, { status }); }
  addNote(id: number | string, notes: string) { return this.update(id, { notes }); }
  assign(id: number | string, assigned_to: number) { return this.update(id, { assigned_to }); }
}

export const applicationService = new ApplicationService();
