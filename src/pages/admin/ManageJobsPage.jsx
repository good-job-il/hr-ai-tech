import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Briefcase, Building2, MapPin, RefreshCw, Edit2, CheckCircle, XCircle, Mail, Copy, Check, DollarSign, Calendar } from 'lucide-react';
import JobFormModal from '@/components/employer/JobFormModal';

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
  closed: 'bg-red-100 text-red-700',
};

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [compensationPlans, setCompensationPlans] = useState([]);

  const loadJobs = async () => {
    setLoading(true);
    const all = await base44.entities.Job.list('-created_date', 200);
    setJobs(all);
    const plans = await base44.entities.CompensationPlan.list('', 100);
    setCompensationPlans(plans);
    setLoading(false);
  };

  const getCompensation = (job) => {
    if (!job) return null;
    const jobPlan = compensationPlans.find(p => p.job_id === job.id);
    return jobPlan || compensationPlans.find(p => p.client_name === job.company && !p.job_id);
  };

  useEffect(() => { loadJobs(); }, []);

  const filtered = jobs.filter(j => {
    if (!showClosed && j.is_closed) return false;
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
    await base44.entities.Job.update(job.id, { is_closed: !job.is_closed });
    loadJobs();
  };

  const openCount = jobs.filter(j => !j.is_closed).length;
  const closedCount = jobs.filter(j => j.is_closed).length;

  return (
    <div dir="ltr" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A]">Manage Jobs</h1>
          <p className="text-[#64748B] font-semibold mt-1">
            {openCount} open · {closedCount} closed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadJobs} disabled={loading}
            className="h-10 w-10 rounded-xl border border-[#E4ECFF] bg-white flex items-center justify-center text-[#64748B] hover:border-[#C4B5FD] transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleNew}
            className="h-10 px-5 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2 shadow-md hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" />
            New Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, company, location..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E4ECFF] bg-white text-sm outline-none focus:border-[#7C3AED] text-gray-900"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#64748B] cursor-pointer">
          <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)}
            className="w-4 h-4 rounded" />
          Show closed
        </label>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-[#E4ECFF] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4ECFF] p-12 text-center">
          <Briefcase className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
          <p className="text-[#64748B] font-bold text-lg">No jobs</p>
          <p className="text-[#94A3B8] text-sm mt-1">Click "New Job" to create</p>
          <button onClick={handleNew}
            className="mt-4 h-10 px-5 rounded-xl bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-md">
            <Plus className="w-4 h-4" />
            New Job
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4ECFF] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F7FBFF]">
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
                <tr key={job.id} className="border-b border-[#F8FAFC] hover:bg-[#F7FBFF] transition-colors">
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
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${job.is_closed ? STATUS_COLORS.closed : STATUS_COLORS.open}`}>
                      {job.is_closed ? 'Closed' : 'Open'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleEdit(job)}
                        className="h-8 w-8 rounded-lg border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleClose(job)}
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                          job.is_closed
                            ? 'border-green-200 text-green-600 hover:bg-green-50'
                            : 'border-red-200 text-red-500 hover:bg-red-50'
                        }`}
                        title={job.is_closed ? 'Reopen' : 'Close job'}>
                        {job.is_closed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JobFormModal
        job={editingJob}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={loadJobs}
      />
    </div>
  );
}
