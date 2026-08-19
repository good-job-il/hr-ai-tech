import { useState } from "react"
import {
  FileText,
  Calendar,
  MessageSquare,
  Tag,
  User,
  Star,
  CheckCircle,
  XCircle,
  Send,
  Upload,
} from "lucide-react"
import { useTranslation } from "react-i18next"

export default function CandidateTimeline({ timeline, loading }) {
  const { t } = useTranslation()

  const [filter, setFilter] = useState("all")

  const EVENT_CONFIG = {
    registered: {
      icon: User,
      color: "#7C3AED",
      label: t("candidateCRM.timeline.events.registered"),
    },
    resume_uploaded: {
      icon: Upload,
      color: "#2563EB",
      label: t("candidateCRM.timeline.events.resume_uploaded"),
    },
    application_submitted: {
      icon: Send,
      color: "#0EA5E9",
      label: t("candidateCRM.timeline.events.application_submitted"),
    },
    interview_scheduled: {
      icon: Calendar,
      color: "#8B5CF6",
      label: t("candidateCRM.timeline.events.interview_scheduled"),
    },
    interview_completed: {
      icon: CheckCircle,
      color: "#10B981",
      label: t("candidateCRM.timeline.events.interview_completed"),
    },
    interview_cancelled: {
      icon: XCircle,
      color: "#EF4444",
      label: t("candidateCRM.timeline.events.interview_cancelled"),
    },
    status_changed: {
      icon: Star,
      color: "#F59E0B",
      label: t("candidateCRM.timeline.events.status_changed"),
    },
    note_added: {
      icon: MessageSquare,
      color: "#64748B",
      label: t("candidateCRM.timeline.events.note_added"),
    },
    tag_added: { icon: Tag, color: "#7C3AED", label: t("candidateCRM.timeline.events.tag_added") },
    tag_removed: {
      icon: Tag,
      color: "#94A3B8",
      label: t("candidateCRM.timeline.events.tag_removed"),
    },
    recruiter_assigned: {
      icon: User,
      color: "#4F46E5",
      label: t("candidateCRM.timeline.events.recruiter_assigned"),
    },
    document_uploaded: {
      icon: FileText,
      color: "#0EA5E9",
      label: t("candidateCRM.timeline.events.document_uploaded"),
    },
    sent_to_employer: {
      icon: Send,
      color: "#10B981",
      label: t("candidateCRM.timeline.events.sent_to_employer"),
    },
    hired: { icon: CheckCircle, color: "#10B981", label: t("candidateCRM.timeline.events.hired") },
    rejected: {
      icon: XCircle,
      color: "#EF4444",
      label: t("candidateCRM.timeline.events.rejected"),
    },
    imported: { icon: Upload, color: "#94A3B8", label: t("candidateCRM.timeline.events.imported") },
  }

  const filtered = filter === "all" ? timeline : timeline.filter((e) => e.event_type === filter)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filter === "all" ? "bg-[#7C3AED] text-white" : "bg-[#F0F1F5] text-[#64748B] hover:bg-[#E4ECFF]"}`}
        >
          {t("candidateCRM.timeline.all")} ({timeline.length})
        </button>
        {[
          "interview_scheduled",
          "status_changed",
          "note_added",
          "document_uploaded",
          "sent_to_employer",
        ].map((type) => {
          const count = timeline.filter((e) => e.event_type === type).length

          if (!count) {
            return null
          }

          const cfg = EVENT_CONFIG[type]

          return (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${filter === type ? "text-white" : "bg-[#F0F1F5] text-[#64748B] hover:bg-[#E4ECFF]"}`}
              style={filter === type ? { backgroundColor: cfg.color } : {}}
            >
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Events */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-[#94A3B8]">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">{t("candidateCRM.timeline.noEvents")}</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-[#E4ECFF]" />
          <div className="space-y-1">
            {filtered.map((event, idx) => {
              const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.note_added

              const Icon = cfg.icon

              return (
                <div
                  key={event.id || idx}
                  className="flex items-start gap-4 pr-4 py-3 relative group hover:bg-[#F7F8FC] rounded-xl transition-colors"
                >
                  <div
                    className="relative z-10 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${cfg.color}20`, border: `2px solid ${cfg.color}` }}
                  >
                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#0F172A]">{event.description}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {event.performed_by_name && (
                        <span className="text-xs text-[#94A3B8]">{event.performed_by_name}</span>
                      )}
                      {event.created_date && (
                        <span className="text-xs text-[#CBD5E1]">
                          {new Date(event.created_date).toLocaleString("he-IL", {
                            timeZone: "Asia/Jerusalem",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                      )}
                      {event.is_visible_to_employer && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                          {t("candidateCRM.timeline.visibleToEmployer")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
