import { ResourceService, ResourceQuery } from './resourceService';
import { Candidate } from '@/types/entities';

export type CandidateStatus = Candidate['status'];
export type CandidateSource = 'import' | 'manual' | 'linkedin' | 'upload' | 'crawl' | 'pool';
export type ParsingStatus = 'pending' | 'success' | 'partial' | 'failed';
export type ConversionStatus = 'pending' | 'success' | 'failed';

export interface CandidateQuery extends ResourceQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  organization_id?: number;
  recruiter_id?: number;
  team_manager_id?: number;
  domain_id?: number;
  role_id?: number;
  status?: CandidateStatus;
  is_deleted?: boolean;
  parsing_status?: ParsingStatus;
  review_required?: boolean;
  import_batch_id?: number;
  active?: boolean;
  in_pipeline?: boolean;
}

export interface CreateCandidateInput {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  domain_id?: number | null;
  domain_name?: string | null;
  role_id?: number | null;
  role_name?: string | null;
  specialization_id?: number | null;
  specialization_name?: string | null;
  experience_years?: number | null;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  resume_url?: string | null;
  resume_filename?: string | null;
  source?: CandidateSource;
  status?: CandidateStatus;
  recruiter_id?: number | null;
  team_manager_id?: number | null;
  recruitment_manager_id?: number | null;
  employer_company_id?: number | null;
  skills?: string[] | null;
  languages?: string[] | null;
  previous_companies?: string[] | null;
  summary?: string | null;
  notes?: string | null;
  import_batch_id?: number | null;
  parsing_status?: ParsingStatus;
  conversion_status?: ConversionStatus;
  review_required?: boolean;
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {
  is_deleted?: boolean;
  deleted_by?: string | null;
  data_quality_score?: number;
  parsing_confidence?: number;
  is_duplicate_suspected?: boolean;
  duplicate_of_id?: number | null;
  original_resume_url?: string | null;
  converted_resume_url?: string | null;
}

export class CandidateService extends ResourceService<Candidate, CandidateQuery, CreateCandidateInput, UpdateCandidateInput> {
  constructor() { super('/candidates'); }
  updateStatus(id: number | string, status: CandidateStatus) { return this.update(id, { status }); }
}

export const candidateService = new CandidateService();
