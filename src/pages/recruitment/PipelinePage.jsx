import { useState, useCallback, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"
import { usePipelineData } from "@/hooks/usePipelineData"
import { Kanban, Sparkles, Users, ShieldAlert } from "lucide-react"

import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"

// Minimum px per stage column to render Kanban without forced horizontal scroll
const MIN_PX_PER_STAGE = 160

export default function PipelinePage() {
  const { t, i18n } = useTranslation()

  const { user } = useAuth()

  const { can } = usePermissionMatrix()

  const canUpdate = can("update")

  const boardContainerRef = useRef(null)

  const [containerWidth, setContainerWidth] = useState(null)

  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const [drawerOpen, setDrawerOpen] = useState(false)

  const [filters, setFilters] = useState({
    role: "",
    recruiter: "",
    aiMin: 0,
    source: "",
    dateFrom: "",
    dateTo: "",
    expMin: "",
    expMax: "",
  })

  const [showFilters, setShowFilters] = useState(false)

  const [notifKey, setNotifKey] = useState(0)

  const handleNotificationCreated = useCallback(() => setNotifKey((k) => k + 1), [])

  const { stages, applications, loading, error, moveApplication, refresh, isMockData } =
    usePipelineData(user, filters, handleNotificationCreated)

  // Get current language direction
  const currentLang = i18n.language?.startsWith("en") ? "en" : "he"

  const isRTL = currentLang === "he"

  // Observe the actual container width — this is the real available space after sidebars
  useEffect(() => {
    if (!boardContainerRef.current) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(boardContainerRef.current)
    // Set initial width immediately
    setContainerWidth(boardContainerRef.current.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [])

  // Use Mobile view if container is too narrow to fit all stage columns without horizontal drag
  const stageCount = stages.length || 7

  const useMobileView = containerWidth !== null && containerWidth < stageCount * MIN_PX_PER_STAGE

  const handleCandidateClick = (application) => {
    setSelectedCandidate(application.id)
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setSelectedCandidate(null)
  }

  const liveSelectedApp = selectedCandidate
    ? applications.find((a) => a.id === selectedCandidate) || null
    : null

  const activeStages = stages.filter((stage) =>
    applications.some((application) => application.status === stage.id),
  ).length

  const scoredCandidates = applications.filter(
    (application) => application.match_score != null,
  ).length

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"} className="min-w-0">
      <div className="flex w-full min-w-0 flex-col gap-6">
        {/* Header — fixed to viewport width, never grows with Kanban */}
        <PlatformCard className="flex-shrink-0 p-5 md:p-6">
          <PlatformPageHeader
            title={t("pipeline.page.title")}
            subtitle={`${t("pipeline.page.candidatesCount", { count: applications.length })} • ${t("pipeline.page.stagesCount", { count: stages.length })}`}
            icon={Kanban}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <NotificationCenter key={notifKey} />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-10 px-4 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all ${
                    showFilters
                      ? "gradient-brand border-transparent text-white shadow-[0_6px_18px_rgba(99,72,210,0.22)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#C4B5FD] hover:text-[#6C4DFF]"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t("pipeline.page.filter")}
                </button>
                <button
                  onClick={refresh}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all hover:border-[#C4B5FD] hover:text-[#6C4DFF]"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("pipeline.page.refresh")}
                </button>
              </div>
            }
          />

          {showFilters && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <PipelineFilters filters={filters} onChange={setFilters} />
            </div>
          )}
        </PlatformCard>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlatformStatCard
            icon={Users}
            label={t("pipeline.page.candidatesCount", { count: applications.length })}
            value={applications.length}
            tone="violet"
            loading={loading}
            meta="In the recruitment board"
          />
          <PlatformStatCard
            icon={Kanban}
            label={t("pipeline.page.stagesCount", { count: stages.length })}
            value={activeStages}
            tone="blue"
            loading={loading}
            meta="Stages with candidates"
          />
          <PlatformStatCard
            icon={Sparkles}
            label="AI scored"
            value={scoredCandidates}
            tone="fuchsia"
            loading={loading}
            meta="Candidates with match score"
          />
        </div>

        {/* Demo Data Banner */}
        {isMockData && !loading && (
          <div className="mx-4 md:mx-6 mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-bold text-amber-700">
              {t("pipeline.page.demoDataBanner")}
            </span>
          </div>
        )}

        {/* Kanban viewport — only this area scrolls horizontally */}
        <PlatformCard className="w-full min-w-0 overflow-hidden p-4 md:p-5">
          <div ref={boardContainerRef} className="w-full min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#64748B] font-bold">{t("pipeline.page.loading")}</p>
                </div>
              </div>
            ) : error ? (
              <PlatformEmptyState icon={ShieldAlert} className="min-h-96">
                <p className="font-bold text-slate-700">
                  {error.status === 403
                    ? t("common.accessDenied", { defaultValue: "Access denied" })
                    : t("common.loadError", { defaultValue: "Unable to load the pipeline" })}
                </p>
                <button
                  onClick={refresh}
                  className="mt-3 text-sm font-bold text-violet-600 hover:underline"
                >
                  {t("pipeline.page.refresh")}
                </button>
              </PlatformEmptyState>
            ) : useMobileView ? (
              <MobilePipelineView
                stages={stages}
                applications={applications}
                onCandidateClick={handleCandidateClick}
                onMove={moveApplication}
                canMove={canUpdate}
                isRTL={isRTL}
              />
            ) : (
              <PipelineBoard
                stages={stages}
                applications={applications}
                onCandidateClick={handleCandidateClick}
                onMove={moveApplication}
                userRole={user?.role}
                isRTL={isRTL}
                canMove={canUpdate}
              />
            )}
          </div>
        </PlatformCard>

        {/* Candidate Drawer */}
        <CandidateDrawer
          application={liveSelectedApp}
          open={drawerOpen}
          onClose={handleClose}
          onStageChange={(appId, newStage) => {
            if (canUpdate) {
              moveApplication(appId, newStage)
            }
          }}
          onApplicationUpdated={refresh}
          canChangeStage={canUpdate}
        />
      </div>
    </PlatformPageShell>
  )
}
