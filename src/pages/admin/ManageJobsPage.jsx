import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { jobService } from "@/api/services/jobService"
import { compensationPlanService } from "@/api/services/compensationPlanService"
import { AlertCircle, Briefcase, CheckCircle, XCircle } from "lucide-react"

import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { useLocation, useSearchParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { useAgencyWorkspace } from "@/hooks/useAgencyWorkspace"
import {
  buildJobsListQuery,
  isJobsPageForbidden,
  JOBS_PAGE_SIZE,
} from "@/domain/agency/jobListQuery"
import {
  getEffectiveJobState,
  getJobKpis,
  getJobsEmptyState,
  isJobVisibleForList,
  updateJobStats,
  withJobState,
} from "@/domain/agency/jobState"
import { buildJobPipelinePath } from "@/domain/agency/jobWorkflow"
import { copyText } from "@/domain/agency/clipboard"

function CopyButton({ text }) {
  const { t } = useTranslation()

  const [copyState, setCopyState] = useState("idle")

  const handleCopy = async (e) => {
    e.stopPropagation()

    try {
      await copyText(text)
      setCopyState("copied")
      window.setTimeout(() => setCopyState("idle"), 2000)
    } catch {
      setCopyState("error")
      toast.error(t("jobs_management.copyError"))
      window.setTimeout(() => setCopyState("idle"), 3000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={t(copyState === "error" ? "jobs_management.copyError" : "jobs_management.copyAddress")}
      aria-label={t(
        copyState === "error" ? "jobs_management.copyError" : "jobs_management.copyAddress",
      )}
      className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ${
        copyState === "copied"
          ? "bg-green-100 text-green-600"
          : copyState === "error"
            ? "bg-red-100 text-red-600"
            : "bg-[#F3EFFF] text-[#7C3AED] hover:bg-[#EDE9FF]"
      }`}
    >
      {copyState === "copied" ? (
        <Check className="w-3.5 h-3.5" />
      ) : copyState === "error" ? (
        <XCircle className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  )
}

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-100 text-amber-700",
  filled: "bg-blue-100 text-blue-700",
  closed: "bg-red-100 text-red-700",
}

const ROUTE_STATES = { open: "open", filled: "filled", hold: "on_hold" }

const EMPTY_STATS = { total: 0, draft: 0, open: 0, on_hold: 0, filled: 0, closed: 0 }

export default function ManageJobsPage() {
  const { t, i18n } = useTranslation()

  const direction = i18n.dir()

  const locale = i18n.resolvedLanguage?.startsWith("he") ? "he-IL" : "en-US"

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }),
    [locale],
  )

  const percentFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }),
    [locale],
  )

  const { can, loading: permissionsLoading } = usePermissionMatrix()

  const { base, paths } = useAgencyWorkspace()

  const navigate = useNavigate()

  const canCreate = can("create")

  const canUpdate = can("update")

  const canView = can("view")

  const canViewCompensation = can("view_compensation")

  const [searchParams] = useSearchParams()

  const location = useLocation()

  const routeState = ROUTE_STATES[location.pathname.split("/").pop()] || null

  const preselectedClientId = searchParams.get("clientId")

  const preselectedJobId = Number(searchParams.get("jobId")) || null

  const [jobs, setJobs] = useState([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")

  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [page, setPage] = useState(1)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: JOBS_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const [stats, setStats] = useState(EMPTY_STATS)

  const [statsLoading, setStatsLoading] = useState(true)

  const [showClosed, setShowClosed] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)

  const [editingJob, setEditingJob] = useState(null)

  const [compensationPlans, setCompensationPlans] = useState([])

  const [compensationLoading, setCompensationLoading] = useState(false)

  const [compensationError, setCompensationError] = useState(false)

  const [statsError, setStatsError] = useState(false)

  const [loadError, setLoadError] = useState("")

  const [updatingId, setUpdatingId] = useState(null)

  const [provisioningId, setProvisioningId] = useState(null)

  const [expandedJobIds, setExpandedJobIds] = useState(() => new Set())

  const loadRequestRef = useRef(0)

  const compensationRequestRef = useRef(0)

  const viewForbidden = isJobsPageForbidden({
    permissionsLoading,
    agencyWorkspace: base,
    canView,
  })

  const loadJobs = useCallback(async () => {
    const requestId = ++loadRequestRef.current

    setLoading(true)
    setLoadError("")

    try {
      const result = await jobService.listPage(
        buildJobsListQuery({
          page,
          routeState,
          showClosed,
          search: debouncedSearch,
        }),
      )

      if (requestId !== loadRequestRef.current) {
        return
      }

      setJobs(result.data)
      setPagination(result.pagination)
    } catch (error) {
      if (requestId === loadRequestRef.current) {
        setLoadError(error?.status === 403 ? "forbidden" : "jobs")
        setJobs([])
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, page, routeState, showClosed])

  const loadCompensation = useCallback(async () => {
    if (!canViewCompensation) {
      setCompensationPlans([])
      setCompensationError(false)
      setCompensationLoading(false)

      return
    }

    const requestId = ++compensationRequestRef.current

    setCompensationLoading(true)
    setCompensationError(false)

    try {
      const plans = await compensationPlanService.list({ limit: 500 })

      if (requestId === compensationRequestRef.current) {
        setCompensationPlans(plans)
      }
    } catch {
      if (requestId === compensationRequestRef.current) {
        setCompensationError(true)
      }
    } finally {
      if (requestId === compensationRequestRef.current) {
        setCompensationLoading(false)
      }
    }
  }, [canViewCompensation])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError(false)

    try {
      setStats(await jobService.stats())
    } catch (error) {
      if (error?.status === 403) {
        setLoadError("forbidden")
      } else {
        setStatsError(true)
      }
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const refreshData = useCallback(
    () => Promise.all([loadJobs(), loadStats(), loadCompensation()]),
    [loadCompensation, loadJobs, loadStats],
  )

  const getCompensation = (job) => {
    if (!job) {
      return null
    }

    const jobPlan = compensationPlans.find((p) => p.job_id === job.id)

    return jobPlan || compensationPlans.find((p) => p.client_name === job.company && !p.job_id)
  }

  const formatCompensation = (job) => {
    if (compensationLoading) {
      return t("jobs_management.compensation.loading")
    }

    if (compensationError) {
      return t("jobs_management.compensation.unavailable")
    }

    const plan = getCompensation(job)

    const value = plan?.recruiter_compensation

    if (!value) {
      return "—"
    }

    if (plan.recruiter_compensation_type === "fixed") {
      return currencyFormatter.format(value)
    }

    if (plan.recruiter_compensation_type === "percent" && plan.total_fee) {
      return currencyFormatter.format((plan.total_fee * value) / 100)
    }

    return percentFormatter.format(value / 100)
  }

  const formatWarranty = (job) => {
    if (compensationLoading) {
      return t("jobs_management.compensation.loading")
    }

    if (compensationError) {
      return t("jobs_management.compensation.unavailable")
    }

    const plan = getCompensation(job)

    if (!plan) {
      return "—"
    }

    const days = plan.warranty_period_days ?? 30

    return t("jobs_management.days", { count: numberFormatter.format(days) })
  }

  const toggleJobDetails = (jobId) => {
    setExpandedJobIds((current) => {
      const next = new Set(current)

      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }

      return next
    })
  }

  useEffect(() => {
    if (permissionsLoading) {
      return
    }

    if (viewForbidden) {
      setJobs([])
      setStats(EMPTY_STATS)
      setLoading(false)
      setStatsLoading(false)

      return
    }

    loadJobs()
  }, [loadJobs, permissionsLoading, viewForbidden])

  useEffect(() => {
    if (!permissionsLoading && (!base || canView)) {
      loadStats()
    }
  }, [base, canView, loadStats, permissionsLoading])

  useEffect(() => {
    if (!permissionsLoading && (!base || canView)) {
      loadCompensation()
    }
  }, [base, canView, loadCompensation, permissionsLoading])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [routeState, showClosed])
  useEffect(() => {
    if (preselectedClientId && canCreate) {
      setEditingJob(null)
      setModalOpen(true)
    }
  }, [preselectedClientId, canCreate])

  useEffect(() => {
    if (!preselectedJobId || !jobs.length) {
      return
    }

    const selectedJob = jobs.find((job) => job.id === preselectedJobId)

    if (selectedJob && canUpdate) {
      setEditingJob(selectedJob)
      setModalOpen(true)
    }
  }, [canUpdate, jobs, preselectedJobId])

  const handleNew = () => {
    setEditingJob(null)
    setModalOpen(true)
  }

  const handleEdit = (job) => {
    setEditingJob(job)
    setModalOpen(true)
  }

  const mutateJobState = async (job, nextState, request, successKey) => {
    const previousState = getEffectiveJobState(job)

    const jobsSnapshot = jobs

    const statsSnapshot = stats

    const paginationSnapshot = pagination

    const optimisticJob = withJobState(job, nextState)

    const remainsVisible = isJobVisibleForList(nextState, { routeState, showClosed })

    setUpdatingId(job.id)
    setJobs((current) =>
      remainsVisible
        ? current.map((item) => (item.id === job.id ? optimisticJob : item))
        : current.filter((item) => item.id !== job.id),
    )
    setStats((current) => updateJobStats(current, previousState, nextState))

    if (!remainsVisible) {
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }))
    }

    try {
      const saved = await request()

      if (remainsVisible && saved) {
        setJobs((current) =>
          current.map((item) => (item.id === job.id ? { ...item, ...saved } : item)),
        )
      }

      toast.success(t(successKey))
    } catch {
      setJobs(jobsSnapshot)
      setStats(statsSnapshot)
      setPagination(paginationSnapshot)
      toast.error(t("jobs_management.updateError"))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleClose = async (job) => {
    const effectiveState = getEffectiveJobState(job)

    const nextState = effectiveState === "closed" ? "open" : "closed"

    await mutateJobState(
      job,
      nextState,
      () => (effectiveState === "closed" ? jobService.reopen(job.id) : jobService.close(job.id)),
      effectiveState === "closed" ? "jobs_management.jobReopened" : "jobs_management.jobClosed",
    )
  }

  const handleStateChange = async (job, state) => {
    await mutateJobState(
      job,
      state,
      () => jobService.update(job.id, { state }),
      "jobs_management.statusUpdated",
    )
  }

  const handleProvisionPublication = async (job) => {
    setProvisioningId(job.id)

    try {
      await jobService.provisionPublication(job.id)
      toast.success(t("jobs_management.publication.ready"))
      await loadJobs()
    } catch {
      toast.error(t("jobs_management.publication.error"))
    } finally {
      setProvisioningId(null)
    }
  }

  const jobKpis = getJobKpis(stats)

  const emptyState = getJobsEmptyState({
    routeState,
    search: search.trim() || debouncedSearch,
  })

  const clearSearch = () => {
    setSearch("")
    setDebouncedSearch("")
    setPage(1)
  }

  const selectedJob = preselectedJobId
    ? jobs.find((job) => job.id === preselectedJobId) || null
    : null

  if (viewForbidden) {
    return (
      <PlatformPageShell dir={direction}>
        <PlatformEmptyState icon={AlertCircle} className="min-h-[420px]">
          <p className="text-red-700 font-bold text-lg">{t("jobs_management.accessDenied")}</p>

          <p className="text-slate-500 text-sm mt-1">
            {t("jobs_management.accessDeniedDescription")}
          </p>
        </PlatformEmptyState>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell dir={direction}>
      <div className="space-y-6">
        {/* Header */}
        <PlatformPageHeader
          title={t("jobs_management.title")}
          subtitle={t("jobs_management.subtitle")}
          icon={Briefcase}
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={loading}
                aria-label={t("jobs_management.refresh")}
                title={t("jobs_management.refresh")}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white/90 text-slate-500 shadow-[0_7px_20px_rgba(60,74,125,0.08)] transition hover:text-[#6C4DFF] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              {canCreate && (
                <button
                  onClick={handleNew}
                  className="gradient-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(93,82,216,0.24)] transition hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  {t("jobs_management.addJob")}
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformStatCard
            icon={Briefcase}
            label={t("jobs_management.kpi.all")}
            value={jobKpis.total}
            formattedValue={numberFormatter.format(jobKpis.total)}
            tone="violet"
            loading={statsLoading}
            meta={t("jobs_management.kpi.allMeta")}
          />

          <PlatformStatCard
            icon={CheckCircle}
            label={t("jobs_management.kpi.open")}
            value={jobKpis.open}
            formattedValue={numberFormatter.format(jobKpis.open)}
            tone="emerald"
            loading={statsLoading}
            meta={t("jobs_management.kpi.openMeta")}
          />

          <PlatformStatCard
            icon={XCircle}
            label={t("jobs_management.kpi.notRecruiting")}
            value={jobKpis.notRecruiting}
            formattedValue={numberFormatter.format(jobKpis.notRecruiting)}
            tone="rose"
            loading={statsLoading}
            meta={t("jobs_management.kpi.notRecruitingMeta")}
          />
        </div>

        {statsError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
          >
            <span>{t("jobs_management.unableToLoadTotals")}</span>
            <button type="button" onClick={loadStats} className="font-black underline">
              {t("jobs_management.tryAgain")}
            </button>
          </div>
        )}

        {selectedJob && !canUpdate && (
          <PlatformCard className="border-violet-200 bg-violet-50/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-violet-500">
                  {t("jobs_management.assignedJob")}
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-900">{selectedJob.title}</h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedJob.company} · {selectedJob.location || "—"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[getEffectiveJobState(selectedJob)]}`}
              >
                {t(`jobs_management.status.${getEffectiveJobState(selectedJob)}`)}
              </span>
            </div>

            {selectedJob.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selectedJob.description}
              </p>
            )}
          </PlatformCard>
        )}

        {/* Filters */}
        <PlatformCard className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

            <label htmlFor="agency-jobs-search" className="sr-only">
              {t("jobs_management.searchPlaceholder")}
            </label>

            <input
              id="agency-jobs-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("jobs_management.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white ps-10 pe-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A78BFA] focus:ring-4 focus:ring-[#F3EFFF]"
            />
          </div>

          {!routeState && (
            <label className="flex items-center gap-2 text-sm font-semibold text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={showClosed}
                onChange={(e) => setShowClosed(e.target.checked)}
                className="h-5 w-5 rounded-md border-slate-300 accent-[#6C4DFF]"
              />
              {t("jobs_management.showClosed")}
            </label>
          )}
        </PlatformCard>

        {canViewCompensation && compensationError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
          >
            <span>{t("jobs_management.compensation.loadError")}</span>
            <button type="button" onClick={loadCompensation} className="font-black underline">
              {t("jobs_management.compensation.retry")}
            </button>
          </div>
        )}

        {/* Jobs Table */}
        {loadError ? (
          <PlatformEmptyState icon={AlertCircle} className="min-h-[300px]">
            <p className="text-red-700 font-bold text-lg">
              {loadError === "forbidden"
                ? t("jobs_management.accessDenied")
                : t("jobs_management.unableToLoad")}
            </p>

            <p className="text-slate-500 text-sm mt-1">
              {loadError === "totals" ? t("jobs_management.unableToLoadTotals") : null}
            </p>

            <button
              onClick={refreshData}
              className="mt-4 h-10 px-5 rounded-xl bg-[#6C4DFF] text-white font-bold text-sm"
            >
              {t("jobs_management.tryAgain")}
            </button>
          </PlatformEmptyState>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <PlatformEmptyState icon={Briefcase} className="min-h-[300px]">
            <p className="text-[#64748B] font-bold text-lg">
              {t(`jobs_management.empty.${emptyState.titleKey}`)}
            </p>

            <p className="text-[#94A3B8] text-sm mt-1">
              {t(
                `jobs_management.empty.${emptyState.descriptionKey}`,
                emptyState.descriptionValues,
              )}
            </p>

            {emptyState.action === "clear_search" && (
              <button
                onClick={clearSearch}
                className="mt-4 h-10 px-5 rounded-xl border border-[#DDEBFF] bg-white text-[#6C4DFF] font-bold text-sm mx-auto"
              >
                {t("jobs_management.clearSearch")}
              </button>
            )}

            {emptyState.action === "create" && canCreate && (
              <button
                onClick={handleNew}
                className="mt-4 h-10 px-5 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-md"
              >
                <Plus className="w-4 h-4" />
                {t("jobs_management.addJob")}
              </button>
            )}
          </PlatformEmptyState>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 2xl:hidden">
              {jobs.map((job) => {
                const state = getEffectiveJobState(job)

                const expanded = expandedJobIds.has(job.id)

                const detailsId = `job-details-${job.id}`

                return (
                  <PlatformCard key={job.id} as="article" className="overflow-hidden p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-black text-slate-900">
                          {job.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{job.company || "—"}</span>
                          </span>

                          <span className="flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{job.location || "—"}</span>
                          </span>
                        </div>
                      </div>

                      {canUpdate ? (
                        <select
                          aria-label={t("jobs_management.statusFor", { title: job.title })}
                          value={state}
                          disabled={updatingId !== null}
                          onChange={(event) => handleStateChange(job, event.target.value)}
                          className={`shrink-0 rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none ${STATUS_COLORS[state]}`}
                        >
                          <option value="draft">{t("jobs_management.status.draft")}</option>
                          <option value="open">{t("jobs_management.status.open")}</option>
                          <option value="on_hold">{t("jobs_management.status.on_hold")}</option>
                          <option value="filled">{t("jobs_management.status.filled")}</option>
                          <option value="closed">{t("jobs_management.status.closed")}</option>
                        </select>
                      ) : (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[state]}`}
                        >
                          {t(`jobs_management.status.${state}`)}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleJobDetails(job.id)}
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        className="flex items-center gap-1.5 text-xs font-bold text-violet-600"
                      >
                        {expanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {t(
                          expanded ? "jobs_management.hideDetails" : "jobs_management.showDetails",
                        )}
                      </button>

                      {canUpdate && (
                        <div
                          className="flex shrink-0 items-center gap-2"
                          role="group"
                          aria-label={t("jobs_management.actions")}
                        >
                          {base && (
                            <button
                              type="button"
                              onClick={() => navigate(buildJobPipelinePath(paths.pipeline, job.id))}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-100 text-violet-600"
                              title={t("jobs_management.pipeline")}
                              aria-label={t("jobs_management.pipeline")}
                            >
                              <Briefcase className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEdit(job)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-100 text-violet-600"
                            title={t("jobs_management.edit")}
                            aria-label={t("jobs_management.edit")}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleClose(job)}
                            disabled={updatingId !== null}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                              state === "closed"
                                ? "border-green-200 text-green-600"
                                : "border-red-200 text-red-500"
                            }`}
                            title={
                              state === "closed"
                                ? t("jobs_management.reopenJob")
                                : t("jobs_management.closeJob")
                            }
                            aria-label={
                              state === "closed"
                                ? t("jobs_management.reopenJob")
                                : t("jobs_management.closeJob")
                            }
                          >
                            {state === "closed" ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {expanded && (
                      <div
                        id={detailsId}
                        className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3"
                      >
                        <div className="sm:col-span-3">
                          <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                            {t("jobs_management.columns.publication")}
                          </div>

                          {job.job_code && job.apply_email && job.apply_url ? (
                            <div className="grid gap-2 text-xs sm:grid-cols-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="rounded-lg bg-violet-50 px-2 py-1 font-mono font-black text-violet-700"
                                  dir="ltr"
                                >
                                  {job.job_code}
                                </span>
                                <CopyButton text={job.job_code} />
                              </div>

                              <div className="flex min-w-0 items-center gap-2">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="truncate font-mono text-slate-600" dir="ltr">
                                  {job.apply_email}
                                </span>
                                <CopyButton text={job.apply_email} />
                              </div>

                              <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
                                <span>🔗</span>
                                <a
                                  href={job.apply_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="truncate text-blue-600 hover:underline"
                                  dir="ltr"
                                >
                                  {job.apply_url.replace("https://", "")}
                                </a>
                                <CopyButton text={job.apply_url} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>{t("jobs_management.publication.incomplete")}</span>
                              {canUpdate && (
                                <button
                                  type="button"
                                  disabled={provisioningId === job.id}
                                  onClick={() => handleProvisionPublication(job)}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-bold"
                                >
                                  {provisioningId === job.id
                                    ? t("jobs_management.publication.settingUp")
                                    : t("jobs_management.publication.retry")}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            {t("jobs_management.form.category")}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-700">
                            {job.category || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            {t("jobs_management.columns.compensation")}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-700">
                            {formatCompensation(job)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            {t("jobs_management.columns.warranty")}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-700">
                            {formatWarranty(job)}
                          </div>
                        </div>
                      </div>
                    )}
                  </PlatformCard>
                )
              })}
            </div>

            <PlatformCard className="hidden overflow-hidden 2xl:block">
              <div>
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[16%]" />
                    <col className="w-[11%]" />
                    <col className="w-[9%]" />
                    <col className="w-[22%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EAF0F8] bg-[#F7FAFF]">
                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3">
                        {t("jobs_management.columns.position")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3 hidden md:table-cell">
                        {t("jobs_management.columns.company")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3 hidden md:table-cell">
                        {t("jobs_management.columns.location")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3">
                        {t("jobs_management.columns.publication")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3">
                        {t("jobs_management.columns.compensation")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3">
                        {t("jobs_management.columns.warranty")}
                      </th>

                      <th className="text-start text-xs font-black text-[#64748B] px-5 py-3">
                        {t("jobs_management.columns.status")}
                      </th>

                      <th className="px-2 py-3">
                        <span className="sr-only">{t("jobs_management.actions")}</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-slate-100 transition-colors last:border-0 hover:bg-[#F8FAFF]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#0F172A] text-sm">{job.title}</div>

                          <div className="text-xs text-[#94A3B8] mt-0.5">{job.category || "—"}</div>
                        </td>

                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-sm text-[#374151]">
                            <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />

                            {job.company || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-sm text-[#374151]">
                            <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />

                            {job.location || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {job.job_code && job.apply_email && job.apply_url ? (
                            <div className="space-y-1.5">
                              <span
                                className="inline-block px-2 py-0.5 bg-[#F3EFFF] text-[#7C3AED] text-xs font-black rounded-lg"
                                dir="ltr"
                              >
                                {job.job_code}
                              </span>

                              {job.apply_email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />

                                  <span
                                    className="text-xs text-[#374151] font-mono break-all"
                                    dir="ltr"
                                  >
                                    {job.apply_email}
                                  </span>

                                  <CopyButton text={job.apply_email} />
                                </div>
                              )}

                              {job.apply_url && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-[#94A3B8]">🔗</span>

                                  <a
                                    href={job.apply_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-[#2563EB] hover:underline truncate max-w-[180px]"
                                    dir="ltr"
                                  >
                                    {job.apply_url.replace("https://", "")}
                                  </a>

                                  <CopyButton text={job.apply_url} />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {t("jobs_management.publication.incomplete")}
                              </div>

                              {canUpdate && (
                                <button
                                  type="button"
                                  disabled={provisioningId === job.id}
                                  onClick={() => handleProvisionPublication(job)}
                                  className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                                >
                                  {provisioningId === job.id
                                    ? t("jobs_management.publication.settingUp")
                                    : t("jobs_management.publication.retry")}
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-[#374151] text-xs">{formatCompensation(job)}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-[#374151] text-xs">{formatWarranty(job)}</span>
                        </td>

                        <td className="px-5 py-4">
                          {canUpdate ? (
                            <select
                              aria-label={t("jobs_management.statusFor", { title: job.title })}
                              value={getEffectiveJobState(job)}
                              disabled={updatingId !== null}
                              onChange={(event) => handleStateChange(job, event.target.value)}
                              className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none ${STATUS_COLORS[getEffectiveJobState(job)]}`}
                            >
                              <option value="draft">{t("jobs_management.status.draft")}</option>

                              <option value="open">{t("jobs_management.status.open")}</option>

                              <option value="on_hold">{t("jobs_management.status.on_hold")}</option>

                              <option value="filled">{t("jobs_management.status.filled")}</option>

                              <option value="closed">{t("jobs_management.status.closed")}</option>
                            </select>
                          ) : (
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[getEffectiveJobState(job)]}`}
                            >
                              {t(`jobs_management.status.${getEffectiveJobState(job)}`)}
                            </span>
                          )}
                        </td>

                        <td className="px-2 py-4">
                          {canUpdate && (
                            <div
                              className="flex items-center gap-2 justify-end"
                              role="group"
                              aria-label={t("jobs_management.actions")}
                            >
                              {base ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(buildJobPipelinePath(paths.pipeline, job.id))
                                  }
                                  className="h-8 w-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all"
                                  title={t("jobs_management.pipeline")}
                                  aria-label={t("jobs_management.pipeline")}
                                >
                                  <Briefcase className="w-3.5 h-3.5" />
                                </button>
                              ) : null}

                              <button
                                onClick={() => handleEdit(job)}
                                title={t("jobs_management.edit")}
                                aria-label={t("jobs_management.edit")}
                                className="h-8 w-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleClose(job)}
                                disabled={updatingId !== null}
                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                                  getEffectiveJobState(job) === "closed"
                                    ? "border-green-200 text-green-600 hover:bg-green-50"
                                    : "border-red-200 text-red-500 hover:bg-red-50"
                                }`}
                                title={
                                  getEffectiveJobState(job) === "closed"
                                    ? t("jobs_management.reopenJob")
                                    : t("jobs_management.closeJob")
                                }
                                aria-label={
                                  getEffectiveJobState(job) === "closed"
                                    ? t("jobs_management.reopenJob")
                                    : t("jobs_management.closeJob")
                                }
                              >
                                {getEffectiveJobState(job) === "closed" ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PlatformCard>

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-500">
              <span>
                {pagination.total === 0
                  ? t("jobs_management.noResults")
                  : t("jobs_management.showingResults", {
                      from: numberFormatter.format((pagination.page - 1) * pagination.limit + 1),
                      to: numberFormatter.format(
                        Math.min(pagination.page * pagination.limit, pagination.total),
                      ),
                      total: numberFormatter.format(pagination.total),
                    })}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("jobs_management.previous")}
                </button>

                <span className="min-w-24 text-center font-semibold text-slate-700">
                  {t("jobs_management.pageOf", {
                    page: numberFormatter.format(pagination.page),
                    totalPages: numberFormatter.format(Math.max(1, pagination.totalPages)),
                  })}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("jobs_management.next")}
                </button>
              </div>
            </div>
          </div>
        )}

        <JobFormModal
          job={editingJob}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={() => {
            toast.success(
              t(editingJob ? "jobs_management.jobUpdated" : "jobs_management.jobCreated"),
            )
            refreshData()
          }}
          preselectedClientId={preselectedClientId}
        />
      </div>
    </PlatformPageShell>
  )
}
import {
  Plus,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  Edit2,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import JobFormModal from "@/components/employer/JobFormModal"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
} from "@/components/platform/PlatformUI"
