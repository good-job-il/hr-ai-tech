import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"

export interface ImportBatchRecord {
  id: number
  batch_name: string
  source_file: string | null
  file_type: string
  status: "pending" | "processing" | "in_progress" | "completed" | "failed" | "partial"
  successful_imports: number
  failed_imports: number
  duplicate_found: number
  missing_email: number
  created_date: string
  [key: string]: unknown
}

export interface CreateImportBatchInput {
  batch_name: string
  source_file?: string | null
  file_type: string
  recruiter_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  employer_id?: number | null
  total_records?: number
}

export interface CandidateImportInput {
  full_name: string
  email?: string | null
  phone?: string | null
  location?: string | null
  role_name?: string | null
  domain_name?: string | null
  resume_url?: string | null
  resume_filename?: string | null
  skills?: string[] | null
  languages?: string[] | null
  summary?: string | null
  recruiter_id?: number | null
  team_manager_id?: number | null
  recruitment_manager_id?: number | null
  data_quality_score?: number
  parsing_confidence?: number
  review_required?: boolean
}

export interface ResumeImportInput {
  files: Array<{ file_url: string; filename?: string; file_size?: number }>
  batchId?: number | null
  employer_id?: number | null
  recruiter_id?: number | null
}

export interface ParseResumeBatchInput {
  zip_file_url: string
  import_batch_id?: number | null
  employer_id?: number | null
  recruiter_id?: number | null
  source?: string
  initial_status?: string
}

export interface BackgroundJob<T = Record<string, unknown>> {
  id: number
  status: "pending" | "running" | "completed" | "failed"
  result: T | null
  error: string | null
}

export interface CandidateImportResult {
  successful: number
  duplicates: number
  failed: number
  missingEmail: number
  message: string
}

class CandidateImportService extends ResourceService<
  ImportBatchRecord,
  ResourceQuery,
  CreateImportBatchInput,
  never
> {
  constructor() {
    super("/candidates/import-batches")
  }

  queueFileImport(batchId: number, fileUrl: string, fileName?: string) {
    return httpClient.post<BackgroundJob<CandidateImportResult>>(
      `/candidate-imports/batches/${batchId}/run`,
      {
        file_url: fileUrl,
        file_name: fileName,
        idempotency_key: `candidate-batch-${batchId}`,
      },
    )
  }

  retryBatch(batchId: number) {
    return httpClient.post<BackgroundJob<CandidateImportResult>>(
      `/candidate-imports/batches/${batchId}/retry`,
    )
  }

  importResumes(payload: ResumeImportInput) {
    return httpClient.post<Record<string, unknown>>("/candidate-imports/resumes", payload)
  }

  parseBatch(payload: ParseResumeBatchInput) {
    return httpClient.post<Record<string, unknown>>(
      "/candidate-imports/resume-batches/parse",
      payload,
    )
  }

  validateBatch(importBatchId: number) {
    return httpClient.post<Record<string, unknown>>("/candidate-imports/validate", {
      import_batch_id: importBatchId,
    })
  }

  createBulk(candidates: CandidateImportInput[], importBatchId?: number) {
    return httpClient.post<{ created: unknown[]; failed: unknown[] }>("/candidate-imports/bulk", {
      candidates_data: candidates,
      import_batch_id: importBatchId,
    })
  }

  getJob<T = Record<string, unknown>>(id: number) {
    return httpClient.get<BackgroundJob<T>>(`/background-jobs/${id}`, { cache: false })
  }

  async waitForJob<T = Record<string, unknown>>(id: number, timeoutMs = 120_000): Promise<T> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const job = await this.getJob<T>(id)
      if (job.status === "completed" && job.result) return job.result
      if (job.status === "failed") throw new Error(job.error || "Background job failed")
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error("Background job timed out")
  }
}

export const candidateImportService = new CandidateImportService()
