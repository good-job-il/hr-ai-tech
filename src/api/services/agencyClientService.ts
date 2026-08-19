import { ResourceService, type ResourceQuery } from "./resourceService"

export type AgencyClientStatus = "prospect" | "active" | "inactive" | "archived"
export type MutableAgencyClientStatus = Exclude<AgencyClientStatus, "archived">

export interface AgencyClient {
  id: number
  organization_id: number
  company_id: number
  status: AgencyClientStatus
  account_manager_id: number | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  contract_type: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  placement_fee_percent: number | null
  payment_terms_days: number | null
  notes: string | null
  created_date: string
  updated_date: string
  company?: {
    id: number
    name: string
    industry?: string | null
    logo_url?: string | null
  }
}

export interface AgencyClientQuery extends Pick<ResourceQuery, "page" | "limit"> {
  search?: string
  status?: AgencyClientStatus
  industry?: string
}

export interface CreateAgencyClientInput {
  company_id?: number | null
  name?: string
  industry?: string | null
  initials?: string | null
  color?: string | null
  logo_url?: string | null
  website?: string | null
  status?: MutableAgencyClientStatus
  account_manager_id?: number | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  contract_type?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  placement_fee_percent?: number | null
  payment_terms_days?: number | null
  notes?: string | null
}

export type UpdateAgencyClientInput = Omit<CreateAgencyClientInput, "company_id">

export class AgencyClientService extends ResourceService<
  AgencyClient,
  AgencyClientQuery,
  CreateAgencyClientInput,
  UpdateAgencyClientInput
> {
  constructor() {
    super("/agency-clients")
  }
  archive(id: number | string): Promise<void> {
    return this.remove(id)
  }
}

export const agencyClientService = new AgencyClientService()
