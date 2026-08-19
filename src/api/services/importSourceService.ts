import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"
import type { BackgroundJob } from "./candidateImportService"
import { candidateImportService } from "./candidateImportService"

export interface ImportSourceRecord {
  id: number
  name: string
  provider: string | null
  url: string
  interval_hours: number
  is_active: boolean
  last_sync: string | null
  last_sync_status: "success" | "error" | "pending"
  jobs_added: number
  jobs_updated: number
  jobs_closed: number
  [key: string]: unknown
}

export interface ImportSourceInput {
  name: string
  provider?: string | null
  url: string
  interval_hours?: number
  is_active?: boolean
}

export interface ImportRunResult {
  success: boolean
  summary: string
  pages_scanned: number
  job_links_found: number
  created: number
  updated: number
  closed: number
  errors_count: number
  errors: string[]
  log: string[]
}

class ImportSourceService extends ResourceService<
  ImportSourceRecord,
  ResourceQuery,
  ImportSourceInput,
  Partial<ImportSourceInput>
> {
  constructor() {
    super("/import-sources")
  }

  queueRun(sourceId: number) {
    return httpClient.post<BackgroundJob<ImportRunResult>>(`/import-sources/${sourceId}/runs`, {
      idempotency_key: `source-${sourceId}-${Math.floor(Date.now() / 60_000)}`,
    })
  }

  async run(sourceId: number) {
    const job = await this.queueRun(sourceId)
    return candidateImportService.waitForJob<ImportRunResult>(job.id)
  }

  preview(url: string, companyName: string) {
    return httpClient.post<ImportRunResult>("/import-sources/preview", {
      url,
      company_name: companyName,
    })
  }
}

export const importSourceService = new ImportSourceService()
