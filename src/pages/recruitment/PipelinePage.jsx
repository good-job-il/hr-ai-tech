import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import PipelineBoard from '@/components/ats/PipelineBoard';
import MobilePipelineView from '@/components/ats/MobilePipelineView';
import PipelineFilters from '@/components/ats/PipelineFilters';
import CandidateDrawer from '@/components/ats/CandidateDrawer';
import { usePipelineData } from '@/hooks/usePipelineData';
import { SlidersHorizontal, RefreshCw, Kanban, FlaskConical } from 'lucide-react';
import NotificationCenter from '@/components/ats/NotificationCenter';

// Minimum px per stage column to render Kanban without forced horizontal scroll
const MIN_PX_PER_STAGE = 160;

export default function PipelinePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const boardContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ role: '', recruiter: '', aiMin: 0, source: '', dateFrom: '', dateTo: '', expMin: '', expMax: '' });
  const [showFilters, setShowFilters] = useState(false);

  const [notifKey, setNotifKey] = useState(0);
  const handleNotificationCreated = useCallback(() => setNotifKey(k => k + 1), []);

  const { stages, applications, loading, moveApplication, refresh, isMockData } = usePipelineData(user, filters, handleNotificationCreated);

  // Get current language direction
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';
  const isRTL = currentLang === 'he';

  // Observe the actual container width — this is the real available space after sidebars
  useEffect(() => {
    if (!boardContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(boardContainerRef.current);
    // Set initial width immediately
    setContainerWidth(boardContainerRef.current.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  // Use Mobile view if container is too narrow to fit all stage columns without horizontal drag
  const stageCount = stages.length || 7;
  const useMobileView = containerWidth !== null && containerWidth < stageCount * MIN_PX_PER_STAGE;

  const handleCandidateClick = (application) => {
    setSelectedCandidate(application.id);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setSelectedCandidate(null);
  };

  const liveSelectedApp = selectedCandidate
    ? applications.find(a => a.id === selectedCandidate) || null
    : null;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col w-full min-w-0 bg-[#F7FBFF]">
      {/* Header — fixed to viewport width, never grows with Kanban */}
      <div className="flex-shrink-0 w-full min-w-0 bg-white border-b border-[#E4ECFF] px-4 md:px-8 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0F172A]">{t('pipeline.page.title')}</h1>
              <p className="text-sm text-[#64748B] font-semibold">
                {t('pipeline.page.candidatesCount', { count: applications.length })} • {t('pipeline.page.stagesCount', { count: stages.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter key={notifKey} />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-4 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all ${
                showFilters
                  ? 'bg-[#F3EFFF] border-[#C4B5FD] text-[#7C3AED]'
                  : 'bg-white border-[#E4ECFF] text-[#64748B] hover:border-[#C4B5FD]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('pipeline.page.filter')}
            </button>
            <button
              onClick={refresh}
              className="h-10 px-4 rounded-xl border border-[#E4ECFF] bg-white text-[#64748B] font-bold text-sm flex items-center gap-2 hover:border-[#C4B5FD] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {t('pipeline.page.refresh')}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#E4ECFF]">
            <PipelineFilters filters={filters} onChange={setFilters} />
          </div>
        )}
      </div>

      {/* Demo Data Banner */}
      {isMockData && !loading && (
        <div className="mx-4 md:mx-6 mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-sm font-bold text-amber-700">{t('pipeline.page.demoDataBanner')}</span>
        </div>
      )}

      {/* Kanban viewport — only this area scrolls horizontally */}
      <div
        className="w-full min-w-0 overflow-hidden p-4 md:p-6"
        ref={boardContainerRef}
      >
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#64748B] font-bold">{t('pipeline.page.loading')}</p>
            </div>
          </div>
        ) : useMobileView ? (
          <MobilePipelineView
            stages={stages}
            applications={applications}
            onCandidateClick={handleCandidateClick}
            onMove={moveApplication}
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
          />
        )}
      </div>

      {/* Candidate Drawer */}
      <CandidateDrawer
        application={liveSelectedApp}
        open={drawerOpen}
        onClose={handleClose}
        onStageChange={(appId, newStage) => {
          moveApplication(appId, newStage);
        }}
      />
    </div>
  );
}
