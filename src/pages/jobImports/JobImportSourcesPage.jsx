import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Eye,
  Filter,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  ServerCrash,
  Settings,
  ShieldAlert,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { importSourceService } from "@/api/services/importSourceService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import {
  latestRunChanges,
  SOURCE_OPERATIONAL_STATUSES,
  sourceFreshness,
  trendLabel,
} from "@/domain/jobImports/sourceOperations"
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
  ErrorPanel,
  formatImportDate,
  PageHeading,
  PageShell,
  Panel,
  StatusPill,
} from "./JobImportUi"

const PAGE_SIZE = 20

function MetricCard({ status, count, active, onClick, t }) {
  const icons = {
    healthy: RefreshCw,
    running: Play,
    needs_review: AlertTriangle,
    degraded: ShieldAlert,
    auth_required: ShieldAlert,
    paused: CirclePause,
  }

  const Icon = icons[status]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border bg-white p-4 text-start shadow-sm transition hover:border-violet-300 ${
        active ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {t(`jobImports.sources.health.${status}`)}
        </span>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{count}</p>
    </button>
  )
}

function Count({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  }

  return (
    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${tones[tone]}`}>
      {label} {value}
    </span>
  )
}

function SourceRow({ source, actionBusy, onRun, onPause, onArchive, can, t, i18n }) {
  const latest = source.latest_run

  const changes = latestRunChanges(latest)

  const freshness = sourceFreshness(source)

  const trend = trendLabel(source.trend?.changes || 0, source.trend?.comparison_available)

  return (
    <article className="grid gap-4 p-5 xl:grid-cols-[minmax(240px,1.5fr)_minmax(230px,1fr)_minmax(280px,1.25fr)_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/agency/import/jobs/${source.id}`}
            className="truncate font-black text-slate-900 hover:text-violet-700"
          >
            {source.name}
          </Link>
          <StatusPill value={source.operational_status} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">{source.url}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t("jobImports.sources.connectorValue", {
            connector: t(`jobImports.connectors.${source.connector_type}`, {
              defaultValue: source.connector_type,
            }),
            version: source.connector_version,
          })}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <dt className="text-slate-500">{t("jobImports.sources.lastAttempt")}</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {formatImportDate(source.last_attempt_at, i18n.language)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("jobImports.sources.lastSuccess")}</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {formatImportDate(source.last_success_at, i18n.language)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("jobImports.sources.nextRun")}</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {formatImportDate(source.next_run_at, i18n.language)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t("jobImports.sources.freshness")}</dt>
          <dd className="mt-1 font-semibold text-slate-800">
            {t(`jobImports.sources.freshnessStates.${freshness}`)}
          </dd>
        </div>
      </dl>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">{t("jobImports.sources.latestRun")}</p>
          {latest && <StatusPill value={latest.status} />}
        </div>
        {latest ? (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Count
                label={t("jobImports.sources.counts.create")}
                value={latest.create_count}
                tone="green"
              />
              <Count
                label={t("jobImports.sources.counts.update")}
                value={latest.update_count}
                tone="blue"
              />
              <Count
                label={t("jobImports.sources.counts.close")}
                value={latest.close_count}
                tone="red"
              />
              <Count
                label={t("jobImports.sources.counts.review")}
                value={latest.review_count}
                tone="amber"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t(`jobImports.sources.trend.${trend}`, {
                count: Math.abs(source.trend?.changes || changes),
              })}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t("jobImports.sources.noRuns")}</p>
        )}
      </div>

      <div className="flex flex-wrap justify-start gap-2 xl:max-w-[230px] xl:justify-end">
        <Link
          to={`/agency/import/jobs/${source.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" /> {t("jobImports.sources.actions.details")}
        </Link>
        {can.run && (
          <button
            type="button"
            onClick={() => onRun(source)}
            disabled={Boolean(actionBusy)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {actionBusy === `run-${source.id}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {t("jobImports.sources.actions.preview")}
          </button>
        )}
        {can.update && source.state !== "draft" && (
          <button
            type="button"
            onClick={() => onPause(source)}
            disabled={Boolean(actionBusy)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
          >
            <CirclePause className="h-3.5 w-3.5" />
            {t(`jobImports.sources.actions.${source.state === "paused" ? "resume" : "pause"}`)}
          </button>
        )}
        {can.update && (
          <Link
            to={`/agency/import/jobs/${source.id}#settings`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
          >
            <Settings className="h-3.5 w-3.5" /> {t("jobImports.sources.actions.settings")}
          </Link>
        )}
        {can.review && latest?.review_count > 0 && (
          <Link
            to={`/agency/import/jobs/runs/${latest.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> {t("jobImports.sources.actions.review")}
          </Link>
        )}
        {can.archive && (
          <button
            type="button"
            onClick={() => onArchive(source)}
            disabled={Boolean(actionBusy)}
            aria-label={t("jobImports.sources.actions.archiveNamed", { name: source.name })}
            className="inline-flex items-center rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  )
}

export default function JobImportSourcesPage() {
  const { t, i18n } = useTranslation()

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const { canResource } = usePermissionMatrix()

  const [page, setPage] = useState(1)

  const [search, setSearch] = useState("")

  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [status, setStatus] = useState("")

  const [connector, setConnector] = useState("")

  const [actionBusy, setActionBusy] = useState("")

  const [archiveTarget, setArchiveTarget] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search])

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: debouncedSearch || undefined,
      operational_status: status || undefined,
      connector_type: connector || undefined,
    }),
    [connector, debouncedSearch, page, status],
  )

  const sources = useQuery({
    queryKey: ["job-import-source-dashboard", query],
    queryFn: () => importSourceService.listDashboard(query),
    refetchInterval: 30_000,
  })

  const health = useQuery({
    queryKey: ["job-import-health"],
    queryFn: () => importSourceService.getHealth(),
    refetchInterval: 30_000,
  })

  const catalog = useQuery({
    queryKey: ["job-import-connectors"],
    queryFn: () => importSourceService.connectorCatalog(),
  })

  const refresh = async () => {
    await Promise.all([sources.refetch(), health.refetch()])
  }

  const runPreview = async (source) => {
    setActionBusy(`run-${source.id}`)

    try {
      const queued = await importSourceService.queuePreview(source.id)

      toast.success(t("jobImports.sources.notifications.previewQueued"))
      navigate(`/agency/import/jobs/runs/${queued.run_id}`)
    } catch (error) {
      toast.error(error.message || t("jobImports.sources.notifications.actionFailed"))
    } finally {
      setActionBusy("")
    }
  }

  const togglePause = async (source) => {
    setActionBusy(`state-${source.id}`)

    try {
      if (source.state === "paused") {
        await importSourceService.resume(source.id)
      } else {
        await importSourceService.pause(source.id)
      }

      toast.success(
        t(`jobImports.sources.notifications.${source.state === "paused" ? "resumed" : "paused"}`),
      )
      await queryClient.invalidateQueries({ queryKey: ["job-import-source"] })
      await refresh()
    } catch (error) {
      toast.error(error.message || t("jobImports.sources.notifications.actionFailed"))
    } finally {
      setActionBusy("")
    }
  }

  const archiveSource = async () => {
    if (!archiveTarget) {
      return
    }

    setActionBusy(`archive-${archiveTarget.id}`)

    try {
      await importSourceService.archive(archiveTarget.id)
      toast.success(t("jobImports.sources.notifications.archived"))
      setArchiveTarget(null)
      await refresh()
    } catch (error) {
      toast.error(error.message || t("jobImports.sources.notifications.actionFailed"))
    } finally {
      setActionBusy("")
    }
  }

  if (sources.isError) {
    return (
      <PageShell>
        <ErrorPanel onRetry={refresh} />
      </PageShell>
    )
  }

  const rows = sources.data?.data || []

  const pagination = sources.data?.pagination

  const metrics = health.data?.sources || {}

  const healthCounts = {
    healthy: metrics.operational_healthy || 0,
    running: metrics.operational_running || 0,
    needs_review: metrics.operational_needs_review || 0,
    degraded: metrics.operational_degraded || 0,
    auth_required: metrics.operational_auth_required || 0,
    paused: metrics.operational_paused || 0,
  }

  const attention = healthCounts.needs_review + healthCounts.degraded + healthCounts.auth_required

  const can = {
    run: canResource("job_imports", "run"),
    update: canResource("job_imports", "update"),
    review: canResource("job_imports", "review"),
    archive: canResource("job_imports", "archive"),
  }

  return (
    <PageShell>
      <PageHeading
        eyebrow={t("jobImports.sources.eyebrow")}
        title={t("jobImports.sources.title")}
        description={t("jobImports.sources.description")}
        actions={
          <>
            <button
              type="button"
              onClick={refresh}
              aria-label={t("jobImports.sources.refresh")}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${sources.isFetching ? "animate-spin" : ""}`} />
            </button>
            {canResource("job_imports", "create") && (
              <Link
                to="/agency/import/jobs/new"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                {t("jobImports.sources.add")}
              </Link>
            )}
          </>
        }
      />

      {attention > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">
              {t("jobImports.sources.attentionTitle", { count: attention })}
            </p>
            <p className="mt-1 text-sm text-amber-800">{t("jobImports.sources.attentionHint")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {SOURCE_OPERATIONAL_STATUSES.map((key) => (
          <MetricCard
            key={key}
            status={key}
            count={health.isLoading ? "—" : healthCounts[key]}
            active={status === key}
            onClick={() => {
              setStatus((current) => (current === key ? "" : key))
              setPage(1)
            }}
            t={t}
          />
        ))}
      </div>

      <Panel className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative">
            <span className="sr-only">{t("jobImports.sources.search")}</span>
            <Search className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("jobImports.sources.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-200 py-2.5 pe-3 ps-9 text-sm"
            />
          </label>
          <label className="relative">
            <span className="sr-only">{t("jobImports.sources.connectorFilter")}</span>
            <Filter className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
            <select
              value={connector}
              onChange={(event) => {
                setConnector(event.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-slate-200 py-2.5 pe-3 ps-9 text-sm"
            >
              <option value="">{t("jobImports.sources.allConnectors")}</option>
              {(catalog.data || []).map((item) => (
                <option key={item.type} value={item.type}>
                  {t(`jobImports.connectors.${item.type}`, { defaultValue: item.type })}
                </option>
              ))}
            </select>
          </label>
          {(status || connector || search) && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setDebouncedSearch("")
                setStatus("")
                setConnector("")
                setPage(1)
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-violet-700"
            >
              {t("jobImports.sources.clearFilters")}
            </button>
          )}
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        {sources.isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("common.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <ServerCrash className="h-9 w-9 text-slate-300" />
            <h2 className="mt-4 font-black text-slate-900">
              {search || status || connector
                ? t("jobImports.sources.noResultsTitle")
                : t("jobImports.sources.emptyTitle")}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              {search || status || connector
                ? t("jobImports.sources.noResultsDescription")
                : t("jobImports.sources.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                actionBusy={actionBusy}
                onRun={runPreview}
                onPause={togglePause}
                onArchive={setArchiveTarget}
                can={can}
                t={t}
                i18n={i18n}
              />
            ))}
          </div>
        )}
      </Panel>

      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label={t("jobImports.sources.pagination")}
          className="flex items-center justify-between gap-3"
        >
          <p className="text-sm text-slate-500">
            {t("jobImports.sources.paginationSummary", {
              page: pagination.page,
              pages: pagination.totalPages,
              total: pagination.total,
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={!pagination.hasPrevPage}
              aria-label={t("common.prev")}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              {i18n.dir() === "rtl" ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              disabled={!pagination.hasNextPage}
              aria-label={t("common.next")}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              {i18n.dir() === "rtl" ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </nav>
      )}

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("jobImports.sources.archive.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("jobImports.sources.archive.description", { name: archiveTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>{t("jobImports.sources.archive.stopSchedule")}</li>
            <li>{t("jobImports.sources.archive.keepJobs")}</li>
            <li>{t("jobImports.sources.archive.keepHistory")}</li>
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={archiveSource}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionBusy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t("jobImports.sources.actions.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  )
}
