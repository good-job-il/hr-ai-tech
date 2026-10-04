import { ResourceService, ResourceQuery } from "./resourceService"
import { httpClient } from "@/api/client/httpClient"
import type { PaginatedResponse } from "@/types/api"

export type ImportAction = "create" | "update" | "close" | "reopen" | "skip" | "review" | "error"

export type ImportValidationOutcome =
  "valid" | "review_required" | "quarantined" | "duplicate_candidate" | "invalid"

export interface ImportSourceRecord {
  id: number
  organization_id: number
  employer_company_id: number | null
  name: string
  provider: string | null
  url: string
  connector_type: "generic_json" | "json_ld" | "greenhouse" | "lever" | "comeet" | "generic_html"
  connector_version: string
  state: "draft" | "active" | "paused" | "needs_attention" | "archived"
  configuration: Record<string, unknown>
  configuration_version: number
  mapping_version: number
  publish_policy: "draft" | "review" | "auto_publish"
  closing_policy: "disabled" | "explicit_only" | "full_snapshot" | "missing_grace"
  missing_grace_runs: number
  missing_grace_hours: number
  default_team_id: number | null
  default_team_manager_id: number | null
  default_recruiter_id: number | null
  default_recruitment_manager_id: number | null
  onboarding_step: number
  onboarding_state: {
    discovery?: Record<string, unknown> | null
    preview_run_id?: number | null
    preview_completed_at?: string | null
    overwrite_policy?: "source_until_edited" | "review_on_conflict"
  } | null
  interval_hours: number
  is_active: boolean
  next_run_at: string | null
  last_attempt_at?: string | null
  last_success_at?: string | null
  health_state?: "unknown" | "healthy" | "degraded" | "error"
  operational_status?: ImportSourceOperationalStatus
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
  onboarding_step?: number
  onboarding_state?: ImportSourceRecord["onboarding_state"]
}

export interface ImportSourceDashboardQuery extends ResourceQuery {
  q?: string
  state?: ImportSourceRecord["state"]
  health_state?: "unknown" | "healthy" | "degraded" | "error"
  connector_type?: ImportSourceRecord["connector_type"]
  employer_company_id?: number
  include_archived?: boolean
}

export interface ImportSourceOnboardingDraftInput {
  name: string
  url: string
  connector_type: ImportSourceRecord["connector_type"]
  configuration?: Record<string, unknown>
  locale?: string
  timezone?: string
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
  configuration_version: number
  items_fetched: number
  create_count: number
  update_count: number
  close_count: number
  reopen_count: number
  skip_count: number
  review_count: number
  error_count: number
  error?: ImportPreviewError | null
  confirmation_metadata?: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
}

export type ImportSourceOperationalStatus =
  | "healthy"
  | "running"
  | "needs_review"
  | "degraded"
  | "auth_required"
  | "paused"
  | "draft"
  | "unknown"

export interface ImportRunSummary {
  id: number
  mode: ImportRun["mode"]
  status: ImportRun["status"]
  snapshot_completeness: ImportRun["snapshot_completeness"]
  items_fetched: number
  create_count: number
  update_count: number
  close_count: number
  reopen_count: number
  skip_count: number
  review_count: number
  error_count: number
  error_code: string | null
  started_at: string | null
  completed_at: string | null
}

export interface ImportSourceDashboardRecord extends ImportSourceRecord {
  operational_status: ImportSourceOperationalStatus
  latest_run: ImportRunSummary | null
  trend: {
    items_fetched: number
    changes: number
    review: number
    errors: number
    comparison_available: boolean
  } | null
}

export interface ImportRunItem {
  id: number
  job_import_run_id: number
  source_job_record_id: number | null
  job_id: number | null
  proposed_action: ImportAction
  normalized_candidate: Record<string, unknown>
  source_payload: Record<string, unknown> | null
  before_payload?: Record<string, unknown> | null
  after_payload?: Record<string, unknown> | null
  field_diff: Record<string, unknown>
  validation_issues: ImportPreviewIssue[]
  confidence: number
  status: "pending" | "approved" | "rejected" | "applied" | "skipped" | "failed"
  error?: ImportPreviewError | null
  reviewed_by?: number | null
  reviewed_at?: string | null
  review_reason?: string | null
  stale?: boolean
  run?: {
    id: number
    status: ImportRun["status"]
    mode: ImportRun["mode"]
    completed_at: string | null
  } | null
  source?: {
    id: number
    name: string
    employer_company_id: number | null
  } | null
  current_job?: Record<string, unknown> & {
    id: number
    title: string
    state: string
    updated_date: string
  }
  probable_duplicates?: Array<{
    source_job_record_id: number
    job_id: number | null
    external_key: string
    title: string
    company: string | null
    location: string | null
    lifecycle: string
  }>
}

export interface ImportReviewQueueQuery extends ResourceQuery {
  run_id?: number
  source_id?: number
  employer_company_id?: number
  action?: ImportAction
  status?: ImportRunItem["status"]
  issue_code?: string
  min_confidence?: number
  max_confidence?: number
  has_errors?: boolean
  q?: string
}

export interface ImportItemCorrection {
  corrections: Partial<
    Pick<ImportPreviewSample["normalized_candidate"], "title" | "source_company_label">
  > &
    Record<string, unknown>
  reason: string
  mapping_rule?: {
    field: "title" | "source_company_label" | "description" | "category"
    transform: "trim" | "strip_html" | "decode_entities"
  }
}

