import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"
import type { PaginatedResponse } from "@/types/api"

export type ImportAction = "create" | "update" | "close" | "reopen" | "skip" | "review" | "error"

export type ImportValidationOutcome =
  "valid" | "review_required" | "quarantined" | "duplicate_candidate" | "invalid"

export interface ImportSourceRecord {
  id: number
  organization_id: number
  employer_company_id: number
  name: string
  provider: string | null
  url: string
  connector_type: "generic_json" | "json_ld" | "greenhouse" | "lever" | "generic_html"
  connector_version: string
  state: "draft" | "active" | "paused" | "needs_attention" | "archived"
  configuration: Record<string, unknown>
  configuration_version: number
  mapping_version: number
  interval_hours: number
  is_active: boolean
  next_run_at: string | null
  last_attempt_at?: string | null
  last_success_at?: string | null
  health_state?: "unknown" | "healthy" | "degraded" | "error"
  health_error_code?: string | null
  credentials_connected: boolean
  [key: string]: unknown
}

export interface ImportSourceInput {
  name: string
  employer_company_id: number
  provider?: string | null
  url: string
  connector_type: ImportSourceRecord["connector_type"]
  configuration?: Record<string, unknown>
  publish_policy?: "draft" | "review" | "auto_publish"
  closing_policy?: "disabled" | "explicit_only" | "full_snapshot" | "missing_grace"
  missing_grace_runs?: number
  missing_grace_hours?: number
  locale?: string
  timezone?: string
  interval_hours?: number
  default_team_id?: number | null
  default_team_manager_id?: number | null
  default_recruiter_id?: number | null
  default_recruitment_manager_id?: number | null
}

export interface ImportPreviewIssue {
  code: string
  field: string | null
  message: string
  severity: "warning" | "error"
}

export interface ImportPreviewError {
  code: string
  message: string
  retryable: boolean
  retry_after_seconds: number | null
  context: Record<string, string | number | boolean | null>
}

export interface ImportPreviewSample {
  run_item_id: number
  source_job_record_id: number | null
  job_id: number | null
  external_key: string
  proposed_action: ImportAction
  validation_outcome: ImportValidationOutcome
  identity: {
    strategy: "vendor_id" | "posting_url" | "fingerprint"
    namespace: string
  }
  probable_duplicate_record_ids: number[]
  normalized_candidate: Record<string, unknown> & {
    external_key: string
    title: string
    source_company_label: string | null
  }
  field_diff: Record<string, unknown>
  validation_issues: ImportPreviewIssue[]
  confidence: number
}

export interface ImportPreviewResult {
  run_id: number
  mode: "preview"
  status: "completed" | "partial" | "failed" | "cancelled"
  job_changes_applied: false
  source: {
    id: number
    name: string
    state: ImportSourceRecord["state"]
    employer_company_id: number
    url: string
    configuration_version: number
    mapping_version: number
  }
  connector: {
    configured_type: string
    detected_type: string | null
    version: string
    confidence: number
    reasons: string[]
    capabilities: readonly string[]
    limitations: string[]
  }
  snapshot: {
    completeness: "full" | "incremental" | "partial" | "failed"
    pages_fetched: number
    items_fetched: number
    has_more: boolean
    not_modified: boolean
  }
  quality: {
    valid_items: number
    warning_items: number
    error_items: number
    issues_by_code: Record<string, number>
  }
  forecast: Record<ImportAction, number>
  warnings: ImportPreviewIssue[]
  errors: ImportPreviewError[]
  samples: ImportPreviewSample[]
  started_at: string | null
  completed_at: string | null
}

export interface QueuedImportRun {
  run_id: number
  source_id: number
  mode: "preview"
  status: string
  background_job_id: number
  idempotency_key: string
}

export interface ImportRun {
  id: number
  organization_id: number
  import_source_id: number
  mode: "preview" | "apply"
  status: "pending" | "running" | "completed" | "partial" | "failed" | "dead_letter" | "cancelled"
  snapshot_completeness: "full" | "incremental" | "partial" | "failed" | null
  connector_type: string
  connector_version: string
  items_fetched: number
  create_count: number
  update_count: number
  close_count: number
  reopen_count: number
  skip_count: number
  review_count: number
  error_count: number
  started_at: string | null
  completed_at: string | null
}

export interface ImportRunItem {
  id: number
  job_import_run_id: number
  job_id: number | null
  proposed_action: ImportAction
  normalized_candidate: Record<string, unknown>
  field_diff: Record<string, unknown>
  validation_issues: ImportPreviewIssue[]
  confidence: number
  status: "pending" | "approved" | "rejected" | "applied" | "skipped" | "failed"
}

export interface JobImportHealth {
  generated_at: string
  sources: Record<string, number>
  runs_24h: Record<string, number>
}

export interface PlatformImportSourceHealth {
  id: number
  organization_id: number
  employer_company_id: number
  connector_type: string
  connector_version: string
  state: ImportSourceRecord["state"]
  health_state: string
  health_error_code: string | null
  last_attempt_at: string | null
  last_success_at: string | null
  next_run_at: string | null
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

  queuePreview(sourceId: number, idempotencyKey?: string) {
    return httpClient.post<QueuedImportRun>(`/import-sources/${sourceId}/runs`, {
      mode: "preview",
      idempotency_key: idempotencyKey ?? `preview-${sourceId}-${Date.now()}-${crypto.randomUUID()}`,
    })
  }

  async preview(sourceId: number, idempotencyKey?: string) {
    const queued = await this.queuePreview(sourceId, idempotencyKey)

    return this.waitForRun(queued.run_id)
  }

  listRuns(sourceId: number, query: ResourceQuery = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
    })
    return httpClient.get<PaginatedResponse<ImportRun>>(
      `/import-sources/${sourceId}/runs${params.size ? `?${params}` : ""}`,
      { cache: false },
    )
  }

  getRun(runId: number) {
    return httpClient.get<ImportRun>(`/import-runs/${runId}`, { cache: false })
  }

  listRunItems(runId: number, query: ResourceQuery = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
    })
    return httpClient.get<PaginatedResponse<ImportRunItem>>(
      `/import-runs/${runId}/items${params.size ? `?${params}` : ""}`,
      { cache: false },
    )
  }

  getHealth() {
    return httpClient.get<JobImportHealth>("/job-imports/health", { cache: false })
  }

  private async waitForRun(runId: number) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const run = await this.getRun(runId)
      if (!["pending", "running"].includes(run.status)) return run
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    throw new Error(`Import run ${runId} did not finish in time`)
  }
}

export const importSourceService = new ImportSourceService()

export const platformJobImportService = {
  listHealth(query: ResourceQuery & { organization_id?: number; health_state?: string } = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
    })
    return httpClient.get<PaginatedResponse<PlatformImportSourceHealth>>(
      `/platform-support/import-sources/health${params.size ? `?${params}` : ""}`,
      { cache: false },
    )
  },
}
