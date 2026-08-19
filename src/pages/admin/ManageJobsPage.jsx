import React, { useState, useEffect, useCallback } from 'react';
import { jobService } from '@/api/services/jobService';
import { compensationPlanService } from '@/api/services/compensationPlanService';
import { Plus, Search, Briefcase, Building2, MapPin, RefreshCw, Edit2, CheckCircle, XCircle, Mail, Copy, Check, AlertCircle } from 'lucide-react';
import JobFormModal from '@/components/employer/JobFormModal';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
} from '@/components/platform/PlatformUI';
import { usePermissionMatrix } from '@/hooks/usePermissionMatrix';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy address"
      className={`flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center transition-all ${
        copied ? 'bg-green-100 text-green-600' : 'bg-[#F3EFFF] text-[#7C3AED] hover:bg-[#EDE9FF]'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-700',
  draft: 'bg-slate-100 text-slate-700',
  on_hold: 'bg-amber-100 text-amber-700',
  filled: 'bg-blue-100 text-blue-700',
  closed: 'bg-red-100 text-red-700',
};

const ROUTE_STATES = { open: 'open', filled: 'filled', hold: 'on_hold' };

export default function ManageJobsPage() {
  const { can, loading: permissionsLoading } = usePermissionMatrix();
  const canCreate = can('create');
  const canUpdate = can('update');
  const canViewCompensation = can('view_compensation');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const routeState = ROUTE_STATES[location.pathname.split('/').pop()] || null;
  const preselectedClientId = searchParams.get('clientId');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [compensationPlans, setCompensationPlans] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const all = await jobService.list({ state: routeState || undefined, sort: 'created_date', order: 'DESC', limit: 200 });
      setJobs(all);
      if (canViewCompensation) {
        try {
          const plans = await compensationPlanService.list({ limit: 100 });
          setCompensationPlans(plans);
        } catch {
          setCompensationPlans([]);
        }
      } else {
        setCompensationPlans([]);
      }
    } catch (error) {
      setLoadError(error?.message || 'Unable to load jobs');
    } finally {
      setLoading(false);
    }
  }, [canViewCompensation, routeState]);

  const getCompensation = (job) => {
    if (!job) return null;
    const jobPlan = compensationPlans.find(p => p.job_id === job.id);
    return jobPlan || compensationPlans.find(p => p.client_name === job.company && !p.job_id);
  };

  useEffect(() => {
    if (!permissionsLoading) loadJobs();
  }, [loadJobs, permissionsLoading]);
  useEffect(() => {
    if (preselectedClientId && canCreate) {
      setEditingJob(null);
      setModalOpen(true);
    }
  }, [preselectedClientId, canCreate]);

  const filtered = jobs.filter(j => {
    if (!routeState && !showClosed && ['filled', 'closed'].includes(j.state || (j.is_closed ? 'closed' : 'open'))) return false;
    if (search) {
      const q = search.toLowerCase();
      return (j.title || '').toLowerCase().includes(q) ||
             (j.company || '').toLowerCase().includes(q) ||
             (j.location || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleNew = () => { setEditingJob(null); setModalOpen(true); };
  const handleEdit = (job) => { setEditingJob(job); setModalOpen(true); };
  const handleToggleClose = async (job) => {
    setUpdatingId(job.id);
    try {
      await (job.state === 'closed' ? jobService.reopen(job.id) : jobService.close(job.id));
      toast.success(job.state === 'closed' ? 'Job reopened' : 'Job closed');
      await loadJobs();
    } catch (error) {
      toast.error(error?.message || 'Unable to update job');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStateChange = async (job, state) => {
    setUpdatingId(job.id);
    try {
      await jobService.update(job.id, { state });
      toast.success('Job status updated');
      await loadJobs();
    } catch (error) {
      toast.error(error?.message || 'Unable to update job');
    } finally {
      setUpdatingId(null);
    }
  };

  const openCount = jobs.filter(j => (j.state || (j.is_closed ? 'closed' : 'open')) === 'open').length;
  const closedCount = jobs.filter(j => ['filled', 'closed'].includes(j.state || (j.is_closed ? 'closed' : 'open'))).length;

  return (
    <PlatformPageShell dir="ltr">
      <div className="space-y-6">
      {/* Header */}
      <PlatformPageHeader
        title="Manage Jobs"
        subtitle="Create, publish and manage agency vacancies"
        icon={Briefcase}
        actions={<div className="flex items-center gap-3">
          <button onClick={loadJobs} disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white/90 text-slate-500 shadow-[0_7px_20px_rgba(60,74,125,0.08)] transition hover:text-[#6C4DFF] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && <button onClick={handleNew}
            className="gradient-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(93,82,216,0.24)] transition hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            New Job
          </button>}
        </div>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlatformStatCard icon={Briefcase} label="All jobs" value={jobs.length} tone="violet" loading={loading} meta="Total vacancies" />
        <PlatformStatCard icon={CheckCircle} label="Open jobs" value={openCount} tone="emerald" loading={loading} meta="Currently recruiting" />
        <PlatformStatCard icon={XCircle} label="Closed jobs" value={closedCount} tone="rose" loading={loading} meta="Completed or paused" />
      </div>

      {/* Filters */}
      <PlatformCard className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, company, location..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#A78BFA] focus:ring-4 focus:ring-[#F3EFFF]"
          />
        </div>
        {!routeState && <label className="flex items-center gap-2 text-sm font-semibold text-[#64748B] cursor-pointer">
          <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)}
            className="h-5 w-5 rounded-md border-slate-300 accent-[#6C4DFF]" />
          Show closed
        </label>}
      </PlatformCard>

      {/* Jobs Table */}
      {loadError ? (
        <PlatformEmptyState icon={AlertCircle} className="min-h-[300px]">
          <p className="text-red-700 font-bold text-lg">Unable to load jobs</p>
          <p className="text-slate-500 text-sm mt-1">{loadError}</p>
          <button onClick={loadJobs} className="mt-4 h-10 px-5 rounded-xl bg-[#6C4DFF] text-white font-bold text-sm">
            Try again
          </button>
        </PlatformEmptyState>
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <PlatformEmptyState icon={Briefcase} className="min-h-[300px]">
          <p className="text-[#64748B] font-bold text-lg">No jobs</p>
          <p className="text-[#94A3B8] text-sm mt-1">Click "New Job" to create</p>
          {canCreate && <button onClick={handleNew}
            className="mt-4 h-10 px-5 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-md">
            <Plus className="w-4 h-4" />
            New Job
          </button>}
        </PlatformEmptyState>
      ) : (
        <PlatformCard className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr className="border-b border-[#EAF0F8] bg-[#F7FAFF]">
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3">Position</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3 hidden md:table-cell">Company</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3 hidden md:table-cell">Location</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3">Code / Email / Link</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3">Compensation</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3">Warranty</th>
                <th className="text-left text-xs font-black text-[#64748B] px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-[#F8FAFF]">
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#0F172A] text-sm">{job.title}</div>
                    <div className="text-xs text-[#94A3B8] mt-0.5">{job.category || '—'}</div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#374151]">
                      <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {job.company || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#374151]">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {job.location || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4 min-w-[260px]">
                   {job.job_code ? (
                     <div className="space-y-1.5">
                       <span className="inline-block px-2 py-0.5 bg-[#F3EFFF] text-[#7C3AED] text-xs font-black rounded-lg">
                         {job.job_code}
                       </span>
                       {job.apply_email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
                            <span className="text-xs text-[#374151] font-mono break-all">{job.apply_email}</span>
                            <CopyButton text={job.apply_email} />
                          </div>
                        )}
                        {job.apply_url && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-[#94A3B8]">🔗</span>
                            <a href={job.apply_url} target="_blank" rel="noreferrer"
                              className="text-xs text-[#2563EB] hover:underline truncate max-w-[180px]">
                              {job.apply_url.replace('https://', '')}
                            </a>
                            <CopyButton text={job.apply_url} />
                          </div>
                        )}
                     </div>
                   ) : (
                     <span className="text-xs text-[#CBD5E1]">Waiting for code...</span>
                   )}
                  </td>
                  <td className="px-5 py-4">
                   {(() => {
                      const plan = getCompensation(job);
                      const formatComp = (value, type, total) => {
                        if (!value) return '—';
                        if (type === 'fixed') {
                          return `${value.toLocaleString()}₪`;
                        } else if (type === 'percent' && total) {
                          const fixed = (total * value) / 100;
                          return `${fixed.toLocaleString()}₪`;
                        }
                        return `${value}%`;
                      };
                      return (
                        <span className="text-[#374151] text-xs">
                          {plan?.recruiter_compensation ? formatComp(plan.recruiter_compensation, plan.recruiter_compensation_type, plan.total_fee) : '—'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const plan = getCompensation(job);
                      if (!plan) return <span className="text-[#CBD5E1] text-xs">—</span>;
                      const days = plan.warranty_period_days ?? 30;
                      return (
                        <span className="text-[#374151] text-xs">
                          {days} days
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    {canUpdate ? (
                      <select
                        value={job.state || (job.is_closed ? 'closed' : 'open')}
                        disabled={updatingId === job.id}
                        onChange={event => handleStateChange(job, event.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold outline-none ${STATUS_COLORS[job.state || (job.is_closed ? 'closed' : 'open')]}`}
                      >
                        <option value="draft">Draft</option><option value="open">Open</option><option value="on_hold">On hold</option><option value="filled">Filled</option><option value="closed">Closed</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[job.state || (job.is_closed ? 'closed' : 'open')]}`}>
                        {(job.state || (job.is_closed ? 'closed' : 'open')).replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {canUpdate && <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleEdit(job)}
                        className="h-8 w-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleClose(job)} disabled={updatingId === job.id}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                          job.state === 'closed'
                            ? 'border-green-200 text-green-600 hover:bg-green-50'
                            : 'border-red-200 text-red-500 hover:bg-red-50'
                        }`}
                        title={job.state === 'closed' ? 'Reopen' : 'Close job'}>
                        {job.state === 'closed' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </PlatformCard>
      )}

      <JobFormModal
        job={editingJob}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          toast.success(editingJob ? 'Job updated' : 'Job created');
          loadJobs();
        }}
        preselectedClientId={preselectedClientId}
      />
      </div>
    </PlatformPageShell>
  );
}
