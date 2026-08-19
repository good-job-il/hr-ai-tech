import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { interviewService } from "@/api/services/interviewService"
import { useAuth } from "@/lib/AuthContext"
import { Calendar, CheckCircle2, XCircle, AlertCircle, RotateCcw, UserX } from "lucide-react"

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  scheduled: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  confirmed: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  completed: { color: "#65A30D", bg: "#F7FEE7", border: "#D9F99D" },
  cancelled: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  no_show: { color: "#EA580C", bg: "#FFF7ED", border: "#FDBA74" },
  rescheduled: { color: "#CA8A04", bg: "#FEFCE8", border: "#FDE047" },
}

const STATUS_ICON = {
  scheduled: Calendar,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: UserX,
  rescheduled: RotateCcw,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function TypeIcon({ type, className = "w-5 h-5" }) {
  if (type === "video") {
    return <Video className={className} />
  }

  if (type === "phone") {
    return <Phone className={className} />
  }

  if (type === "in_person") {
    return <MapPin className={className} />
  }

  return <Calendar className={className} />
}

function StatusBadge({ status }) {
  const { t } = useTranslation()

  const style = STATUS_STYLE[status] || { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" }

  const label = t(`candidate.interviews.status.${status}`, { defaultValue: status })

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap"
      style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      {label}
    </span>
  )
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

// ─── Interview Card ────────────────────────────────────────────────────────────

function InterviewCard({ interview, isSelected, onSelect }) {
  const { t } = useTranslation()

  const isUpcoming =
    interview.date >= new Date().toISOString().split("T")[0] &&
    interview.status !== "cancelled" &&
    interview.status !== "completed"

  return (
    <button
      type="button"
      onClick={() => onSelect(isSelected ? null : interview)}
      className={`w-full text-right p-5 rounded-2xl border transition-all text-start ${
        isSelected
          ? "border-[#7C3AED] bg-[#F3EFFF] shadow-md shadow-[#7C3AED]/10"
          : "border-[#E4ECFF] bg-white hover:border-[#C4B5FD] hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Type icon */}
        <div className="w-10 h-10 rounded-xl bg-[#F3EFFF] flex items-center justify-center flex-shrink-0 mt-0.5">
          <TypeIcon type={interview.type} className="w-5 h-5 text-[#7C3AED]" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[#0F172A] text-sm leading-tight truncate">
            {interview.job_title || t("candidate.interviews.noJobTitle")}
          </h3>
          <p className="text-xs font-semibold text-[#7C3AED] mt-0.5 truncate">
            {interview.company_name || interview.organization_name}
          </p>
        </div>

        <StatusBadge status={interview.status || "scheduled"} />
      </div>

      {/* Date / time row */}
      <div className="flex items-center gap-3 text-xs text-[#64748B] mt-2">
        <span className="flex items-center gap-1 font-semibold">
          <Calendar className="w-3 h-3" />
          {new Date(interview.date).toLocaleDateString()}
        </span>
        {interview.time && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {interview.time}
          </span>
        )}
        {interview.type && (
          <span className="flex items-center gap-1">
            <TypeIcon type={interview.type} className="w-3 h-3" />
            {t(`candidate.interviews.types.${interview.type}`, { defaultValue: interview.type })}
          </span>
        )}
      </div>

      {/* Upcoming highlight */}
      {isUpcoming && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#7C3AED] bg-[#F3EFFF] border border-[#C4B5FD] rounded-lg px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {t("candidate.interviews.upcomingBanner")}
        </div>
      )}
    </button>
  )
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ interview, onClose }) {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECFF] h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-[#F0F1F5]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#F3EFFF] flex items-center justify-center flex-shrink-0">
            <TypeIcon type={interview.type} className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-[#0F172A] text-base leading-tight truncate">
              {interview.job_title || t("candidate.interviews.noJobTitle")}
            </h2>
            <p className="text-sm font-semibold text-[#7C3AED] mt-0.5">
              {interview.company_name || interview.organization_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={interview.status || "scheduled"} />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C4B5FD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
              {t("candidate.interviews.detail.date")}
            </div>
            <div className="font-semibold text-[#0F172A]">
              {new Date(interview.date).toLocaleDateString()}
            </div>
          </div>
          {interview.time && (
            <div>
              <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
                {t("candidate.interviews.detail.time")}
              </div>
              <div className="font-semibold text-[#0F172A]">{interview.time}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
              {t("candidate.interviews.detail.type")}
            </div>
            <div className="font-semibold text-[#0F172A]">
              {t(`candidate.interviews.types.${interview.type}`, {
                defaultValue: interview.type || "—",
              })}
            </div>
          </div>
          {interview.interviewer_name && (
            <div>
              <div className="text-xs font-medium text-[#94A3B8] mb-0.5">
                {t("candidate.interviews.detail.interviewer")}
              </div>
              <div className="font-semibold text-[#0F172A]">{interview.interviewer_name}</div>
            </div>
          )}
        </div>

        {/* Location / link */}
        {interview.location_or_link && (
          <div>
            <div className="text-xs font-medium text-[#94A3B8] mb-1.5">
              {interview.type === "in_person"
                ? t("candidate.interviews.detail.location")
                : t("candidate.interviews.detail.joinLink")}
            </div>
            {interview.type === "in_person" ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                <MapPin className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                {interview.location_or_link}
              </div>
            ) : (
              <a
                href={interview.location_or_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-[#7C3AED] hover:underline break-all"
              >
                <Video className="w-4 h-4 flex-shrink-0" />
                {interview.location_or_link}
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <div>
            <div className="text-xs font-medium text-[#94A3B8] mb-1.5">
              {t("candidate.interviews.detail.notes")}
            </div>
            <div className="text-sm text-[#374151] bg-[#F8FAFC] rounded-xl p-3 leading-relaxed">
              {interview.notes}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {interview.job_id && (
        <div className="p-4 border-t border-[#F0F1F5]">
          <Link
            to={`/jobs/${interview.job_id}`}
            className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-[#E4ECFF] text-sm font-bold text-[#374151] hover:border-[#C4B5FD] hover:text-[#7C3AED] transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            {t("candidate.interviews.viewJob")}
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CandidateInterviews() {
  const { t } = useTranslation()

  const { user } = useAuth()

  const [filterTab, setFilterTab] = useState("upcoming")

  const [selected, setSelected] = useState(null)

  const {
    data: interviews = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["candidate-interviews-page", user?.email],
    queryFn: () => interviewService.list({ sort: "date", order: "DESC", limit: 200 }),
    enabled: !!user?.email,
  })

  const today = new Date().toISOString().split("T")[0]

  const upcomingCount = interviews.filter(
    (i) => i.date >= today && i.status !== "cancelled" && i.status !== "completed",
  ).length

  const completedCount = interviews.filter((i) => i.status === "completed").length

  const FILTER_TABS = [
    { key: "upcoming", label: t("candidate.interviews.filters.upcoming") },
    { key: "past", label: t("candidate.interviews.filters.past") },
    { key: "all", label: t("candidate.interviews.filters.all") },
  ]

  const filtered = interviews.filter((i) => {
    if (filterTab === "upcoming") {
      return i.date >= today && i.status !== "cancelled" && i.status !== "completed"
    }

    if (filterTab === "past") {
      return i.date < today || i.status === "completed" || i.status === "cancelled"
    }

    return true
  })

  return (
    <div dir="rtl" className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">{t("candidate.interviews.title")}</h1>
          <p className="text-[#64748B] font-semibold mt-1">{t("candidate.interviews.subtitle")}</p>
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
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label={t("candidate.interviews.stats.total")}
          value={interviews.length}
          color="#2563EB"
          loading={isLoading}
        />
        <StatCard
          icon={AlertCircle}
          label={t("candidate.interviews.stats.upcoming")}
          value={upcomingCount}
          color="#7C3AED"
          loading={isLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label={t("candidate.interviews.stats.completed")}
          value={completedCount}
          color="#059669"
          loading={isLoading}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#F8FAFC] border border-[#E4ECFF] rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterTab(tab.key)
              setSelected(null)
            }}
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

      {/* Main layout: cards + detail */}
      <div
        className={`grid gap-6 ${selected ? "grid-cols-1 lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}
      >
        {/* Interview cards */}
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
                <Calendar className="w-8 h-8 text-[#7C3AED]" />
              </div>
              {interviews.length === 0 ? (
                <>
                  <p className="text-[#0F172A] font-black text-lg">
                    {t("candidate.interviews.noInterviews")}
                  </p>
                  <p className="text-[#64748B] font-semibold text-sm mt-1">
                    {t("candidate.interviews.noInterviewsHint")}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[#0F172A] font-black text-lg">
                    {t("candidate.interviews.noResults")}
                  </p>
                  <p className="text-[#64748B] font-semibold text-sm mt-1">
                    {t("candidate.interviews.noResultsHint")}
                  </p>
                  <button
                    onClick={() => setFilterTab("all")}
                    className="mt-4 text-sm font-bold text-[#7C3AED] hover:underline"
                  >
                    {t("candidate.interviews.clearFilter")}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-4 ${selected ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
            >
              {filtered.map((iv) => (
                <InterviewCard
                  key={iv.id}
                  interview={iv}
                  isSelected={selected?.id === iv.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-7rem)]">
            <DetailPanel interview={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
