import { httpClient } from "@/api/client/httpClient"
import type { Job } from "@/types/entities"

export interface JobSearchInput {
  query?: string
  filters?: {
    type?: string[]
    location?: string
    category?: string[]
    salary_min?: number
    salary_max?: number
  }
  type?: "search" | "autocomplete" | "recommendations"
  limit?: number
}

export interface ExtractedResumeData {
  full_name?: string
  phone?: string
  email?: string
  location?: string
  title?: string
  summary?: string
  skills?: string[]
  experience_years?: number
}

export const publicWorkflowService = {
  searchJobs: (payload: JobSearchInput) =>
    httpClient.post<{ jobs: Job[]; total: number }>("/jobs/search", payload),
  similarJobs: (jobId: number, limit = 5) =>
    httpClient.post<{ recommendations: Job[] }>("/matching/jobs/similar", { job_id: jobId, limit }),
  recommendedJobs: () =>
    httpClient.get<{ jobs: Array<Job & { match_score: number }> }>("/matching/jobs/recommended", {
      cache: false,
    }),
  extractResume: (fileUrl: string) =>
    httpClient.post<{ success: boolean; data: ExtractedResumeData }>("/resumes/extract", {
      file_url: fileUrl,
    }),
  currentLocation: () => httpClient.get<{ city: string }>("/location/current", { cache: false }),
}
