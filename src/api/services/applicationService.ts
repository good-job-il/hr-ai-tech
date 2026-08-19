import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"
import { Application } from "@/types/entities"

export type ApplicationStatus = Application["status"]
export type ApplicationSource =
  "app" | "linkedin" | "facebook" | "jobsite" | "pool_assignment" | "email_intake" | "other"

export interface ApplicationQuery extends ResourceQuery {
  page?: number
  limit?: number
  sort?: string
  order?: "ASC" | "DESC"
  job_id?: number
  candidate_id?: number
  candidate_email?: string
  employer_company_id?: number
  recruiter_id?: number
  organization_id?: number
  assigned_to?: number
  status?: ApplicationStatus
  is_deleted?: boolean
  search?: string
}

export interface CreateApplicationInput {
  job_id: number
  candidate_id?: number | null
  job_title?: string | null
  company?: string | null
  employer_company_id?: number | null
  recruiter_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  candidate_name: string
  candidate_email?: string | null
  candidate_phone?: string | null
  resume_url?: string | null
  resume_filename?: string | null
  cover_letter?: string | null
  desired_salary_min?: number | null
  desired_salary_max?: number | null
  location?: string | null
  source?: ApplicationSource
  status?: ApplicationStatus
  notes?: string | null
  assigned_to?: number | null
}

export type SubmitApplicationInput = Pick<
  CreateApplicationInput,
  | "job_id"
  | "candidate_name"
  | "candidate_phone"
  | "resume_url"
  | "resume_filename"
  | "cover_letter"
  | "desired_salary_min"
  | "desired_salary_max"
  | "location"
>

export interface UpdateApplicationInput extends Partial<CreateApplicationInput> {
  match_score?: number | null
  match_reason?: string | null
  internal_history?: string | null
  is_deleted?: boolean
  deleted_by?: string | null
}

export interface ApplicationTimelineRecord {
  id: number
  application_id: number
  event_type:
    | "submitted"
    | "status_changed"
    | "note_added"
    | "message_sent"
    | "interview_scheduled"
    | "interview_completed"
    | "offer_made"
    | "rejected"
    | "assigned"
    | "resume_viewed"
  previous_value: string | null
  new_value: string | null
  description: string
  performed_by: string | null
  performed_by_role: string | null
  created_date: string
}

export class ApplicationService extends ResourceService<
  Application,
  ApplicationQuery,
  CreateApplicationInput,
  UpdateApplicationInput
> {
  constructor() {
    super("/applications")
  }
  updateStatus(id: number | string, status: ApplicationStatus, reason?: string) {
    return httpClient.patch<Application>(`/applications/${id}/status`, { status, reason })
  }
  reopen(
    id: number | string,
    status: Exclude<ApplicationStatus, "completed" | "rejected">,
    reason: string,
  ) {
    return httpClient.post<Application>(`/applications/${id}/reopen`, { status, reason })
  }
  addNote(id: number | string, content: string) {
    return httpClient.post<Application>(`/applications/${id}/notes`, { content })
  }
  assign(id: number | string, assigned_to: number) {
    return this.update(id, { assigned_to })
  }
  timeline(id: number | string) {
    return httpClient.get<ApplicationTimelineRecord[]>(`/applications/${id}/timeline`, {
      cache: false,
    })
  }
  submit(input: SubmitApplicationInput) {
    return httpClient.post<Application>("/applications/submit", input)
  }
  assignCandidate(job_id: number, candidate_id: number) {
    return httpClient.post<Application>("/applications/assign-candidate", { job_id, candidate_id })
  }
  score(id: number | string) {
    return httpClient.post<{ score: number; reason: string }>(`/applications/${id}/score`)
  }
}

export const applicationService = new ApplicationService()
