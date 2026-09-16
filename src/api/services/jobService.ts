import { httpClient } from "@/api/client/httpClient"
import { ResourceService, ResourceQuery } from "./resourceService"
import { Job } from "@/types/entities"

export interface JobQuery extends ResourceQuery {
  page?: number
  limit?: number
  sort?: "created_date" | "updated_date" | "views" | "title" | "company"
  order?: "ASC" | "DESC"
  search?: string
  organization_id?: number
  employer_company_id?: number
  recruiter_id?: number
  team_manager_id?: number
  domain_id?: number
  type?: Job["type"]
  employment_type_id?: number
  work_mode_id?: number
  is_closed?: boolean
  state?: JobState
  is_deleted?: boolean
  seniority?: JobSeniority
  recommended_for?: number
}

export type JobSeniority = "junior" | "mid" | "senior" | "lead" | "manager" | "director" | "any"
export type JobState = "draft" | "open" | "on_hold" | "filled" | "closed"
export type JobSource = "manual" | "import" | "crawler" | "api"

export interface JobStats {
  total: number
  draft: number
  open: number
  on_hold: number
  filled: number
  closed: number
}

export interface JobImportProvenance {
  job_id: number
  imported: boolean
  source_job_record_id: number | null
  import_source_id?: number
  external_key?: string
  lifecycle?: string
  source_posting_url?: string | null
  source_apply_url?: string | null
  field_provenance?: Record<
    string,
    {
      ownership: "platform" | "user" | "source_until_edited" | "review_on_conflict"
      connector_type: string
      source_path: string | null
      observed_at: string
      confidence: number
    }
  >
  confidence?: number
  validation_issues?: Array<{
    code: string
    field: string | null
    message: string
    severity: "warning" | "error"
  }>
  first_seen_at?: string
  last_seen_at?: string
}

export interface CreateJobInput {
  title: string
  company: string
  company_initials?: string | null
  company_color?: string | null
  location?: string | null
  salary_min?: number | null
  salary_max?: number | null
  category?: string | null
  type?: Job["type"]
  employment_type_id?: number | null
  work_mode_id?: number | null
  source?: JobSource
  description?: string | null
  employer_company_id?: number | null
  recruiter_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  domain_id?: number | null
  role_id?: number | null
  specialization_id?: number | null
  is_closed?: boolean
  state?: JobState
  is_anonymous?: boolean
  show_company_name?: boolean
  show_company_info?: boolean
  show_contact_details?: boolean
  contact_email?: string | null
  contact_phone?: string | null
  required_skills?: string[] | null
  preferred_skills?: string[] | null
  role_domain?: string | null
  seniority?: JobSeniority
  years_experience_required?: number | null
  ai_keywords?: string[] | null
  external_id?: string | null
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  views?: number
  applications_count?: number
  is_deleted?: boolean
  deleted_by?: string | null
}

export class JobService extends ResourceService<Job, JobQuery, CreateJobInput, UpdateJobInput> {
  constructor() {
    super("/jobs")
  }
  stats() {
    return httpClient.get<JobStats>("/jobs/stats", { cache: false })
  }
  close(id: number | string) {
    return httpClient.post<Job>(`/jobs/${id}/close`)
  }
  reopen(id: number | string) {
    return httpClient.post<Job>(`/jobs/${id}/reopen`)
  }
  provisionPublication(id: number | string) {
    return httpClient.post<Job>(`/jobs/${id}/provision-publication`)
  }
  incrementViews(id: number | string) {
    return httpClient.post<void>(`/jobs/${id}/view`)
  }
  importProvenance(id: number | string) {
    return httpClient.get<JobImportProvenance>(`/jobs/${id}/import-provenance`, { cache: false })
  }
}

export const jobService = new JobService()
