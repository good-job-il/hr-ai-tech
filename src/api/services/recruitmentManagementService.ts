import { httpClient } from "@/api/client/httpClient"
import { buildQuery } from "./resourceService"
import type { ManagementReportQuery } from "./managementReportService"

export interface RecruitmentManagerDashboard {
  summary: {
    open_jobs: number
    applications: number
    active_applications: number
    overdue_stages: number
    placements: number
    overloaded_recruiters: number
  }
  funnel: Record<string, number>
  overdue: Array<{
    id: number
    candidate_name: string
    job_title: string | null
    status: string
    overdue_hours: number
  }>
  workload: Array<{
    recruiter_id: number
    recruiter_name: string
    team_id: number | null
    team_name: string | null
    active_applications: number
    open_jobs: number
    overloaded: boolean
  }>
  placements: Array<{
    application_id: number
    candidate_name: string
    job_title: string | null
    company: string | null
    status: string
    placed_at: string
  }>
  thresholds: { application_overload: number; job_overload: number }
  filters: Record<string, unknown>
  dimensions: Record<
    "recruiters" | "teams" | "clients" | "jobs",
    Array<{ id: number; name: string }>
  >
}

export interface AssignRecruitmentWorkInput {
  job_ids: number[]
  candidate_ids: number[]
  application_ids: number[]
  team_id?: number | null
  recruiter_id?: number | null
  reason: string
}

export const recruitmentManagementService = {
  dashboard: (query: ManagementReportQuery = {}) =>
    httpClient.get<RecruitmentManagerDashboard>(
      `/recruitment-management/dashboard${buildQuery(query)}`,
      { cache: false },
    ),
  assign: (payload: AssignRecruitmentWorkInput) =>
    httpClient.post("/recruitment-management/assign", payload),
}
