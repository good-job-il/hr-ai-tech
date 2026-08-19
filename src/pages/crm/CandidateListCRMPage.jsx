import React, { useState, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { candidateService } from "@/api/services/candidateService"
import { useAuth } from "@/lib/AuthContext"
import { User, UsersRound, UserCheck, Clock3, ShieldAlert } from "lucide-react"

import { getAgencyScopeFilter, isAgencyUser } from "@/domain/agency/access"
import { useAgencyWorkspace } from "@/hooks/useAgencyWorkspace"

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  interview: "bg-purple-100 text-purple-700",
  offer: "bg-orange-100 text-orange-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  inactive: "bg-gray-100 text-gray-500",
}

const PAGE_SIZE = 50 // Performance: Load only 50 candidates at a time

export default function CandidateListCRMPage({ candidateRoute }) {
  const { base, paths } = useAgencyWorkspace()

  const resolvedCandidateRoute = candidateRoute || (base ? paths.candidate : "/crm/candidate")

  const navigate = useNavigate()

  const location = useLocation()

  const { user } = useAuth()

  const { t, i18n } = useTranslation()

  const [candidates, setCandidates] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [search, setSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("all")

  const [hasMore, setHasMore] = useState(false)

  const [page, setPage] = useState(1)

  const [appendLoading, setAppendLoading] = useState(false)

  const isRTL = i18n.language === "he"

  const loadCandidates = async (append = false) => {
    if (!user) {
      return
    }

    if (append) {
      setAppendLoading(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      // ───────────────────────────────────────────────────────────────────────
      // VISIBILITY POLICY — CandidateListCRMPage
      // PERFORMANCE: Paginated loading with 50 records per page
      // ───────────────────────────────────────────────────────────────────────
      const filter = { search: search.trim() || undefined }

      const importBatchId = new URLSearchParams(location.search).get("importBatchId")

      if (importBatchId) {
        filter.import_batch_id = Number(importBatchId)
      }

      if (statusFilter !== "all") {
        filter.status = statusFilter
      }

      const routeMode = location.pathname.split("/").pop()

      if (routeMode === "active") {
        filter.active = true
      }

      if (routeMode === "pipeline") {
        filter.in_pipeline = true
      }

      if (isAgencyUser(user)) {
        Object.assign(filter, getAgencyScopeFilter(user))
      }

      const requestedPage = append ? page + 1 : 1

      const response = await candidateService.listPage({
        ...filter,
        page: requestedPage,
        sort: "created_date",
        order: "DESC",
        limit: PAGE_SIZE,
      })

      setHasMore(response.pagination.hasNextPage)
      setPage(requestedPage)
      setCandidates((previous) =>
        append
          ? [
              ...new Map(
                [...previous, ...response.data].map((candidate) => [candidate.id, candidate]),
              ).values(),
            ]
          : response.data,
      )
    } catch (requestError) {
      setError({
        status: requestError?.status || requestError?.response?.status || null,
        message: requestError?.message || "Unable to load candidates",
      })

      if (!append) {
        setCandidates([])
      }
    } finally {
      setLoading(false)
      setAppendLoading(false)
    }
  }

  // Performance: Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        loadCandidates()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [statusFilter, search, user?.id, location.pathname, location.search, location.key])

  // Performance: Memoized filtering
  const filtered = candidates

  const activeCount = useMemo(
    () =>
      candidates.filter(
        (candidate) => !["hired", "rejected", "inactive"].includes(candidate.status),
      ).length,
    [candidates],
  )

  const hiredCount = useMemo(
    () => candidates.filter((candidate) => candidate.status === "hired").length,
    [candidates],
  )

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-6">
        {/* Header */}
        <PlatformPageHeader
          title={t("crm.candidatesCrm")}
          subtitle={t("crm.candidatesCount", { count: filtered.length })}
          icon={UsersRound}
          actions={
            <button
              onClick={loadCandidates}
              className="flex h-11 items-center gap-2 rounded-xl border border-white bg-white/90 px-4 text-xs font-bold text-slate-600 shadow-[0_7px_20px_rgba(60,74,125,0.08)] transition hover:text-[#6C4DFF]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
              {t("crm.refresh")}
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformStatCard
            icon={UsersRound}
            label={t("crm.candidatesCrm")}
            value={candidates.length}
            tone="violet"
            loading={loading}
            meta="Total profiles"
          />

          <PlatformStatCard
            icon={Clock3}
            label="Active process"
            value={activeCount}
            tone="blue"
            loading={loading}
            meta="Candidates in progress"
          />

          <PlatformStatCard
            icon={UserCheck}
            label={t("crm.statusHired")}
            value={hiredCount}
            tone="emerald"
            loading={loading}
            meta="Successful placements"
          />
        </div>

        {/* Filters */}
        <PlatformCard className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]`}
            />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("crm.searchPlaceholder")}
              className={`${isRTL ? "pr-9" : "pl-9"} h-11 rounded-xl border-slate-200 bg-slate-50/60 text-sm shadow-none focus-visible:border-[#A78BFA] focus-visible:ring-[#F3EFFF]`}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {["all", "new", "contacted", "interview", "offer", "hired", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${statusFilter === s ? (s === "all" ? "gradient-brand text-white shadow-[0_5px_14px_rgba(99,72,210,0.22)]" : `${STATUS_COLORS[s]} border border-current`) : "bg-slate-50 text-slate-500 hover:bg-[#F3EFFF] hover:text-[#6C4DFF]"}`}
              >
                {s === "all"
                  ? t("crm.filterAll")
                  : t(`crm.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
              </button>
            ))}
          </div>
        </PlatformCard>

        {/* Table */}
        <PlatformCard className="overflow-x-auto">
          {loading && !appendLoading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 border-b border-[#F0F1F5] animate-pulse bg-gray-50/50"
                />
              ))}
            </div>
          ) : error ? (
            <PlatformEmptyState icon={ShieldAlert} className="m-5 min-h-[260px]">
              <p className="font-bold text-slate-700">
                {error.status === 403
                  ? t("common.accessDenied", { defaultValue: "Access denied" })
                  : t("common.loadError", { defaultValue: "Unable to load candidates" })}
              </p>

              <button
                onClick={() => loadCandidates()}
                className="mt-3 text-sm font-bold text-violet-600 hover:underline"
              >
                {t("crm.refresh")}
              </button>
            </PlatformEmptyState>
          ) : filtered.length === 0 ? (
            <PlatformEmptyState icon={User} className="m-5 min-h-[260px]">
              <p className="font-bold">{t("crm.noCandidates")}</p>
            </PlatformEmptyState>
          ) : (
            <div>
              {/* Header Row */}
              <div className="grid min-w-[900px] grid-cols-12 gap-4 border-b border-[#EAF0F8] bg-[#F7FAFF] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#94A3B8]">
                <div className="col-span-4">{t("crm.columnCandidate")}</div>

                <div className="col-span-2">{t("crm.columnRole")}</div>

                <div className="col-span-2">{t("crm.columnDomain")}</div>

                <div className="col-span-1 text-center">{t("crm.columnExperience")}</div>

                <div className="col-span-1 text-center">{t("crm.columnScore")}</div>

                <div className="col-span-2 text-center">{t("crm.columnStatus")}</div>
              </div>

              {filtered.map((candidate) => (
                <CandidateRowMemo
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => navigate(`${resolvedCandidateRoute}?id=${candidate.id}`)}
                  t={t}
                  isRTL={isRTL}
                />
              ))}

              {/* Infinite Scroll Loading */}
              {hasMore && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {appendLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />

                      {t("crm.loadingMore")}
                    </div>
                  ) : (
                    <button
                      onClick={() => loadCandidates(true)}
                      className="text-purple-600 font-bold hover:underline"
                    >
                      {t("crm.loadMore")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}

const CandidateRowMemo = React.memo(function CandidateRow({ candidate, onClick, t, isRTL }) {
  const initials =
    candidate.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"

  const score = candidate.data_quality_score || candidate.parsing_confidence || 0

  return (
    <div
      onClick={onClick}
      className="group grid min-w-[900px] cursor-pointer grid-cols-12 items-center gap-4 border-b border-slate-100 px-5 py-4 transition-colors last:border-0 hover:bg-[#F8FAFF]"
    >
      {/* Name */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="gradient-brand flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] text-xs font-black text-white shadow-[0_5px_14px_rgba(99,72,210,0.18)]">
          {initials}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-[#0F172A] truncate">{candidate.full_name}</div>

          <div className="text-xs text-[#94A3B8] truncate">{candidate.email}</div>
        </div>
      </div>

      {/* Role */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">{candidate.role_name || "—"}</div>

      {/* Domain */}
      <div className="col-span-2 text-sm text-[#64748B] truncate">
        {candidate.domain_name || "—"}
      </div>

      {/* Experience */}
      <div className="col-span-1 text-center">
        <span className="text-sm font-bold text-[#0F172A]">
          {candidate.experience_years ?? "—"}
        </span>

        {candidate.experience_years && (
          <span className="text-xs text-[#94A3B8]">{t("crm.experienceYears")}</span>
        )}
      </div>

      {/* Score */}
      <div className="col-span-1 text-center">
        <span
          className={`text-sm font-black ${score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-[#CBD5E1]"}`}
        >
          {score ? `${score}%` : "—"}
        </span>
      </div>

      {/* Status */}
      <div className="col-span-2 flex items-center justify-center gap-2">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[candidate.status] || "bg-gray-100 text-gray-600"}`}
        >
          {t(
            `crm.status${candidate.status?.charAt(0).toUpperCase() + candidate.status?.slice(1)}`,
          ) || candidate.status}
        </span>

        {isRTL ? (
          <ChevronLeft className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors" />
        ) : (
          <svg
            className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  )
})
