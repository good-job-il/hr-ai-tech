import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, DollarSign, TrendingUp, Kanban, UserCheck,
  Sparkles, Activity, ArrowLeft, Clock, CheckCircle2, AlertCircle, Building2,
} from 'lucide-react';
import CreateClientModal from '@/components/dialogs/CreateClientModal';

function StatCard({ icon: Icon, label, value, sub, color = 'purple', loading, to }) {
  const colors = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-100' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-100' },
  };
  const c = colors[color] || colors.purple;
  const inner = (
    <div className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>
      {loading
        ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
        : <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
      }
      {sub && <p className="text-xs text-gray-400 mt-1 font-semibold">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

// Performance: Query optimization with React Query caching
const DASHBOARD_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const DASHBOARD_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export default function AgencyDashboard() {
  const { user, organization } = useAuth();
  const [showClientModal, setShowClientModal] = useState(false);
  const orgId = user?.organization_id;

  // Performance: Use React Query with caching
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['agency-jobs', orgId],
    queryFn: () => base44.entities.Job.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 50),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['agency-candidates', orgId],
    queryFn: () => base44.entities.Candidate.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['agency-applications', orgId],
    queryFn: () => base44.entities.Application.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['agency-plans', orgId],
    queryFn: () => base44.entities.CompensationPlan.filter({ organization_id: orgId }, '', 50),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['agency-clients', orgId],
    queryFn: () => base44.entities.Organization.filter({ org_type: 'organization', status: 'active' }, '', 100),
    enabled: !!orgId,
    staleTime: DASHBOARD_STALE_TIME,
    cacheTime: DASHBOARD_CACHE_TIME,
  });

  // Performance: Memoized stats calculation
  const loading = jobsLoading || candidatesLoading || applicationsLoading || plansLoading || clientsLoading;
  
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
    queryClient.invalidateQueries(['agency-jobs', orgId]);
    queryClient.invalidateQueries(['agency-candidates', orgId]);
    queryClient.invalidateQueries(['agency-applications', orgId]);
    queryClient.invalidateQueries(['agency-plans', orgId]);
  }, [orgId, queryClient]);

  return (
    <div dir="rtl" className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{orgName}</h1>
          <p className="text-gray-500 mt-1 font-semibold">דשבורד ניהול — חברת השמה</p>
        </div>
        <div className="flex gap-2">
          <Link to="/agency/jobs/open"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
            <Briefcase className="w-4 h-4" />
            הוסף משרה
          </Link>
          <Link to="/agency/crm"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-purple-300 transition-colors">
            <Users className="w-4 h-4" />
            הוסף מועמד
          </Link>
          <button
            onClick={() => setShowClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-purple-300 transition-colors">
            <Building2 className="w-4 h-4" />
            הוסף לקוח
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}    label="משרות פתוחות"      value={stats.openJobs}        color="purple" loading={loading} to="/agency/jobs/open" />
        <StatCard icon={Users}        label="סה״כ מועמדים"      value={stats.totalCandidates}  color="blue"   loading={loading} to="/agency/crm" />
        <StatCard icon={Kanban}       label="בתהליך גיוס"       value={stats.inProcess}        color="amber"  loading={loading} to="/agency/pipeline" />
        <StatCard icon={CheckCircle2} label="גויסו"              value={stats.hired}            color="green"  loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle}  label="מועמדים חדשים"     value={stats.newCandidates}    color="slate"  loading={loading} to="/agency/crm" />
        <StatCard icon={TrendingUp}   label="סה״כ הגשות"        value={stats.totalApplications}color="purple" loading={loading} />
        <StatCard icon={Building2}    label="לקוחות פעילים"     value={stats.activeClients}    color="blue"   loading={loading} />
        <StatCard icon={DollarSign}   label="תוכניות תגמול"     value={stats.activePlans}      color="amber"  loading={loading} to="/agency/compensation" />
      </div>

      {/* Two columns: recent jobs + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent open jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">משרות פתוחות אחרונות</h2>
            <Link to="/agency/jobs/open" className="text-sm text-purple-600 font-bold flex items-center gap-1 hover:underline">
              כל המשרות <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">אין משרות פתוחות</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.company}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full">
                    {job.applications_count || 0} מגישים
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Briefcase,  label: 'פרסם משרה',          to: '/agency/jobs/open',         color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { icon: Users,      label: 'הוסף מועמד',          to: '/agency/crm',               color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { icon: Kanban,     label: 'צפה ב-Pipeline',      to: '/agency/pipeline',          color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { icon: Sparkles,   label: 'AI התאמה',            to: '/agency/ai-matching',       color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
              { icon: DollarSign, label: 'ניהול תגמולים',       to: '/agency/compensation',      color: 'bg-green-50 text-green-600 hover:bg-green-100' },
              { icon: Activity,   label: 'יומן פעילות',         to: '/agency/activity',          color: 'bg-slate-50 text-slate-600 hover:bg-slate-100' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className={`flex items-center gap-2 p-3 rounded-xl font-bold text-sm transition-colors ${a.color}`}>
                <a.icon className="w-4 h-4" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <CreateClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}