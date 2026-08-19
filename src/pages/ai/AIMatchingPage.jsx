/**
 * AIMatchingPage
 * Central hub: search candidates or jobs and see AI match results.
 * Role-filtered: recruiter sees own candidates, manager sees all team, etc.
 */
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { candidateService } from "@/api/services/candidateService"
import { jobService } from "@/api/services/jobService"
import { applicationService } from "@/api/services/applicationService"
import { useAuth } from "@/lib/AuthContext"
import { Users, Briefcase } from "lucide-react"
import { getAgencyScopeFilter, isAgencyUser } from "@/domain/agency/access"

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)

    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${type === "success" ? "bg-green-600 text-white" : type === "error" ? "bg-red-600 text-white" : "bg-[#1E293B] text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      )}

      {message}

      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function AIMatchingPage() {
  const { user } = useAuth()

  const { t, i18n } = useTranslation()

  const isRTL = i18n.language === "he"

  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => setToast({ message, type })

  const [mode, setMode] = useState("candidate")

  const [candidates, setCandidates] = useState([])

  const [jobs, setJobs] = useState([])

  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const [selectedJob, setSelectedJob] = useState(null)

  const [searchQ, setSearchQ] = useState("")

  const [minScore, setMinScore] = useState(0)

  const [loading, setLoading] = useState(false)

  const MODES = [
    { id: "candidate", label: t("aiMatching.page.modeCandidateToJobs"), icon: Users },
    { id: "job", label: t("aiMatching.page.modeJobToCandidates"), icon: Briefcase },
  ]

  useEffect(() => {
    if (!user) {
      return
    }

    setLoading(true)

    // ─────────────────────────────────────────────────────────────────────
    // VISIBILITY POLICY — AIMatchingPage (candidate list)
    //
    //  recruiter → only candidates assigned by recruiter_id === user.id
    //  team_manager → only records with team_manager_id === user.id
    //  org_admin / recruitment_manager → current organization
    //  employer  → only candidates where employer_id === user.email
    //  admin / recruitment_manager / team_manager → all candidates
    //
    // This is an intentional design decision: AI Matching is a recruiter tool
    // scoped to their own pool. It is NOT a global search.
    // ─────────────────────────────────────────────────────────────────────
    const fetchCandidates = () =>
      candidateService.list({
        ...(isAgencyUser(user) ? getAgencyScopeFilter(user) : {}),
        sort: "created_date",
        order: "DESC",
        limit: isAgencyUser(user) ? 200 : 100,
      })

    const jobFilter = isAgencyUser(user)
      ? { organization_id: user.organization_id, is_closed: false }
      : { is_closed: false }

    Promise.all([
      fetchCandidates(),
      jobService.list({ ...jobFilter, sort: "created_date", order: "DESC", limit: 100 }),
    ])
      .then(([c, j]) => {
        setCandidates(c || [])
        setJobs(j || [])
      })
      .catch((error) => {
        setCandidates([])
        setJobs([])
        setToast({ message: error?.message || "Unable to load matching data", type: "error" })
      })
      .finally(() => setLoading(false))
  }, [user?.id, user?.role, user?.organization_id])

  const filteredCandidates = candidates.filter(
    (c) =>
      !searchQ ||
      (c.full_name || "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (c.role_name || "").toLowerCase().includes(searchQ.toLowerCase()),
  )

  const filteredJobs = jobs.filter(
    (j) =>
      !searchQ ||
      (j.title || "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (j.company || "").toLowerCase().includes(searchQ.toLowerCase()),
  )

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="bg-[#F7FBFF] -m-6 p-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white border-b border-[#E4ECFF] px-8 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#0F172A]">{t("aiMatching.page.title")}</h1>

            <p className="text-sm text-[#64748B] font-semibold">{t("aiMatching.page.subtitle")}</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {MODES.map((m) => {
            const Icon = m.icon

            return (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id)
                  setSelectedCandidate(null)
                  setSelectedJob(null)
                  setSearchQ("")
                }}
                className={`flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm transition-all border ${
                  mode === m.id
                    ? "bg-[#F3EFFF] border-[#C4B5FD] text-[#7C3AED]"
                    : "bg-white border-[#E4ECFF] text-[#64748B] hover:border-[#C4B5FD]"
                }`}
              >
                <Icon className="w-4 h-4" />

                {m.label}
              </button>
            )
          })}

          <div className={`flex items-center gap-2 ${isRTL ? "mr-auto" : "ml-auto"}`}>
            <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />

            <span className="text-xs text-[#64748B] font-semibold">
              {t("aiMatching.page.minScore")}
            </span>

            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="h-9 px-3 rounded-xl border border-[#E4ECFF] text-sm font-bold text-[#0F172A] outline-none bg-white"
            >
              <option value={0}>{t("aiMatching.page.all")}</option>

              <option value={50}>50%+</option>

              <option value={70}>70%+</option>

              <option value={85}>85%+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: selector list */}
        <div className="space-y-3">
          <div className="relative">
            <Search
              className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]`}
            />

            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={
                mode === "candidate"
                  ? t("aiMatching.page.searchCandidate")
                  : t("aiMatching.page.searchJob")
              }
              className={`w-full h-10 ${isRTL ? "pr-9 pl-4" : "pl-9 pr-4"} rounded-xl border border-[#E4ECFF] bg-white text-sm font-semibold text-[#0F172A] outline-none focus:border-[#C4B5FD]`}
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading && (
              <div className="text-center py-8 text-[#94A3B8] text-sm">
                {t("aiMatching.page.loading")}
              </div>
            )}

            {mode === "candidate" &&
              filteredCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className={`w-full ${isRTL ? "text-right" : "text-left"} p-3 rounded-xl border transition-all ${
                    selectedCandidate?.id === c.id
                      ? "border-[#C4B5FD] bg-[#F3EFFF]"
                      : "border-[#E4ECFF] bg-white hover:border-[#C4B5FD]"
                  }`}
                >
                  <div className="font-black text-[#0F172A] text-sm">{c.full_name}</div>

                  <div className="text-xs text-[#7C3AED] font-semibold">
                    {c.role_name || c.domain_name}
                  </div>

                  {c.location && <div className="text-xs text-[#94A3B8]">{c.location}</div>}
                </button>
              ))}

            {mode === "job" &&
              filteredJobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`w-full ${isRTL ? "text-right" : "text-left"} p-3 rounded-xl border transition-all ${
                    selectedJob?.id === j.id
                      ? "border-[#C4B5FD] bg-[#F3EFFF]"
                      : "border-[#E4ECFF] bg-white hover:border-[#C4B5FD]"
                  }`}
                >
                  <div className="font-black text-[#0F172A] text-sm">{j.title}</div>

                  <div className="text-xs text-[#64748B] font-semibold">{j.company}</div>

                  {j.location && <div className="text-xs text-[#94A3B8]">{j.location}</div>}
                </button>
              ))}
          </div>
        </div>

        {/* Right: results panel */}
        <div>
          {mode === "candidate" && !selectedCandidate && (
            <EmptyState text={t("aiMatching.page.selectCandidatePrompt")} icon={Users} />
          )}

          {mode === "job" && !selectedJob && (
            <EmptyState text={t("aiMatching.page.selectJobPrompt")} icon={Briefcase} />
          )}

          {mode === "candidate" && selectedCandidate && (
            <div>
              <div className="mb-4 p-4 rounded-2xl bg-white border border-[#E4ECFF]">
                <div className="font-black text-[#0F172A]">{selectedCandidate.full_name}</div>

                <div className="text-sm text-[#7C3AED] font-semibold">
                  {selectedCandidate.role_name}
                </div>

                <div className="text-xs text-[#94A3B8]">
                  {selectedCandidate.location} • {selectedCandidate.experience_years}{" "}
                  {t("aiMatching.page.yearsExperience")}
                </div>
              </div>

              <CandidateRecommendationsPanel
                candidate={selectedCandidate}
                onAssignToJob={async (job) => {
                  try {
                    await applicationService.assignCandidate(job.id, selectedCandidate.id)
                    showToast(
                      t("aiMatching.page.assignedSuccess", {
                        candidateName: selectedCandidate.full_name,
                        jobTitle: job.title,
                      }),
                    )
                  } catch (e) {
                    showToast(t("aiMatching.page.error", { message: e.message }), "error")
                  }
                }}
              />
            </div>
          )}

          {mode === "job" && selectedJob && (
            <div>
              <div className="mb-4 p-4 rounded-2xl bg-white border border-[#E4ECFF]">
                <div className="font-black text-[#0F172A]">{selectedJob.title}</div>

                <div className="text-sm text-[#64748B] font-semibold">{selectedJob.company}</div>

                <div className="text-xs text-[#94A3B8]">{selectedJob.location}</div>
              </div>

              <JobRecommendationsPanel
                job={selectedJob}
                onAddToPipeline={async (candidate) => {
                  try {
                    await applicationService.assignCandidate(selectedJob.id, candidate.id)
                    showToast(
                      t("aiMatching.page.addedToPipeline", {
                        candidateName: candidate.full_name,
                        jobTitle: selectedJob.title,
                      }),
                    )
                  } catch (e) {
                    showToast(t("aiMatching.page.error", { message: e.message }), "error")
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#C4B5FD]" />
      </div>

      <p className="text-[#94A3B8] font-semibold">{text}</p>
    </div>
  )
}
