import { httpClient } from "@/api/client/httpClient"
import { ResourceService, ResourceQuery } from "./resourceService"

export interface CompanyRecord {
  id: number
  name: string
  industry: string | null
  initials: string | null
  color: string | null
  logo_url: string | null
  website: string | null
  job_count: number
}

export interface CompanyQuery extends ResourceQuery {
  sort?: "name" | "created_date" | "job_count"
  search?: string
  industry?: string
  is_deleted?: boolean
}

export interface CompanyReviewRecord {
  id: number
  company_id: number
  reviewer_email: string
  reviewer_name: string | null
  rating_overall: number
  rating_salary: number | null
  rating_management: number | null
  rating_worklife: number | null
  title: string | null
  pros: string | null
  cons: string | null
  is_anonymous: boolean
  created_date: string
}

export interface CreateCompanyReviewInput {
  company_name?: string | null
  rating_overall: number
  rating_salary?: number | null
  rating_management?: number | null
  rating_worklife?: number | null
  title?: string | null
  pros?: string | null
  cons?: string | null
  is_anonymous?: boolean
}

class CompanyService extends ResourceService<CompanyRecord, CompanyQuery> {
  constructor() {
    super("/companies")
  }
  reviews(companyId: number) {
    return httpClient.get<CompanyReviewRecord[]>(`/companies/${companyId}/reviews`, {
      cache: false,
    })
  }
  createReview(companyId: number, payload: CreateCompanyReviewInput) {
    return httpClient.post<CompanyReviewRecord>(`/companies/${companyId}/reviews`, payload)
  }
}

export const companyService = new CompanyService()
