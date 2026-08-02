import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, DollarSign, TrendingUp, Kanban,
  Sparkles, Activity, CheckCircle2, AlertCircle, Building2,
} from 'lucide-react';
import CreateClientModal from '@/components/dialogs/CreateClientModal';
import { agencyClientService } from '@/api/services/agencyClientService';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from '@/components/platform/PlatformUI';

// Performance: Query optimization with React Query caching
const DASHBOARD_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DASHBOARD_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export default function AgencyDashboard() {
  const { user, organization } = useAuth();
  const [showClientModal, setShowClientModal] = useState(false);
  const orgId = user?.organization_id;
  const canManageClients = ['org_admin', 'recruitment_manager', 'admin'].includes(user?.role);

  // Performance: Use React Query with caching
  const { data: jobs = [], isLoading: jobsLoading, isError: jobsError } = useQuery({
    queryKey: ['agency-jobs', orgId],
    queryFn: () => base44.entities.Job.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 50),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: candidates = [], isLoading: candidatesLoading, isError: candidatesError } = useQuery({
    queryKey: ['agency-candidates', orgId],
    queryFn: () => base44.entities.Candidate.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: applications = [], isLoading: applicationsLoading, isError: applicationsError } = useQuery({
    queryKey: ['agency-applications', orgId],
    queryFn: () => base44.entities.Application.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: ['agency-plans', orgId],
    queryFn: () => base44.entities.CompensationPlan.filter({ organization_id: orgId }, '', 50),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: clients = [], isLoading: clientsLoading, isError: clientsError } = useQuery({
    queryKey: ['agency-clients', orgId],
    queryFn: () => agencyClientService.list({ status: 'active' }, 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  // Performance: Memoized stats calculation
  const loading = jobsLoading || candidatesLoading || applicationsLoading || plansLoading || clientsLoading;
  const dashboardError = jobsError || candidatesError || applicationsError || plansError || clientsError;
  
  const stats = useMemo(() => {
    if (!orgId) return {};
    
    const openJobs = jobs.filter(j => !j.is_closed);
    const closedJobs = jobs.filter(j => j.is_closed);
    const inProcess = applications.filter(a => ['phone_interview','recommended','employer_interview'].includes(a.status));
    const hired = applications.filter(a => a.status === 'hired');
    const newCandidates = candidates.filter(c => c.status === 'new');

    return {
      openJobs: openJobs.length,
      closedJobs: closedJobs.length,
      totalCandidates: candidates.length,
      newCandidates: newCandidates.length,
      inProcess: inProcess.length,
      hired: hired.length,
      activePlans: plans.length,
      totalApplications: applications.length,
      activeClients: clients.length,
    };
  }, [jobs, candidates, applications, plans, clients, orgId]);

  const recentJobs = useMemo(() => {
    return jobs.filter(j => !j.is_closed).slice(0, 5);
  }, [jobs]);

  const orgName = organization?.name || user?.organization_name || 'חברת ההשמה';

  // Performance: Reload stats after creating client with cache invalidation
  const queryClient = useQueryClient();
  const handleClientCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agency-jobs', orgId] });
    queryClient.invalidateQueries({ queryKey: ['agency-candidates', orgId] });
    queryClient.invalidateQueries({ queryKey: ['agency-applications', orgId] });
    queryClient.invalidateQueries({ queryKey: ['agency-plans', orgId] });
    queryClient.invalidateQueries({ queryKey: ['agency-clients', orgId] });
    queryClient.invalidateQueries({ queryKey: ['agency-clients-list', orgId] });
  }, [orgId, queryClient]);

  return (
    <PlatformPageShell dir="rtl">
      <div className="space-y-7">

      {/* Header */}
      <PlatformPageHeader
        title={orgName}
        subtitle="דשבורד ניהול — חברת השמה"
        icon={Sparkles}
        actions={(
        <div className="flex flex-wrap gap-2">
          <Link to="/agency/jobs/open"
            className="gradient-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(93,82,216,0.24)] transition hover:-translate-y-0.5 hover:shadow-lg">
            <Briefcase className="w-4 h-4" />
            הוסף משרה
          </Link>
          <Link to="/agency/crm"
            className="flex h-11 items-center gap-2 rounded-xl border border-white bg-white/90 px-4 text-sm font-bold text-slate-600 shadow-[0_7px_20px_rgba(60,74,125,0.08)] transition hover:text-[#6C4DFF]">
            <Users className="w-4 h-4" />
            הוסף מועמד
          </Link>
          {canManageClients && <button
            onClick={() => setShowClientModal(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-white bg-white/90 px-4 text-sm font-bold text-slate-600 shadow-[0_7px_20px_rgba(60,74,125,0.08)] transition hover:text-[#6C4DFF]">
            <Building2 className="w-4 h-4" />
            הוסף לקוח
          </button>}
        </div>
        )}
      />

      {dashboardError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <span className="font-bold">לא ניתן לטעון את כל נתוני הדשבורד. הנתונים המוצגים עשויים להיות חלקיים.</span>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="font-black text-purple-700 hover:underline"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard icon={Briefcase} label="משרות פתוחות" value={stats.openJobs} tone="violet" loading={loading} to="/agency/jobs/open" meta="פעילות כעת" />
        <PlatformStatCard icon={Users} label="סה״כ מועמדים" value={stats.totalCandidates} tone="blue" loading={loading} to="/agency/crm" meta="במאגר המועמדים" />
        <PlatformStatCard icon={Kanban} label="בתהליך גיוס" value={stats.inProcess} tone="amber" loading={loading} to="/agency/pipeline" meta="בשלבים פעילים" />
        <PlatformStatCard icon={CheckCircle2} label="גויסו" value={stats.hired} tone="emerald" loading={loading} meta="השמות שהושלמו" />
        <PlatformStatCard icon={AlertCircle} label="מועמדים חדשים" value={stats.newCandidates} tone="slate" loading={loading} to="/agency/crm" meta="ממתינים לטיפול" />
        <PlatformStatCard icon={TrendingUp} label="סה״כ הגשות" value={stats.totalApplications} tone="fuchsia" loading={loading} meta="לכל המשרות" />
        <PlatformStatCard icon={Building2} label="לקוחות פעילים" value={stats.activeClients} tone="cyan" loading={loading} meta="חברות מגייסות" />
        <PlatformStatCard icon={DollarSign} label="תוכניות תגמול" value={stats.activePlans} tone="rose" loading={loading} to="/agency/compensation" meta="תוכניות פעילות" />
      </div>

      {/* Two columns: recent jobs + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent open jobs */}
        <PlatformCard className="p-6">
          <PlatformWidgetHeader title="משרות פתוחות אחרונות" linkTo="/agency/jobs/open" actionLabel="כל המשרות" className="mb-4" />
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <PlatformEmptyState icon={Briefcase}>אין משרות פתוחות</PlatformEmptyState>
          ) : (
            <div className="space-y-2">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between rounded-2xl border border-slate-100/80 bg-slate-50/65 px-4 py-3 transition hover:border-[#DDD6FE] hover:bg-[#F8F5FF]">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.company}</p>
                  </div>
                  <span className="rounded-full bg-[#F1EAFF] px-2.5 py-1 text-xs font-bold text-[#6C4DFF]">
                    {job.applications_count || 0} מגישים
                  </span>
                </div>
              ))}
            </div>
          )}
        </PlatformCard>

        {/* Quick actions */}
        <PlatformCard className="p-6">
          <PlatformWidgetHeader title="פעולות מהירות" subtitle="גישה מהירה לכלי העבודה המרכזיים" className="mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase,  label: 'פרסם משרה',          to: '/agency/jobs/open',         color: 'text-[#7C3AED]', bg: 'bg-[#F3EFFF]' },
              { icon: Users,      label: 'הוסף מועמד',          to: '/agency/crm',               color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Kanban,     label: 'צפה ב-Pipeline',      to: '/agency/pipeline',          color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Sparkles,   label: 'AI התאמה',            to: '/agency/ai-matching',       color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
              { icon: DollarSign, label: 'ניהול תגמולים',       to: '/agency/compensation',      color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Activity,   label: 'יומן פעילות',         to: '/agency/activity',          color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-[#DDD6FE] hover:shadow-md">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.bg} ${a.color}`}><a.icon className="w-4 h-4" /></span>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </PlatformCard>
      </div>

      {canManageClients && <CreateClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={handleClientCreated}
      />}
      </div>
    </PlatformPageShell>
  );
}
