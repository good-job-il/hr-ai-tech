/**
 * MobilePipelineView — TRUE Kanban for mobile/tablet
 * Fixed width columns, horizontal scroll, no layout jumping
 */
import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import AIMatchBadge from '@/components/ai/AIMatchBadge';

export default function MobilePipelineView({ stages, applications, onCandidateClick, onMove }) {
  const [movingApp, setMovingApp] = useState(null);
  const [movingFromStage, setMovingFromStage] = useState(null);
  const containerRef = useRef(null);
  const scrollInitialized = useRef(false);

  const handleMoveRequest = (app, stageId) => {
    setMovingApp(app);
    setMovingFromStage(stageId);
  };

  const handleMove = (app, newStageId) => {
    onMove(app.id, newStageId);
    setMovingApp(null);
    setMovingFromStage(null);
  };

  // Scroll to first stage on load - RTL compatible
  useEffect(() => {
    if (!containerRef.current || scrollInitialized.current || applications.length === 0) return;
    
    const timer = setTimeout(() => {
      // RTL: scroll to max (rightmost = first stage)
      containerRef.current.scrollLeft = 99999;
      scrollInitialized.current = true;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [applications.length]);

  return (
    <div dir="rtl">
      {/* TRUE horizontal scroll - fixed width columns */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-4"
        style={{
          // CRITICAL: True horizontal scroll
          overflowX: 'auto',
          overflowY: 'hidden',
          // Snap for better UX
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          // iOS smooth scrolling
          WebkitOverflowScrolling: 'touch',
          // Hide scrollbar
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          // RTL direction
          direction: 'rtl',
          // Prevent wrapping
          flexWrap: 'nowrap',
          // Min width
          minWidth: 'max-content',
        }}
      >
        {/* Hide scrollbar for Chrome/Safari */}
        <style>{`
          .mobile-pipeline-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {stages.map(stage => {
          const stageApps = applications.filter(a => a.status === stage.id);
          return (
            <CompactStageColumn
              key={stage.id}
              stage={stage}
              applications={stageApps}
              onCandidateClick={onCandidateClick}
              onMoveRequest={handleMoveRequest}
            />
          );
        })}
      </div>

      {/* Move stage bottom sheet */}
      {movingApp && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMovingApp(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl" dir="rtl">
            <div className="w-10 h-1 rounded-full bg-[#E4ECFF] mx-auto mb-4" />
            <p className="text-base font-black text-[#0F172A] mb-1">{movingApp.candidate_name}</p>
            <p className="text-sm text-[#64748B] mb-4">העבר לשלב:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stages.filter(s => s.id !== movingFromStage).map(s => (
                <button
                  key={s.id}
                  onClick={() => handleMove(movingApp, s.id)}
                  className="w-full h-12 flex items-center gap-3 px-4 rounded-xl border border-[#E4ECFF] bg-white hover:bg-[#F7FBFF] transition-all"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="font-bold text-[#0F172A]">{s.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMovingApp(null)}
              className="w-full h-11 mt-3 rounded-xl border border-[#E4ECFF] text-[#64748B] font-bold text-sm"
            >
              ביטול
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CompactStageColumn({ stage, applications, onCandidateClick, onMoveRequest }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        // FIXED width for mobile - 280px perfect for cards
        width: '280px',
        minWidth: '280px',
        maxWidth: '280px',
        // Prevent compression
        flex: '0 0 auto',
        // Snap alignment
        scrollSnapAlign: 'start',
        // RTL spacing
        marginRight: 0,
        marginLeft: '12px',
      }}
    >
      {/* Column header - STICKY */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-3 py-2.5 rounded-t-2xl mb-1"
        style={{ 
          background: `${stage.color}14`, 
          borderTop: `3px solid ${stage.color}`,
          position: 'sticky',
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

      {/* Cards */}
      <div
        className="flex-1 rounded-b-2xl bg-white/60 border border-[#E4ECFF] border-t-0 p-2 space-y-2"
        style={{ minHeight: 120 }}
      >
        {applications.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-[#CBD5E1] font-semibold">אין מועמדים</p>
          </div>
        )}
        {applications.map(app => (
          <CompactCard
            key={app.id}
            app={app}
            stageColor={stage.color}
            stageId={stage.id}
            onClick={() => onCandidateClick(app)}
            onMoveRequest={onMoveRequest}
          />
        ))}
      </div>
    </div>
  );
}

function CompactCard({ app, stageColor, stageId, onClick, onMoveRequest }) {
  return (
    <div className="bg-white rounded-xl border border-[#E4ECFF] p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2" onClick={onClick}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${stageColor}, #2F80FF)` }}
          >
            {(app.candidate_name || '?')[0]}
          </div>
          <div className="min-w-0">
            <div className="font-black text-[#0F172A] text-xs truncate">{app.candidate_name}</div>
            <div className="text-xs text-[#7C3AED] font-semibold truncate">{app.job_title}</div>
          </div>
        </div>
        {app.match_score != null && <AIMatchBadge score={app.match_score} size="sm" />}
      </div>

      <button
        onClick={() => onMoveRequest(app, stageId)}
        className="w-full h-7 rounded-lg border border-[#E4ECFF] bg-[#F7FBFF] text-[#7C3AED] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F3EFFF] transition-all"
      >
        <ArrowRightLeft className="w-3 h-3" />
        שנה שלב
      </button>
    </div>
  );
}