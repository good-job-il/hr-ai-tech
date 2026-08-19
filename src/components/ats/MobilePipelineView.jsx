/**
 * MobilePipelineView — TRUE Kanban for mobile/tablet
 * Fixed width columns, horizontal scroll, no layout jumping
 */
import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"

export default function MobilePipelineView({
  stages,
  applications,
  onCandidateClick,
  onMove,
  isRTL = true,
  canMove = true,
}) {
  const { t } = useTranslation()

  const [movingApp, setMovingApp] = useState(null)

  const [movingFromStage, setMovingFromStage] = useState(null)

  const containerRef = useRef(null)

  const scrollInitialized = useRef(false)

  const handleMoveRequest = (app, stageId) => {
    setMovingApp(app)
    setMovingFromStage(stageId)
  }

  const handleMove = (app, newStageId) => {
    onMove(app.id, newStageId)
    setMovingApp(null)
    setMovingFromStage(null)
  }

  useEffect(() => {
    if (!containerRef.current || scrollInitialized.current || applications.length === 0) {
      return
    }

    const timer = setTimeout(() => {
      if (!containerRef.current) {
        return
      }

      containerRef.current.scrollLeft = isRTL ? 99999 : 0
      scrollInitialized.current = true
    }, 100)

    return () => clearTimeout(timer)
  }, [applications.length, isRTL])

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full min-w-0 overflow-hidden">
      <div
        ref={containerRef}
        className="mobile-pipeline-scroll w-full min-w-0 overflow-x-auto overflow-y-hidden pb-4"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        <style>{`
          .mobile-pipeline-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="flex flex-nowrap gap-3 items-start w-max min-w-full">
          {stages.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage.id)

            return (
              <CompactStageColumn
                key={stage.id}
                stage={stage}
                applications={stageApps}
                onCandidateClick={onCandidateClick}
                onMoveRequest={handleMoveRequest}
                canMove={canMove}
                emptyLabel={t("pipeline.mobile.noCandidates")}
                changeStageLabel={t("pipeline.mobile.changeStage")}
              />
            )
          })}
        </div>
      </div>

      {movingApp && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMovingApp(null)} />

          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="w-10 h-1 rounded-full bg-[#E4ECFF] mx-auto mb-4" />

            <p className="text-base font-black text-[#0F172A] mb-1">{movingApp.candidate_name}</p>

            <p className="text-sm text-[#64748B] mb-4">{t("pipeline.mobile.moveToStage")}</p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stages
                .filter((s) => s.id !== movingFromStage)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleMove(movingApp, s.id)}
                    className="w-full h-12 flex items-center gap-3 px-4 rounded-xl border border-[#E4ECFF] bg-white hover:bg-[#F7FBFF] transition-all"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: s.color }}
                    />

                    <span className="font-bold text-[#0F172A]">{s.label}</span>
                  </button>
                ))}
            </div>

            <button
              onClick={() => setMovingApp(null)}
              className="w-full h-11 mt-3 rounded-xl border border-[#E4ECFF] text-[#64748B] font-bold text-sm"
            >
              {t("pipeline.mobile.cancel")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CompactStageColumn({
  stage,
  applications,
  onCandidateClick,
  onMoveRequest,
  emptyLabel,
  changeStageLabel,
  canMove,
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width: "280px",
        minWidth: "280px",
        maxWidth: "280px",
        flex: "0 0 auto",
        scrollSnapAlign: "start",
      }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 rounded-t-2xl mb-1"
        style={{
          background: `${stage.color}14`,
          borderTop: `3px solid ${stage.color}`,
          position: "sticky",
        }}
      >
        <span className="font-black text-[#0F172A] text-sm">{stage.label}</span>

        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
          style={{ background: stage.color }}
        >
          {applications.length}
        </div>
      </div>

      <div
        className="flex-1 rounded-b-2xl bg-white/60 border border-[#E4ECFF] border-t-0 p-2 space-y-2"
        style={{ minHeight: 120 }}
      >
        {applications.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-[#CBD5E1] font-semibold">{emptyLabel}</p>
          </div>
        )}

        {applications.map((app) => (
          <CompactCard
            key={app.id}
            app={app}
            stageColor={stage.color}
            stageId={stage.id}
            onClick={() => onCandidateClick(app)}
            onMoveRequest={onMoveRequest}
            changeStageLabel={changeStageLabel}
            canMove={canMove}
          />
        ))}
      </div>
    </div>
  )
}

function CompactCard({
  app,
  stageColor,
  stageId,
  onClick,
  onMoveRequest,
  changeStageLabel,
  canMove,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E4ECFF] p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2" onClick={onClick}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${stageColor}, #2F80FF)` }}
          >
            {(app.candidate_name || "?")[0]}
          </div>

          <div className="min-w-0">
            <div className="font-black text-[#0F172A] text-xs truncate">{app.candidate_name}</div>

            <div className="text-xs text-[#7C3AED] font-semibold truncate">{app.job_title}</div>
          </div>
        </div>

        {app.match_score != null && <AIMatchBadge score={app.match_score} size="sm" />}
      </div>

      {canMove && (
        <button
          onClick={() => onMoveRequest(app, stageId)}
          className="w-full h-7 rounded-lg border border-[#E4ECFF] bg-[#F7FBFF] text-[#7C3AED] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F3EFFF] transition-all"
        >
          <ArrowRightLeft className="w-3 h-3" />

          {changeStageLabel}
        </button>
      )}
    </div>
  )
}
