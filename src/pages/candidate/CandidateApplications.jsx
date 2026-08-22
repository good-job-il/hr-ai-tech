import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { applicationService } from "@/api/services/applicationService"
import { interviewService } from "@/api/services/interviewService"
import { useAuth } from "@/lib/AuthContext"
import { Send, Calendar, FileText } from "lucide-react"

// ─── Status color config (labels come from i18n) ──────────────────────────────

const STATUS_STYLE = {
  new: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  reviewed: { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC" },
  phone_interview: { color: "#7C3AED", bg: "#F3EFFF", border: "#C4B5FD" },
  recommended: { color: "#9333EA", bg: "#FAF5FF", border: "#E9D5FF" },
  employer_interview: { color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
  offer: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  hired: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  probation: { color: "#0D9488", bg: "#F0FDFA", border: "#99F6E4" },
  completed: { color: "#65A30D", bg: "#F7FEE7", border: "#D9F99D" },
  rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
}

const ACTIVE_STATUSES = new Set([
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "hired",
  "probation",
])

// ─── Small helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const { t } = useTranslation()

  const style = STATUS_STYLE[status] || { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" }

  const label = t(`candidate.applications.status.${status}`, { defaultValue: status })

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap"
      style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      {label}
    </span>
  )
}

function InterviewTypeIcon({ type }) {
  if (type === "video") {
    return <Video className="w-3.5 h-3.5" />
  }

  if (type === "phone") {
    return <Phone className="w-3.5 h-3.5" />
  }

  if (type === "in_person") {
    return <MapPin className="w-3.5 h-3.5" />
  }

  return <Calendar className="w-3.5 h-3.5" />
}

function StatCard({ icon: Icon, label, value, color = "#7C3AED", loading }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "18" }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div>
        <div className="text-2xl font-black text-[#0F172A]">
          {loading ? (
            <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>

        <div className="text-xs font-semibold text-[#64748B]">{label}</div>
      </div>
    </div>
  )
}

// ─── Application Card ──────────────────────────────────────────────────────────

function ApplicationCard({ app, interviews, isSelected, onSelect }) {
  const { t } = useTranslation()

  const relatedInterviews = interviews.filter((i) => i.application_id === app.id)

  const nextInterview = relatedInterviews.find((i) => i.status === "scheduled" || !i.status)

  return (
    <button
      type="button"
      onClick={() => onSelect(isSelected ? null : app)}
      className={`w-full text-right p-5 rounded-2xl border transition-all text-start ${
        isSelected
          ? "border-[#7C3AED] bg-[#F3EFFF] shadow-md shadow-[#7C3AED]/10"
          : "border-[#E4ECFF] bg-white hover:border-[#C4B5FD] hover:shadow-sm"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[#0F172A] text-sm leading-tight truncate">
            {app.job_title}
          </h3>

          <p className="text-xs font-semibold text-[#7C3AED] mt-0.5 truncate">{app.company}</p>
        </div>

        <StatusBadge status={app.status} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />

          {new Date(app.created_date).toLocaleDateString()}
        </span>

        {app.location && <span>• {app.location}</span>}
      </div>

      {/* Upcoming interview banner */}
      {nextInterview && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#7C3AED] bg-[#F3EFFF] border border-[#C4B5FD] rounded-lg px-3 py-1.5">
          <InterviewTypeIcon type={nextInterview.type} />

          {t("candidate.applications.interviewBanner", {
            date: new Date(nextInterview.date).toLocaleDateString(),
            time: nextInterview.time,
          })}
        </div>
      )}

      {/* Milestone banners */}
      {app.status === "offer" && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg px-3 py-1.5">
          <Award className="w-3.5 h-3.5" /> {t("candidate.applications.offerBanner")}
        </div>
      )}

      {app.status === "hired" && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t("candidate.applications.hiredBanner")}
        </div>
      )}
    </button>
  )
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ app, interviews, onClose }) {
  const { t } = useTranslation()

  const relatedInterviews = interviews.filter((i) => i.application_id === app.id)

  function interviewTypeLabel(type) {
    return t(`candidate.applications.interviewTypes.${type}`, {
      defaultValue: t("candidate.applications.interviewTypes.default"),
    })
  }

  function interviewStatusLabel(status) {
    if (!status) {
      return null
    }

    return t(`candidate.applications.interviewStatus.${status}`, { defaultValue: status })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-[#F0F1F5]">
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-[#0F172A] text-base leading-tight">{app.job_title}</h2>

          <p className="text-sm font-semibold text-[#7C3AED] mt-0.5">{app.company}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={app.status} />

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C4B5FD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
              {t("candidate.applications.detail.appliedDate")}
            </div>

            <div className="font-semibold text-[#0F172A]">
              {new Date(app.created_date).toLocaleDateString()}
            </div>
          </div>

          {app.location && (
            <div>
              <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
                {t("candidate.applications.detail.location")}
              </div>

              <div className="font-semibold text-[#0F172A]">{app.location}</div>
            </div>
          )}

          {app.salary_range && (
            <div>
              <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
                {t("candidate.applications.detail.salary")}
              </div>

              <div className="font-semibold text-[#0F172A]">{app.salary_range}</div>
            </div>
          )}

          {app.source && (
            <div>
              <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
                {t("candidate.applications.detail.source")}
              </div>

              <div className="font-semibold text-[#0F172A]">{app.source}</div>
            </div>
          )}
        </div>

        {/* Interviews */}
        {relatedInterviews.length > 0 && (
          <div>
            <h3 className="text-sm font-black text-[#0F172A] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />{" "}
              {t("candidate.applications.detail.interviews")}
            </h3>

            <div className="space-y-2">
              {relatedInterviews.map((iv) => (
                <div key={iv.id} className="border border-[#E4ECFF] rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                      <InterviewTypeIcon type={iv.type} />

                      {interviewTypeLabel(iv.type)}
                    </div>

                    {iv.status && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          iv.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : iv.status === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-[#F3EFFF] text-[#7C3AED]"
                        }`}
                      >
                        {interviewStatusLabel(iv.status)}
                      </span>
                    )}
                  </div>

                  <div className="text-[#64748B]">
                    {new Date(iv.date).toLocaleDateString()} — {iv.time}
                  </div>

                  {iv.location_or_link && (
                    <div className="mt-1">
                      {iv.type === "in_person" ? (
                        <span className="text-[#64748B]">{iv.location_or_link}</span>
                      ) : (
                        <a
                          href={iv.location_or_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7C3AED] hover:underline break-all"
                        >
                          {iv.location_or_link}
                        </a>
                      )}
                    </div>
                  )}

                  {iv.notes && (
                    <div className="mt-2 text-xs text-[#64748B] bg-[#F8FAFC] rounded-lg p-2">
                      {iv.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-black text-[#0F172A] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C3AED]" />{" "}
            {t("candidate.applications.detail.history")}
          </h3>

          <ApplicationTimeline applicationId={app.id} />
        </div>
      </div>

      {/* Footer */}
      {app.job_id && (
        <div className="p-4 border-t border-[#F0F1F5]">
          <Link
            to={`/jobs/${app.job_id}`}
            className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-[#E4ECFF] text-sm font-bold text-[#374151] hover:border-[#C4B5FD] hover:text-[#7C3AED] transition-colors"
          >
            <Briefcase className="w-4 h-4" /> {t("candidate.applications.viewJob")}
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateApplications() {
  const { t } = useTranslation()

  const { user } = useAuth()

  const [search, setSearch] = useState("")

  const [filterTab, setFilterTab] = useState("all")

  const [selected, setSelected] = useState(null)

  const {
    data: applications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["candidate-applications", user?.email],
    queryFn: () => applicationService.list({ sort: "created_date", order: "DESC", limit: 100 }),
    enabled: !!user?.email,
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ["candidate-interviews", user?.email],
    queryFn: () => interviewService.list({ sort: "date", order: "DESC", limit: 200 }),
    enabled: !!user?.email,
  })

  const activeCount = applications.filter((a) => ACTIVE_STATUSES.has(a.status)).length

  const upcomingInterviews = interviews.filter((i) => i.status === "scheduled" || !i.status).length

  const FILTER_TABS = [
    { key: "all", label: t("candidate.applications.filters.all") },
    { key: "active", label: t("candidate.applications.filters.active") },
    { key: "offer", label: t("candidate.applications.filters.offers") },
    { key: "rejected", label: t("candidate.applications.filters.rejected") },
  ]

  const filtered = applications.filter((app) => {
    const matchSearch =
      !search ||
      app.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      app.company?.toLowerCase().includes(search.toLowerCase())

    const matchTab =
      filterTab === "all" ||
      (filterTab === "active" && ACTIVE_STATUSES.has(app.status)) ||
      (filterTab === "offer" && (app.status === "offer" || app.status === "hired")) ||
      (filterTab === "rejected" && app.status === "rejected")

    return matchSearch && matchTab
  })

  return (
    <div dir="rtl" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">
            {t("candidate.applications.title")}
          </h1>

          <p className="text-[#64748B] font-semibold mt-1">
            {t("candidate.applications.subtitle")}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-9 w-9 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Send}
          label={t("candidate.applications.stats.total")}
          value={applications.length}
          color="#2563EB"
          loading={isLoading}
        />

        <StatCard
          icon={FileText}
          label={t("candidate.applications.stats.active")}
          value={activeCount}
          color="#7C3AED"
          loading={isLoading}
        />

        <StatCard
          icon={Calendar}
          label={t("candidate.applications.stats.upcomingInterviews")}
          value={upcomingInterviews}
          color="#059669"
          loading={isLoading}
        />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />

          <input
            type="text"
            placeholder={t("candidate.applications.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pr-9 pl-3 rounded-xl border border-[#E4ECFF] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-colors"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#374151]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-[#F8FAFC] border border-[#E4ECFF] rounded-xl p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                filterTab === tab.key
                  ? "bg-white text-[#7C3AED] shadow-sm border border-[#E4ECFF]"
                  : "text-[#64748B] hover:text-[#374151]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: list + detail */}
      <div
        className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}
      >
        {/* Applications list */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-[#7C3AED]" />
              </div>

              {applications.length === 0 ? (
                <>
                  <p className="text-[#0F172A] font-black text-lg">
                    {t("candidate.applications.noApplications")}
                  </p>

                  <p className="text-[#64748B] font-semibold text-sm mt-1">
                    {t("candidate.applications.noApplicationsHint")}
                  </p>

                  <Link
                    to="/candidate/jobs/all"
                    className="mt-4 px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold hover:bg-[#6D28D9] transition-colors"
                  >
                    {t("candidate.applications.browseJobs")}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[#0F172A] font-black text-lg">
                    {t("candidate.applications.noResults")}
                  </p>

                  <p className="text-[#64748B] font-semibold text-sm mt-1">
                    {t("candidate.applications.noResultsHint")}
                  </p>

                  <button
                    onClick={() => {
                      setSearch("")
                      setFilterTab("all")
                    }}
                    className="mt-4 text-sm font-bold text-[#7C3AED] hover:underline"
                  >
                    {t("candidate.applications.clearFilter")}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${selected ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
            >
              {filtered.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  interviews={interviews}
                  isSelected={selected?.id === app.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)]">
            <DetailPanel app={selected} interviews={interviews} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
import { Link } from "react-router-dom"
import {
  Search,
  X,
  Briefcase,
  ChevronLeft,
  RefreshCw,
  Clock,
  Video,
  Phone,
  MapPin,
  CheckCircle2,
  Award,
} from "lucide-react"
import ApplicationTimeline from "@/components/applications/ApplicationTimeline"
