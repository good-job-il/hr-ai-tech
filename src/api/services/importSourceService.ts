import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"
import type { BackgroundJob } from "./candidateImportService"
import { candidateImportService } from "./candidateImportService"

export type ImportAction =
  | "create"
  | "update"
  | "close"
  | "reopen"
  | "skip"
  | "review"
  | "error"

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
    return httpClient.post<BackgroundJob<ImportPreviewResult>>(`/import-sources/${sourceId}/runs`, {
      mode: "preview",
      idempotency_key:
        idempotencyKey ?? `preview-${sourceId}-${Date.now()}-${crypto.randomUUID()}`,
    })
  }

  async preview(sourceId: number, idempotencyKey?: string) {
    const job = await this.queuePreview(sourceId, idempotencyKey)

    return candidateImportService.waitForJob<ImportPreviewResult>(job.id)
  }
}

export const importSourceService = new ImportSourceService()
