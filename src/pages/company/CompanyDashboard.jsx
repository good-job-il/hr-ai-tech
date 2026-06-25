import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Calendar, TrendingUp, Sparkles,
  ArrowLeft, CheckCircle2, Clock, UserCheck, Activity
} from 'lucide-react';

const STALE = 5 * 60 * 1000;

function StatCard({ icon: Icon, label, value, color = 'green', loading, to }) {
  const colors = {
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  };
  const c = colors[color] || colors.green;
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
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function CompanyDashboard() {
  const { user, organization } = useAuth();
  const orgId = user?.organization_id;

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['company-jobs', orgId],
    queryFn: () => base44.entities.Job.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['company-candidates', orgId],
    queryFn: () => base44.entities.Candidate.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['company-interviews', orgId],
    queryFn: () => base44.entities.Interview.filter({ organization_id: orgId }, '-created_date', 50),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['company-applications', orgId],
    queryFn: () => base44.entities.Application.filter({ organization_id: orgId, is_deleted: false }, '-created_date', 100),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const loading = jobsLoading || candidatesLoading || interviewsLoading || applicationsLoading;

  const stats = useMemo(() => ({
    openJobs: jobs.filter(j => !j.is_closed).length,
    totalCandidates: candidates.length,
    upcomingInterviews: interviews.filter(i => i.status === 'scheduled').length,
    inProcess: applications.filter(a => ['phone_interview', 'recommended', 'employer_interview'].includes(a.status)).length,
    hired: applications.filter(a => a.status === 'hired').length,
    newCandidates: candidates.filter(c => c.status === 'new').length,
  }), [jobs, candidates, interviews, applications]);

  const recentJobs = useMemo(() => jobs.filter(j => !j.is_closed).slice(0, 5), [jobs]);
  const upcomingInterviews = useMemo(() => interviews.filter(i => i.status === 'scheduled').slice(0, 5), [interviews]);

  const orgName = organization?.name || 'הארגון שלי';

  return (
    <div dir="rtl" className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{orgName}</h1>
          <p className="text-gray-500 mt-1 font-semibold">דשבורד ניהול גיוס פנימי</p>
        </div>
        <div className="flex gap-2">
          <Link to="/company/jobs"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
            <Briefcase className="w-4 h-4" />
            פרסם משרה
          </Link>
          <Link to="/company/candidates"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-emerald-300 transition-colors">
            <Users className="w-4 h-4" />
            מועמדים
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Briefcase}    label="משרות פתוחות"    value={stats.openJobs}           color="green"  loading={loading} to="/company/jobs" />
        <StatCard icon={Users}        label="מועמדים"          value={stats.totalCandidates}    color="blue"   loading={loading} to="/company/candidates" />
        <StatCard icon={Calendar}     label="ראיונות קרובים"  value={stats.upcomingInterviews}  color="purple" loading={loading} to="/company/interviews" />
        <StatCard icon={Activity}     label="בתהליך"          value={stats.inProcess}           color="amber"  loading={loading} />
        <StatCard icon={CheckCircle2} label="גויסו"            value={stats.hired}              color="green"  loading={loading} />
        <StatCard icon={UserCheck}    label="מועמדים חדשים"   value={stats.newCandidates}       color="blue"   loading={loading} to="/company/candidates" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">משרות פתוחות</h2>
            <Link to="/company/jobs" className="text-sm text-emerald-600 font-bold flex items-center gap-1 hover:underline">
              כל המשרות <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : recentJobs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">אין משרות פתוחות</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{job.title}</p>
                    <p className="text-xs text-gray-400">{job.location || 'לא צוין מיקום'}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                    {job.applications_count || 0} מגישים
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">ראיונות קרובים</h2>
            <Link to="/company/interviews" className="text-sm text-purple-600 font-bold flex items-center gap-1 hover:underline">
              כל הראיונות <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>
          ) : upcomingInterviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">אין ראיונות מתוכננים</p>
          ) : (
            <div className="space-y-2">
              {upcomingInterviews.map(iv => (
                <div key={iv.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{iv.candidate_name}</p>
                    <p className="text-xs text-gray-400">{iv.job_title || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {iv.date} {iv.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Briefcase,  label: 'פרסם משרה',       to: '/company/jobs',            color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
            { icon: Users,      label: 'רשימת מועמדים',   to: '/company/candidates',      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { icon: Sparkles,   label: 'AI התאמה',         to: '/company/ai-matching',     color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
            { icon: TrendingUp, label: 'אנליטיקה',         to: '/company/analytics',       color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className={`flex items-center gap-2 p-4 rounded-xl font-bold text-sm transition-colors ${a.color}`}>
              <a.icon className="w-4 h-4" />
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}