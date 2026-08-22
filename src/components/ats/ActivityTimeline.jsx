import { useState, useEffect } from "react"
import { UserPlus, ArrowRight, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { applicationService } from "@/api/services/applicationService"

function timeAgo(dateStr, t, locale) {
  if (!dateStr) {
    return ""
  }

  const date = new Date(dateStr)

  if (isNaN(date.getTime())) {
    return ""
  }

  const diffMs = Date.now() - date.getTime()

  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) {
    return t("pipeline.time.now")
  }

  if (diffMin < 60) {
    return t("pipeline.time.minutesAgo", { count: diffMin })
  }

  const diffH = Math.floor(diffMin / 60)

  if (diffH < 24) {
    return t("pipeline.time.hoursAgo", { count: diffH })
  }

  const diffD = Math.floor(diffH / 24)

  if (diffD < 7) {
    return t("pipeline.time.daysAgo", { count: diffD })
  }

  return date.toLocaleDateString(locale, {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(dateStr, locale) {
  if (!dateStr) {
    return ""
  }

  const date = new Date(dateStr)

  if (isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleTimeString(locale, {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export default function ActivityTimeline({ application }) {
  const { t, i18n } = useTranslation()

  const [dbEvents, setDbEvents] = useState([])

  const [loading, setLoading] = useState(false)

  const [loadError, setLoadError] = useState(false)

  const locale = i18n.language?.startsWith("en") ? "en-US" : "he-IL"

  const stageLabel = (id) => t(`pipeline.stages.${id}`, { defaultValue: id || "?" })

  useEffect(() => {
    if (!application?.id) {
      return
    }

    let cancelled = false

    const fetchEvents = () => {
      applicationService
        .timeline(application.id)
        .then((rows) => {
          if (!cancelled) {
            setDbEvents(rows || [])
            setLoadError(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError(true)
          }
        })
    }

    setLoading(true)

    const initialTimer = setTimeout(() => {
      if (cancelled) {
        return
      }

      applicationService
        .timeline(application.id)
        .then((rows) => {
          if (!cancelled) {
            setDbEvents(rows || [])
            setLoadError(false)
            setLoading(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError(true)
            setLoading(false)
          }
        })
    }, 600)

    const pollInterval = setInterval(fetchEvents, 4000)

    return () => {
      cancelled = true
      clearTimeout(initialTimer)
      clearInterval(pollInterval)
    }
  }, [application?.id])

  const baseEvents = [
    {
      icon: UserPlus,
      color: "#8B5CF6",
      title: t("pipeline.activityTimeline.applicationCreated"),
      desc: t("pipeline.activityTimeline.applicationCreatedDesc", {
        jobTitle: application?.job_title || "",
      }),
      time: application?.created_date,
    },
  ]

  if (application?.match_score) {
    baseEvents.push({
      icon: Sparkles,
      color: "#10B981",
      title: t("pipeline.activityTimeline.aiAnalysisComplete"),
      desc: t("pipeline.activityTimeline.matchScore", { score: application.match_score }),
      time: application.created_date,
    })
  }

  const dbMapped = dbEvents.map((ev) => ({
    icon: ArrowRight,
    color: "#2F80FF",
    title:
      ev.event_type === "status_changed"
        ? t("pipeline.activityTimeline.stageChange", {
            from: stageLabel(ev.previous_value),
            to: stageLabel(ev.new_value),
          })
        : ev.title || ev.event_type,
    desc: ev.description || ev.performed_by || "",
    time: ev.created_date,
  }))

  const allEvents = [...dbMapped, ...baseEvents].sort(
    (a, b) => new Date(b.time || 0) - new Date(a.time || 0),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {loadError && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
        >
          {t("common.refreshFailed", { defaultValue: "Unable to refresh activity" })}
        </div>
      )}

      {allEvents.length === 0 && (
        <div className="text-center py-8 text-[#94A3B8]">
          <Clock className="w-8 h-8 mx-auto mb-2" />

          <p className="text-sm font-semibold">{t("pipeline.activityTimeline.noActivity")}</p>
        </div>
      )}

      {allEvents.map((ev, i) => {
        const Icon = ev.icon

        return (
          <div key={i} className="flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${ev.color}18`, border: `2px solid ${ev.color}` }}
              >
                <Icon className="w-4 h-4" style={{ color: ev.color }} />
              </div>

              {i < allEvents.length - 1 && <div className="w-0.5 flex-1 bg-[#E4ECFF] mt-1" />}
            </div>

            <div className="pb-2">
              <div className="font-bold text-sm text-[#0F172A]">{ev.title}</div>

              {ev.desc && <div className="text-xs text-[#64748B] mt-0.5">{ev.desc}</div>}

              <div className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1.5">
                <span>{timeAgo(ev.time, t, locale)}</span>

                {ev.time && <span className="opacity-60">• {formatTime(ev.time, locale)}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
import { Clock } from "lucide-react"
