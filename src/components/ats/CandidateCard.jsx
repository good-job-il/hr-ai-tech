import React, { useMemo } from "react"
import { Clock, MapPin, User, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import AIMatchBadge from "@/components/ai/AIMatchBadge"
import { scoreMatch } from "@/lib/aiMatching"

const SOURCE_KEYS = ["linkedin", "app", "jobsite", "import", "facebook", "other"]

function timeInStage(enteredAt, t) {
  if (!enteredAt) return null
  const hours = Math.floor((Date.now() - new Date(enteredAt)) / 3600000)
  if (hours < 1) return t("pipeline.time.lessThanHour")
  if (hours < 24) return t("pipeline.candidateCard.hoursInStage", { count: hours })
  return t("pipeline.candidateCard.daysInStage", { count: Math.floor(hours / 24) })
}

export default function CandidateCard({ application, stageColor, slaHours, onClick, isDragging }) {
  const { t } = useTranslation()
  const timeLabel = timeInStage(application.stage_entered_at, t)

  const sourceLabel = (source) => {
    if (!source) return source
    const key = `pipeline.sources.${source}`
    return SOURCE_KEYS.includes(source) ? t(key) : source
  }

  const aiData = useMemo(() => {
    const candidate = {
      role_name: application.job_title,
      domain_id: application.domain_id,
      experience_years: application.experience_years,
      skills: application.skills || application.tags || [],
      location: application.location,
      desired_salary_min: application.desired_salary_min,
      desired_salary_max: application.desired_salary_max,
    }
    const job = {
      title: application.job_title,
      domain_id: application.domain_id,
      location: application.location,
    }
    const { score, explanation } = scoreMatch(candidate, job)
    const finalScore = application.match_score != null ? application.match_score : score
    return {
      score: finalScore,
      missingRequired: !explanation.requiredMet,
      nextAction: explanation.nextAction,
    }
  }, [application.id])

  const slaBreached =
    slaHours &&
    application.stage_entered_at &&
    (Date.now() - new Date(application.stage_entered_at)) / 3600000 > slaHours

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 border border-[#E4ECFF]"
      style={{
        boxShadow: isDragging ? "0 20px 60px rgba(108,77,255,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
            style={{ background: `linear-gradient(135deg, ${stageColor}, #2F80FF)` }}
          >
            {(application.candidate_name || "?")[0]}
          </div>
          <div>
            <div className="font-black text-[#0F172A] text-sm leading-tight">
              {application.candidate_name}
            </div>
            <div className="text-xs text-[#7C3AED] font-semibold">{application.job_title}</div>
          </div>
        </div>

        <AIMatchBadge score={aiData.score} missingRequired={aiData.missingRequired} />
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {application.location && (
          <span className="flex items-center gap-1 text-xs text-[#94A3B8] font-semibold">
            <MapPin className="w-3 h-3" />
            {application.location}
          </span>
        )}
        {application.source && (
          <span className="text-xs bg-[#F3EFFF] text-[#7C3AED] px-2 py-0.5 rounded-full font-bold">
            {sourceLabel(application.source)}
          </span>
        )}
      </div>

      {application.tags && application.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {application.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[#F0F4FF] text-[#2F80FF] px-2 py-0.5 rounded-full font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {aiData.missingRequired && (
        <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mb-1">
          <AlertTriangle className="w-3 h-3" />
          {t("pipeline.candidateCard.missingRequired")}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-1 text-xs text-[#94A3B8] font-semibold">
          <User className="w-3 h-3" />
          {application.recruiter || t("pipeline.candidateCard.unassigned")}
        </div>
        {timeLabel && (
          <div
            className={`flex items-center gap-1 text-xs font-bold ${
              slaBreached ? "text-red-500" : "text-[#94A3B8]"
            }`}
          >
            <Clock className={`w-3 h-3 ${slaBreached ? "text-red-500" : ""}`} />
            {timeLabel}
            {slaBreached && <span className="text-red-500">⚠</span>}
          </div>
        )}
      </div>

      {aiData.nextAction && (
        <div className="mt-2 text-xs text-[#7C3AED] font-bold opacity-80 truncate">
          ← {aiData.nextAction}
        </div>
      )}
    </div>
  )
}
