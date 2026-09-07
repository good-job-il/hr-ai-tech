import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"

export interface OrganizationRecord {
  id: number
  name: string
  org_type: "staffing_agency" | "organization"
  status: "active" | "suspended" | "inactive"
  plan: OrganizationPlan
  contact_email?: string | null
  logo_url?: string | null
  settings?: Record<string, unknown> | null
  created_date?: string
  updated_date?: string
}

export type OrganizationPlan = "trial" | "starter" | "pro" | "enterprise"

export interface OrganizationQuery extends ResourceQuery {
  sort?: "created_date" | "updated_date" | "name" | "status" | "plan"
  org_type?: OrganizationRecord["org_type"]
  status?: OrganizationRecord["status"]
  search?: string
}

export interface CreateOrganizationInput {
  name: string
  org_type: OrganizationRecord["org_type"]
  status?: OrganizationRecord["status"]
  settings?: Record<string, unknown>
  plan?: OrganizationPlan
  contact_email?: string
  logo_url?: string
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>
export type OnboardAgencyInput = Pick<
  CreateOrganizationInput,
  "name" | "contact_email" | "logo_url" | "settings"
>

class OrganizationService extends ResourceService<
  OrganizationRecord,
  OrganizationQuery,
  CreateOrganizationInput,
  UpdateOrganizationInput
> {
  constructor() {
    super("/organizations")
  }
  onboardAgency(payload: OnboardAgencyInput) {
    return httpClient.post<OrganizationRecord>("/organizations/onboard-agency", payload)
  }
}

export const organizationService = new OrganizationService()
