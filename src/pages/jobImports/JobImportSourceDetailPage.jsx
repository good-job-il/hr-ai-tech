import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  History,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Users,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { agencyClientService } from "@/api/services/agencyClientService"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { auditService } from "@/api/services/auditService"
import { importSourceService } from "@/api/services/importSourceService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BackIcon,
  ErrorPanel,
  formatImportDate,
  formatImportNumber,
  formatImportRelativeTime,
  localizedImportError,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "./JobImportUi"

const RUN_PAGE_SIZE = 10

function ChangeCount({ label, value, tone }) {
  const { i18n } = useTranslation()

  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  }

  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <p className="text-xs font-bold">{label}</p>
      <p className="mt-1 text-xl font-black">{formatImportNumber(value || 0, i18n.language)}</p>
    </div>
  )
}

export default function JobImportSourceDetailPage() {
  const { sourceId } = useParams()

  const numericSourceId = Number(sourceId)

  const { t, i18n } = useTranslation()

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const { canResource } = usePermissionMatrix()

  const [runPage, setRunPage] = useState(1)

  const [runStatus, setRunStatus] = useState("")

  const [busy, setBusy] = useState("")

  const [archiveOpen, setArchiveOpen] = useState(false)

  const archiveOpenerRef = useRef(null)

  const [reconnectOpen, setReconnectOpen] = useState(false)

  const [credentialReference, setCredentialReference] = useState("")

  const source = useQuery({
    queryKey: ["job-import-source", numericSourceId],
    queryFn: () => importSourceService.get(numericSourceId),
    enabled: Number.isSafeInteger(numericSourceId),
    refetchInterval: 30_000,
  })

  const runs = useQuery({
    queryKey: ["job-import-source-runs", numericSourceId, runPage, runStatus],
    queryFn: () =>
      importSourceService.listRuns(numericSourceId, {
        page: runPage,
        limit: RUN_PAGE_SIZE,
        status: runStatus || undefined,
      }),
    enabled: Number.isSafeInteger(numericSourceId),
    refetchInterval: 30_000,
  })

  const recentRuns = useQuery({
    queryKey: ["job-import-source-runs", numericSourceId, "timeline"],
    queryFn: () => importSourceService.listRuns(numericSourceId, { page: 1, limit: 12 }),
    enabled: Number.isSafeInteger(numericSourceId),
    refetchInterval: 30_000,
  })

  const catalog = useQuery({
    queryKey: ["job-import-connectors"],
    queryFn: () => importSourceService.connectorCatalog(),
  })

  const clients = useQuery({
    queryKey: ["agency-clients", "job-import-detail"],
    queryFn: () => agencyClientService.listPage({ page: 1, limit: 300 }),
  })

  const teams = useQuery({
    queryKey: ["agency-teams", "job-import-detail"],
    queryFn: agencyTeamsService.overview,
  })

  const audit = useQuery({
    queryKey: ["job-import-source-audit", numericSourceId],
    queryFn: () =>
      auditService.listPage({
        page: 1,
        limit: 20,
        entity_type: "ImportSource",
        entity_id: numericSourceId,
        sort: "created_date",
        order: "DESC",
      }),
    enabled: Number.isSafeInteger(numericSourceId),
    retry: false,
  })

  const sourceData = source.data

  const connector = (catalog.data || []).find((item) => item.type === sourceData?.connector_type)

  const client = (clients.data?.data || []).find(
    (item) => item.company_id === sourceData?.employer_company_id,
  )

  const teamRows = teams.data?.teams || []

  const memberRows = teams.data?.members || []

  const assignedTeam = teamRows.find((item) => item.id === sourceData?.default_team_id)

  const memberName = (id) => memberRows.find((item) => item.id === id)?.full_name || null

  const timelineRuns = recentRuns.data?.data || []

  const latestRun = timelineRuns[0]

  const reviewCount = Number(latestRun?.review_count || 0)

  const assignments = [
    ["team", assignedTeam?.name],
    ["teamManager", memberName(sourceData?.default_team_manager_id)],
    ["recruiter", memberName(sourceData?.default_recruiter_id)],
    ["recruitmentManager", memberName(sourceData?.default_recruitment_manager_id)],
  ]

  const refresh = async () => {
    await Promise.all([source.refetch(), runs.refetch(), recentRuns.refetch(), audit.refetch()])
  }

  const runPreview = async () => {
    setBusy("preview")

    try {
      const queued = await importSourceService.queuePreview(numericSourceId)

      toast.success(t("jobImports.detail.notifications.previewQueued"))
      navigate(`/agency/import/jobs/runs/${queued.run_id}`)
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.detail.notifications.actionFailed")))
    } finally {
      setBusy("")
    }
  }

  const togglePause = async () => {
    if (!sourceData) {
      return
    }

    setBusy("state")

    try {
      if (sourceData.state === "paused") {
        await importSourceService.resume(numericSourceId)
      } else {
        await importSourceService.pause(numericSourceId)
      }

      toast.success(
        t(
          `jobImports.detail.notifications.${sourceData.state === "paused" ? "resumed" : "paused"}`,
        ),
      )
      await queryClient.invalidateQueries({ queryKey: ["job-import-source"] })
      await refresh()
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.detail.notifications.actionFailed")))
    } finally {
      setBusy("")
    }
  }

  const retryRun = async () => {
    if (!latestRun) {
      return
    }

    setBusy("retry")

    try {
      const queued = await importSourceService.replayRun(latestRun.id)

      toast.success(t("jobImports.detail.notifications.retryQueued"))
      navigate(`/agency/import/jobs/runs/${queued.run_id}`)
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.detail.notifications.actionFailed")))
    } finally {
      setBusy("")
    }
  }

  const reconnect = async (event) => {
    event.preventDefault()
    setBusy("reconnect")

    try {
      await importSourceService.reconnectCredentials(numericSourceId, credentialReference.trim())
      toast.success(t("jobImports.detail.notifications.reconnected"))
      setCredentialReference("")
      setReconnectOpen(false)
      await source.refetch()
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.detail.notifications.actionFailed")))
    } finally {
      setBusy("")
    }
  }

  const archive = async () => {
    setBusy("archive")

    try {
      await importSourceService.archive(numericSourceId)
      toast.success(t("jobImports.detail.notifications.archived"))
      navigate("/agency/import/jobs")
    } catch (error) {
      toast.error(localizedImportError(error, t, t("jobImports.detail.notifications.actionFailed")))
    } finally {
      setBusy("")
    }
  }

  if (source.isError || runs.isError) {
    return (
      <PageShell>
        <ErrorPanel onRetry={refresh} />
      </PageShell>
    )
  }

  if (!sourceData) {
    return (
      <PageShell>
        <Panel className="text-center text-sm text-slate-500">{t("common.loading")}</Panel>
      </PageShell>
    )
  }

  const can = {
    run: canResource("job_imports", "run"),
    update: canResource("job_imports", "update"),
    review: canResource("job_imports", "review"),
    credentials: canResource("job_imports", "manage_credentials"),
    archive: canResource("job_imports", "archive"),
  }

  const pagination = runs.data?.pagination

  const retryable = latestRun && ["failed", "dead_letter"].includes(latestRun.status)

  return (
    <PageShell>
      <Link
        to="/agency/import/jobs"
        className="inline-flex items-center gap-2 text-sm font-bold text-violet-700"
      >
        <BackIcon />
        {t("jobImports.common.backToSources")}
      </Link>

      <PageHeading
        eyebrow={t("jobImports.detail.eyebrow")}
        title={sourceData.name}
        description={sourceData.url}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={refresh}
              aria-label={t("jobImports.detail.refresh")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${source.isFetching ? "animate-spin" : ""}`} />
            </button>
            {can.run && (
              <button
                type="button"
                onClick={runPreview}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy === "preview" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {t("jobImports.detail.actions.run")}
              </button>
            )}
            <StatusPill value={sourceData.state} />
            <StatusPill value={sourceData.health_state} />
          </div>
        }
      />

      {(sourceData.health_error_code || reviewCount > 0 || retryable) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div>
              <p className="font-black text-amber-900">{t("jobImports.detail.attention.title")}</p>
              <p className="mt-1 text-sm text-amber-800">
                {sourceData.health_error_code
                  ? t(`jobImports.errors.${sourceData.health_error_code}`, {
                      defaultValue: t("jobImports.detail.notifications.actionFailed"),
                    })
                  : t("jobImports.detail.attention.review", { count: reviewCount })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {sourceData.health_error_code === "AUTH_REQUIRED" && can.credentials && (
              <button
                type="button"
                onClick={() => setReconnectOpen(true)}
                className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-amber-900"
              >
                {t("jobImports.detail.actions.reconnect")}
              </button>
            )}
            {retryable && can.run && (
              <button
                type="button"
                onClick={retryRun}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-amber-900 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> {t("jobImports.detail.actions.retry")}
              </button>
            )}
            {reviewCount > 0 && can.review && (
              <Link
                to={`/agency/import/jobs/runs/${latestRun.id}`}
                className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-bold text-white"
              >
                {t("jobImports.detail.actions.review", { count: reviewCount })}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            "connector",
            `${t(`jobImports.connectors.${sourceData.connector_type}`, { defaultValue: sourceData.connector_type })} · v${sourceData.connector_version}`,
          ],
          ["client", client?.company?.name || sourceData.employer_company_id],
          ["lastAttempt", formatImportDate(sourceData.last_attempt_at, i18n.language)],
          ["lastSuccess", formatImportDate(sourceData.last_success_at, i18n.language)],
          ["nextRun", formatImportDate(sourceData.next_run_at, i18n.language)],
        ].map(([label, value]) => (
          <Panel key={label}>
            <p className="text-xs font-bold uppercase text-slate-500">
              {t(`jobImports.detail.${label}`)}
            </p>
            <p className="mt-2 break-words text-sm font-bold text-slate-900">{value || "—"}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <Panel id="settings">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-900">
                  {t("jobImports.detail.configuration")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("jobImports.detail.configurationDescription")}
                </p>
              </div>
              <Settings className="h-5 w-5 text-slate-400" />
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "publishPolicy",
                  t(`jobImports.detail.policyValues.${sourceData.publish_policy}`, {
                    defaultValue: t("jobImports.statuses.unknown"),
                  }),
                ],
                [
                  "closingPolicy",
                  t(`jobImports.detail.policyValues.${sourceData.closing_policy}`, {
                    defaultValue: t("jobImports.statuses.unknown"),
                  }),
                ],
                [
                  "schedule",
                  sourceData.interval_hours
                    ? t("jobImports.detail.everyHours", { count: sourceData.interval_hours })
                    : t("jobImports.detail.manual"),
                ],
                ["locale", `${sourceData.locale} · ${sourceData.timezone}`],
                ["configurationVersion", sourceData.configuration_version],
                ["mappingVersion", sourceData.mapping_version],
                [
                  "credentials",
                  t(
                    `jobImports.detail.${sourceData.credentials_connected ? "connected" : "notConnected"}`,
                  ),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold text-slate-500">
                    {t(`jobImports.detail.settings.${label}`)}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-900">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold uppercase text-slate-500">
                {t("jobImports.detail.capabilities")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(connector?.capabilities || []).map((capability) => (
                  <StatusPill key={capability} value={capability} />
                ))}
              </div>
              {connector?.limitations?.length ? (
                <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
                  {connector.limitations.map((limitation) => (
                    <li key={limitation}>
                      {t(`jobImports.capabilities.${limitation}`, {
                        defaultValue: t("jobImports.capabilities.unknown"),
                      })}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600" />
              <h2 className="font-black text-slate-900">{t("jobImports.detail.assignments")}</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {assignments.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-500">
                    {t(`jobImports.detail.assignmentLabels.${label}`)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {value || t("jobImports.detail.unassigned")}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="font-black text-slate-900">{t("jobImports.detail.runs")}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("jobImports.detail.runsDescription")}
                </p>
              </div>
              <label className="text-xs font-bold text-slate-700">
                {t("jobImports.detail.filterRunStatus")}
                <select
                  value={runStatus}
                  onChange={(event) => {
                    setRunStatus(event.target.value)
                    setRunPage(1)
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">{t("jobImports.detail.allStatuses")}</option>
                  {[
                    "pending",
                    "running",
                    "completed",
                    "partial",
                    "failed",
                    "dead_letter",
                    "cancelled",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {t(`jobImports.detail.runStatuses.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {runs.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">{t("common.loading")}</div>
            ) : !runs.data?.data.length ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("jobImports.detail.noRuns")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {runs.data.data.map((run) => (
                  <Link
                    key={run.id}
                    to={`/agency/import/jobs/runs/${run.id}`}
                    className="grid gap-3 p-4 hover:bg-slate-50 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-xs text-slate-500">#{run.id}</p>
                      <p className="font-bold text-slate-900">
                        {t(`jobImports.detail.runModes.${run.mode}`, {
                          defaultValue: t("jobImports.statuses.unknown"),
                        })}
                      </p>
                    </div>
                    <div className="text-sm text-slate-700">
                      {t("jobImports.detail.runSummary", {
                        items: formatImportNumber(run.items_fetched, i18n.language),
                        changes: formatImportNumber(
                          run.create_count + run.update_count + run.close_count + run.reopen_count,
                          i18n.language,
                        ),
                      })}
                    </div>
                    <div className="text-sm text-slate-600">
                      {formatImportDate(run.completed_at || run.started_at, i18n.language)}
                    </div>
                    <StatusPill value={run.status} />
                  </Link>
                ))}
              </div>
            )}
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 p-4">
                <p className="text-xs text-slate-500">
                  {t("jobImports.detail.page", {
                    page: pagination.page,
                    pages: pagination.totalPages,
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRunPage((value) => Math.max(1, value - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="rounded-lg border p-2 disabled:opacity-40"
                    aria-label={t("common.prev")}
                  >
                    {i18n.dir() === "rtl" ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunPage((value) => value + 1)}
                    disabled={!pagination.hasNextPage}
                    className="rounded-lg border p-2 disabled:opacity-40"
                    aria-label={t("common.next")}
                  >
                    {i18n.dir() === "rtl" ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel>
            <h2 className="font-black text-slate-900">{t("jobImports.detail.latestChanges")}</h2>
            {latestRun ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ChangeCount
                    label={t("jobImports.sources.counts.create")}
                    value={latestRun.create_count}
                    tone="green"
                  />
                  <ChangeCount
                    label={t("jobImports.sources.counts.update")}
                    value={latestRun.update_count}
                    tone="blue"
                  />
                  <ChangeCount
                    label={t("jobImports.sources.counts.close")}
                    value={latestRun.close_count}
                    tone="red"
                  />
                  <ChangeCount
                    label={t("jobImports.sources.counts.review")}
                    value={latestRun.review_count}
                    tone="amber"
                  />
                </div>
                <Link
                  to={`/agency/import/jobs/runs/${latestRun.id}`}
                  className="mt-4 inline-flex text-sm font-bold text-violet-700"
                >
                  {t("jobImports.detail.viewLatestRun")}
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">{t("jobImports.detail.noRuns")}</p>
            )}
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-violet-600" />
              <h2 className="font-black text-slate-900">{t("jobImports.detail.healthTimeline")}</h2>
            </div>
            <ol className="mt-4 space-y-4">
              {timelineRuns.slice(0, 8).map((run) => (
                <li
                  key={run.id}
                  className="relative ps-5 before:absolute before:bottom-[-18px] before:start-[5px] before:top-4 before:w-px before:bg-slate-200 last:before:hidden"
                >
                  <span
                    className={`absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full ${["completed"].includes(run.status) ? "bg-emerald-500" : ["running", "pending"].includes(run.status) ? "bg-blue-500" : "bg-amber-500"}`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill value={run.status} />
                    <span dir="ltr" className="text-xs text-slate-600">
                      #{run.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatImportDate(run.completed_at || run.started_at, i18n.language)}
                  </p>
                  {(run.completed_at || run.started_at) && (
                    <p className="text-xs text-slate-500">
                      {formatImportRelativeTime(run.completed_at || run.started_at, i18n.language)}
                    </p>
                  )}
                  {run.error?.code && (
                    <p className="mt-1 text-xs font-bold text-red-700">
                      {t(`jobImports.errors.${run.error.code}`, {
                        defaultValue: t("jobImports.detail.notifications.actionFailed"),
                      })}
                    </p>
                  )}
                </li>
              ))}
              {!timelineRuns.length && (
                <li className="text-sm text-slate-500">{t("jobImports.detail.noTimeline")}</li>
              )}
            </ol>
          </Panel>

          <Panel>
            <h2 className="font-black text-slate-900">{t("jobImports.detail.audit")}</h2>
            {audit.isError ? (
              <p className="mt-3 text-sm text-slate-500">
                {t("jobImports.detail.auditUnavailable")}
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {(audit.data?.data || []).slice(0, 8).map((event) => (
                  <li key={event.id} className="border-s border-slate-200 ps-3">
                    <p className="text-sm font-bold text-slate-800">
                      {t(`jobImports.detail.auditActions.${event.action}`, {
                        defaultValue: t("jobImports.detail.auditActions.unknown"),
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.actor_email || t("jobImports.detail.systemActor")} ·{" "}
                      {formatImportDate(event.created_date, i18n.language)}
                    </p>
                  </li>
                ))}
                {!audit.isLoading && !audit.data?.data.length && (
                  <li className="text-sm text-slate-500">{t("jobImports.detail.noAudit")}</li>
                )}
              </ol>
            )}
          </Panel>

          {(can.update || can.credentials || can.archive) && sourceData.state !== "archived" && (
            <Panel>
              <h2 className="font-black text-slate-900">{t("jobImports.detail.controls")}</h2>
              <div className="mt-4 grid gap-2">
                {can.update && sourceData.state !== "draft" && (
                  <button
                    type="button"
                    onClick={togglePause}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
                  >
                    <CirclePause className="h-4 w-4" />
                    {t(
                      `jobImports.detail.actions.${sourceData.state === "paused" ? "resume" : "pause"}`,
                    )}
                  </button>
                )}
                {can.credentials && (
                  <button
                    type="button"
                    onClick={() => setReconnectOpen((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"
                  >
                    <KeyRound className="h-4 w-4" />
                    {t("jobImports.detail.actions.reconnect")}
                  </button>
                )}
                {can.archive && (
                  <button
                    type="button"
                    ref={archiveOpenerRef}
                    onClick={() => setArchiveOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700"
                  >
                    <Archive className="h-4 w-4" />
                    {t("jobImports.detail.actions.archive")}
                  </button>
                )}
              </div>
              {reconnectOpen && (
                <form onSubmit={reconnect} className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
                  <label
                    className="block text-xs font-bold text-slate-700"
                    htmlFor="credential-reference"
                  >
                    {t("jobImports.detail.credentialReference")}
                  </label>
                  <input
                    id="credential-reference"
                    required
                    minLength={3}
                    value={credentialReference}
                    onChange={(event) => setCredentialReference(event.target.value)}
                    placeholder="vault://job-imports/source"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-slate-500">{t("jobImports.detail.credentialHint")}</p>
                  <button
                    type="submit"
                    disabled={busy === "reconnect"}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busy === "reconnect" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("jobImports.detail.actions.saveCredential")
                    )}
                  </button>
                </form>
              )}
            </Panel>
          )}
        </aside>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            if (archiveOpenerRef.current?.isConnected) {
              event.preventDefault()
              archiveOpenerRef.current.focus()
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("jobImports.detail.archive.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("jobImports.detail.archive.description", { name: sourceData.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>{t("jobImports.detail.archive.stopSchedule")}</li>
            <li>{t("jobImports.detail.archive.keepJobs")}</li>
            <li>{t("jobImports.detail.archive.keepHistory")}</li>
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={archive} className="bg-red-600 text-white hover:bg-red-700">
              {busy === "archive" && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("jobImports.detail.actions.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
