import { ResourceService, ResourceQuery } from './resourceService';
import { Candidate } from '@/types/entities';

export interface CandidateQuery extends ResourceQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  organization_id?: number;
  recruiter_id?: number;
  team_manager_id?: number;
  status?: string;
  is_deleted?: boolean;
}

export class CandidateService extends ResourceService<Candidate, CandidateQuery> {
  constructor() { super('/candidates'); }
  updateStatus(id: number | string, status: string) { return this.update(id, { status }); }
}

export const candidateService = new CandidateService();
