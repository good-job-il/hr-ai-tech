import { ResourceService, ResourceQuery } from "./resourceService"

export interface CompensationPlanRecord {
  id: number
  organization_id: number
  job_id: number | null
  employer_company_id: number | null
  agency_client_id: number | null
  client_name: string
  total_fee: number | null
  warranty_period_days: number
  recruiter_id: number | null
  recruiter_compensation: number | null
  recruiter_compensation_type: "fixed" | "percent"
  own_compensation_amount?: number | null
  [key: string]: unknown
}
export interface CompensationPlanQuery extends ResourceQuery {
  sort?: "created_date" | "updated_date" | "client_name" | "total_fee"
  job_id?: number
  employer_company_id?: number
  recruiter_id?: number
}
export interface CompensationPlanInput {
  job_id?: number | null
  employer_company_id?: number | null
  agency_client_id?: number | null
  total_fee?: number | null
  warranty_period_days?: number
  recruiter_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  recruiter_compensation?: number | null
  recruiter_compensation_type?: "fixed" | "percent"
  team_manager_compensation?: number | null
  team_manager_compensation_type?: "fixed" | "percent"
  recruitment_manager_compensation?: number | null
  recruitment_manager_compensation_type?: "fixed" | "percent"
  notes?: string | null
}
export const compensationPlanService = new ResourceService<
  CompensationPlanRecord,
  CompensationPlanQuery,
  CompensationPlanInput,
  Partial<CompensationPlanInput>
>("/compensation-plans")
