import { httpClient } from "@/api/client/httpClient"
import { buildQuery } from "./resourceService"

export interface ManagementReportQuery {
  date_from?: string
  date_to?: string
  client_id?: number
  job_id?: number
  recruiter_id?: number
  team_id?: number
}

export interface PerformanceRow {
  applications: number
  placements: number
  conversion_rate: number
  [key: string]: string | number
}

export interface ManagementReport {
  generated_at: string
  filters: Record<string, unknown>
  summary: {
    applications: number
    placements: number
    placement_rate: number
    average_time_to_hire_days: number
    placement_revenue: number | null
    allocated_compensation: number | null
  }
  funnel: Array<{ status: string; count: number }>
  time_in_stage: Array<{ status: string; average_days: number }>
  source_effectiveness: Array<PerformanceRow & { source: string }>
  recruiter_performance: Array<PerformanceRow & { recruiter_id: number; recruiter_name: string }>
  recruiter_workload: Array<{
    recruiter_id: number
    recruiter_name: string
    active_applications: number
    open_jobs: number
    overloaded: boolean
  }>
  team_performance: Array<PerformanceRow & { team_manager_id: number; team_name: string }>
  client_conversion: Array<PerformanceRow & { client_id: number; client_name: string }>
  job_conversion: Array<PerformanceRow & { job_id: number; job_title: string }>
  dimensions: Record<
    "recruiters" | "teams" | "clients" | "jobs",
    Array<{ id: number; name: string }>
  >
}

export const managementReportService = {
  get: (query: ManagementReportQuery) =>
    httpClient.get<ManagementReport>(`/management-reports${buildQuery(query)}`, { cache: false }),
  export: (query: ManagementReportQuery) =>
    httpClient.get<ManagementReport>(`/management-reports/export${buildQuery(query)}`, {
      cache: false,
    }),
}
