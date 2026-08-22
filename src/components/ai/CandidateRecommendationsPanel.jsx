/**
 * CandidateRecommendationsPanel
 * Shows top matching Jobs for a given Candidate.
 */
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { jobService } from "@/api/services/jobService"
import { rankJobsForCandidate } from "@/lib/aiMatching"

export default function CandidateRecommendationsPanel({ candidate, onAssignToJob }) {
  const { t, i18n } = useTranslation()

  const isRTL = i18n.language === "he"

  const [results, setResults] = useState([])

  const [loading, setLoading] = useState(true)

  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    if (!candidate) {
      return
    }

    setLoading(true)
    jobService
      .list({ is_closed: false, sort: "created_date", order: "DESC", limit: 50 })
      .then((jobs) => {
        const ranked = rankJobsForCandidate(candidate, jobs || []).slice(0, 10)

        setResults(ranked)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [candidate?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="py-8 text-center text-[#94A3B8] text-sm font-semibold">
        {t("aiMatching.candidatePanel.noJobsFound")}
      </div>
    )
  }

  return (
    <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
      <p className="text-xs text-[#94A3B8] font-semibold">
        {t("aiMatching.candidatePanel.jobsRanked", { count: results.length })}
      </p>

      {results.map(({ job, score, explanation }) => (
        <div key={job.id} className="rounded-2xl border border-[#E4ECFF] bg-white overflow-hidden">
          <div
            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[#F7FBFF] transition-all"
            onClick={() => setExpanded(expanded === job.id ? null : job.id)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F3EFFF] to-[#EAF8FF] flex items-center justify-center text-sm font-black text-[#7C3AED] flex-shrink-0">
              {job.company_initials || job.company?.[0] || "C"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-black text-[#0F172A] text-sm">{job.title}</div>

              <div className="text-xs text-[#64748B] font-semibold">{job.company}</div>

              {job.location && (
                <div className="flex items-center gap-1 text-xs text-[#94A3B8] mt-0.5">
                  <MapPin className="w-3 h-3" />

                  {job.location}
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-1.5">
                {explanation.strengths.slice(0, 2).map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-[#F0F9FF] text-[#0284C7] px-2 py-0.5 rounded-full font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <AIMatchBadge score={score} missingRequired={!explanation.requiredMet} />

              <ChevronRight
                className={`w-4 h-4 text-[#94A3B8] transition-transform ${expanded === job.id ? "rotate-90" : ""}`}
              />
            </div>
          </div>

          {expanded === job.id && (
            <div className="border-t border-[#E4ECFF] px-4 pb-4 pt-3 space-y-3 bg-[#FAFBFF]">
              {explanation.gaps.length > 0 && (
                <div>
                  <div className="text-xs font-black text-red-500 mb-1">
                    {t("aiMatching.candidatePanel.gaps")}
                  </div>

                  {explanation.gaps.map((g, i) => (
                    <div key={i} className="text-xs text-[#374151]">
                      • {g}
                    </div>
                  ))}
                </div>
              )}

              {explanation.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-black text-[#7C3AED] mb-1">
                    {t("aiMatching.candidatePanel.recommendation")}
                  </div>

                  {explanation.recommendations.slice(0, 2).map((r, i) => (
                    <div key={i} className="text-xs text-[#374151]">
                      • {r}
                    </div>
                  ))}
                </div>
              )}

              {onAssignToJob && (
                <button
                  onClick={() => onAssignToJob(job)}
                  className="w-full h-9 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white text-xs font-black flex items-center justify-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" />

                  {t("aiMatching.candidatePanel.assignToJob")}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
import AIMatchBadge from "./AIMatchBadge"
import { Briefcase, MapPin, ChevronRight, Loader2 } from "lucide-react"