export interface JobImportHealth {
  generated_at: string
  sources: Record<string, number>
  runs_24h: Record<string, number>
}

export interface ConnectorCatalogItem {
  type: ImportSourceRecord["connector_type"]
  version: string
  capabilities: string[]
  limitations: string[]
}

export interface ConnectorDiscoveryResult {
  source_id: number
  configuration_version: number
  connector: ConnectorCatalogItem
  discovery: {
    source_url: string
    detected_type: string
    connector_version: string
    capabilities: string[]
    warnings: ImportPreviewIssue[]
  }
}

export interface ImportApplyResult {
  run_id: number
  idempotency_key: string
  applied: number
  skipped: number
  failed: number
  items: Array<{
    item_id: number
    status: "applied" | "skipped" | "failed"
    action: ImportAction
    job_id: number | null
    error: string | null
  }>
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

  createOnboardingDraft(payload: ImportSourceOnboardingDraftInput) {
    return httpClient.post<ImportSourceRecord>("/import-sources/onboarding-drafts", payload)
  }

  listDashboard(query: ImportSourceDashboardQuery = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
    })
    return httpClient.get<PaginatedResponse<ImportSourceDashboardRecord>>(
      `/import-sources/dashboard${params.size ? `?${params}` : ""}`,
      { cache: false },
    )
  }

  connectorCatalog() {
    return httpClient
      .get<{ data: ConnectorCatalogItem[] }>("/job-import-connectors", { cache: false })
      .then((response) => response.data)
  }

  discover(sourceId: number) {
    return httpClient.post<ConnectorDiscoveryResult>(`/import-sources/${sourceId}/discover`, {})
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

  listReviewItems(query: ImportReviewQueueQuery = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
    })
    return httpClient.get<PaginatedResponse<ImportRunItem>>(
      `/job-imports/review-items${params.size ? `?${params}` : ""}`,
      { cache: false },
    )
  }

  approveItem(itemId: number, resolvedAction: ImportAction, reason?: string) {
    return httpClient.post<ImportRunItem>(`/import-run-items/${itemId}/approve`, {
      idempotency_key: `approve-${itemId}-${Date.now()}-${crypto.randomUUID()}`,
      resolved_action: resolvedAction,
      reason,
    })
  }

  rejectItem(itemId: number, reason: string) {
    return httpClient.post<ImportRunItem>(`/import-run-items/${itemId}/reject`, {
      idempotency_key: `reject-${itemId}-${Date.now()}-${crypto.randomUUID()}`,
      reason,
    })
  }

  ignoreItem(itemId: number, reason: string) {
    return this.approveItem(itemId, "skip", reason)
  }

  retryItem(itemId: number) {
    return httpClient.post(`/import-run-items/${itemId}/retry`, {
      idempotency_key: `retry-${itemId}-${Date.now()}-${crypto.randomUUID()}`,
    })
  }

  correctItem(itemId: number, payload: ImportItemCorrection) {
    return httpClient.post<ImportRunItem>(`/import-run-items/${itemId}/correct`, payload)
  }

  linkDuplicate(itemId: number, targetRecordId: number, reason: string) {
    return httpClient.post<ImportRunItem>(`/import-run-items/${itemId}/link-duplicate`, {
      target_source_job_record_id: targetRecordId,
      idempotency_key: `link-${itemId}-${targetRecordId}-${crypto.randomUUID()}`,
      reason,
    })
  }

  batchResolve(
    runId: number,
    payload: {
      item_ids: number[]
      resolution: "approve" | "reject"
      reason?: string
      resolved_action?: Exclude<ImportAction, "review" | "error">
      confirm_bulk_close?: true
    },
  ) {
    return httpClient.post(`/import-runs/${runId}/items/resolve`, {
      ...payload,
      idempotency_key: `batch-${runId}-${Date.now()}-${crypto.randomUUID()}`,
    })
  }

  getHealth() {
    return httpClient.get<JobImportHealth>("/job-imports/health", { cache: false })
  }

  applyRun(runId: number, idempotencyKey: string) {
    return httpClient.post<ImportApplyResult>(`/import-runs/${runId}/apply`, {
      idempotency_key: idempotencyKey,
    })
  }

  resume(sourceId: number) {
    return httpClient.post<ImportSourceRecord>(`/import-sources/${sourceId}/resume`, {})
  }

  pause(sourceId: number) {
    return httpClient.post<ImportSourceRecord>(`/import-sources/${sourceId}/pause`, {})
  }

  reconnectCredentials(sourceId: number, credentialReference: string) {
    return httpClient.post<ImportSourceRecord>(
      `/import-sources/${sourceId}/reconnect-credentials`,
      { credential_reference: credentialReference },
    )
  }

  replayRun(runId: number, idempotencyKey?: string) {
    return httpClient.post<QueuedImportRun>(`/import-runs/${runId}/replay`, {
      idempotency_key: idempotencyKey ?? `replay-${runId}-${Date.now()}-${crypto.randomUUID()}`,
    })
  }

  archive(sourceId: number) {
    return httpClient.delete<void>(`/import-sources/${sourceId}`)
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
