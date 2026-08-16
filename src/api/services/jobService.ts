import { httpClient } from '@/api/client/httpClient';
import { ResourceService, ResourceQuery } from './resourceService';
import { Job } from '@/types/entities';

export interface JobQuery extends ResourceQuery {
  page?: number;
  limit?: number;
  sort?: 'created_date' | 'updated_date' | 'views' | 'title' | 'company';
  order?: 'ASC' | 'DESC';
  search?: string;
  organization_id?: number;
  employer_company_id?: number;
  recruiter_id?: number;
  team_manager_id?: number;
  domain_id?: number;
  type?: Job['type'];
  is_closed?: boolean;
  is_deleted?: boolean;
  seniority?: JobSeniority;
  recommended_for?: number;
}

export type JobSeniority = 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'any';

export interface CreateJobInput {
  title: string;
  company: string;
  company_initials?: string | null;
  company_color?: string | null;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  category?: string | null;
  type?: Job['type'];
  description?: string | null;
  employer_company_id?: number | null;
  recruiter_id?: number | null;
  team_manager_id?: number | null;
  recruitment_manager_id?: number | null;
  domain_id?: number | null;
  role_id?: number | null;
  specialization_id?: number | null;
  is_closed?: boolean;
  is_anonymous?: boolean;
  show_company_name?: boolean;
  show_company_info?: boolean;
  show_contact_details?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  required_skills?: string[] | null;
  preferred_skills?: string[] | null;
  role_domain?: string | null;
  seniority?: JobSeniority;
  years_experience_required?: number | null;
  ai_keywords?: string[] | null;
  apply_url?: string | null;
  external_id?: string | null;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  views?: number;
  applications_count?: number;
  job_code?: string | null;
  apply_email?: string | null;
  is_deleted?: boolean;
  deleted_by?: string | null;
}

export class JobService extends ResourceService<Job, JobQuery, CreateJobInput, UpdateJobInput> {
  constructor() { super('/jobs'); }
  close(id: number | string) { return this.update(id, { is_closed: true }); }
  reopen(id: number | string) { return this.update(id, { is_closed: false }); }
  incrementViews(id: number | string) { return httpClient.post<void>(`/jobs/${id}/view`); }
}

export const jobService = new JobService();
