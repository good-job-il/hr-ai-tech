/**
 * AIMatchingPage
 * Central hub: search candidates or jobs and see AI match results.
 * Role-filtered: recruiter sees own candidates, manager sees all team, etc.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { rankJobsForCandidate, rankCandidatesForJob } from '@/lib/aiMatching';
import AIMatchBadge from '@/components/ai/AIMatchBadge';
import MatchExplanationCard from '@/components/ai/MatchExplanationCard';
import CandidateRecommendationsPanel from '@/components/ai/CandidateRecommendationsPanel';
import JobRecommendationsPanel from '@/components/ai/JobRecommendationsPanel';
import { Sparkles, Users, Briefcase, Search, SlidersHorizontal, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const MODES = [
  { id: 'candidate', label: 'מועמד → משרות', icon: Users },
  { id: 'job', label: 'משרה → מועמדים', icon: Briefcase },
];

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold transition-all ${type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1E293B] text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

export default function AIMatchingPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => setToast({ message, type });
  const [mode, setMode] = useState('candidate');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // ─────────────────────────────────────────────────────────────────────
    // VISIBILITY POLICY — AIMatchingPage (candidate list)
    //
    //  recruiter → only candidates assigned to them (recruiter_id === user.email)
    //              + unassigned only if can_view_unassigned === true
    //  employer  → only candidates where employer_id === user.email
    //  admin / recruitment_manager / team_manager → all candidates
    //
    // This is an intentional design decision: AI Matching is a recruiter tool
    // scoped to their own pool. It is NOT a global search.
    // ─────────────────────────────────────────────────────────────────────
    const fetchCandidates = async () => {
      if (user.role === 'recruiter') {
        const assigned = await base44.entities.Candidate.filter(
          { recruiter_id: user.email }, '-created_date', 100
        ).catch(() => []);
        if (user.can_view_unassigned === true) {
          const unassigned = await base44.entities.Candidate.filter(
            { recruiter_id: null }, '-created_date', 50
          ).catch(() => []);
          const ids = new Set(assigned.map(c => c.id));
          return [...assigned, ...unassigned.filter(c => !ids.has(c.id))];
        }
        return assigned;
      }
      if (user.role === 'employer') {
        return base44.entities.Candidate.filter(
          { employer_id: user.email }, '-created_date', 100
        ).catch(() => []);
      }
      // admin / recruitment_manager / team_manager — all
      return base44.entities.Candidate.list('-created_date', 200).catch(() => []);
    };

    Promise.all([
      fetchCandidates(),
      base44.entities.Job.filter({ is_closed: false }, '-created_date', 100).catch(() => []),
    ]).then(([c, j]) => {
      setCandidates(c || []);
      setJobs(j || []);
    }).finally(() => setLoading(false));
  }, [user?.email, user?.role]);

  const filteredCandidates = candidates.filter(c =>
    !searchQ || (c.full_name || '').toLowerCase().includes(searchQ.toLowerCase()) ||
    (c.role_name || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    !searchQ || (j.title || '').toLowerCase().includes(searchQ.toLowerCase()) ||
    (j.company || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div dir="rtl" className="bg-[#F7FBFF] -m-6 p-0">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <div className="bg-white border-b border-[#E4ECFF] px-8 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">AI Matching Engine</h1>
            <p className="text-sm text-[#64748B] font-semibold">התאמה חכמה בין מועמדים למשרות</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setSelectedCandidate(null); setSelectedJob(null); setSearchQ(''); }}
                className={`flex items-center gap-2 h-10 px-5 rounded-xl font-bold text-sm transition-all border ${
                  mode === m.id
                    ? 'bg-[#F3EFFF] border-[#C4B5FD] text-[#7C3AED]'
                    : 'bg-white border-[#E4ECFF] text-[#64748B] hover:border-[#C4B5FD]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}

          <div className="flex items-center gap-2 mr-auto">
            <SlidersHorizontal className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-xs text-[#64748B] font-semibold">ציון מינימלי:</span>
            <select
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              className="h-9 px-3 rounded-xl border border-[#E4ECFF] text-sm font-bold text-[#0F172A] outline-none bg-white"
            >
              <option value={0}>הכל</option>
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
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={mode === 'candidate' ? 'חפש מועמד...' : 'חפש משרה...'}
              className="w-full h-10 pr-9 pl-4 rounded-xl border border-[#E4ECFF] bg-white text-sm font-semibold text-[#0F172A] outline-none focus:border-[#C4B5FD]"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading && (
              <div className="text-center py-8 text-[#94A3B8] text-sm">טוען...</div>
            )}

            {mode === 'candidate' && filteredCandidates.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selectedCandidate?.id === c.id
                    ? 'border-[#C4B5FD] bg-[#F3EFFF]'
                    : 'border-[#E4ECFF] bg-white hover:border-[#C4B5FD]'
                }`}
              >
                <div className="font-black text-[#0F172A] text-sm">{c.full_name}</div>
                <div className="text-xs text-[#7C3AED] font-semibold">{c.role_name || c.domain_name}</div>
                {c.location && <div className="text-xs text-[#94A3B8]">{c.location}</div>}
              </button>
            ))}

            {mode === 'job' && filteredJobs.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJob(j)}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  selectedJob?.id === j.id
                    ? 'border-[#C4B5FD] bg-[#F3EFFF]'
                    : 'border-[#E4ECFF] bg-white hover:border-[#C4B5FD]'
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
          {mode === 'candidate' && !selectedCandidate && (
            <EmptyState text="בחר מועמד מהרשימה כדי לראות משרות מתאימות" icon={Users} />
          )}
          {mode === 'job' && !selectedJob && (
            <EmptyState text="בחר משרה מהרשימה כדי לראות מועמדים מתאימים" icon={Briefcase} />
          )}

          {mode === 'candidate' && selectedCandidate && (
            <div>
              <div className="mb-4 p-4 rounded-2xl bg-white border border-[#E4ECFF]">
                <div className="font-black text-[#0F172A]">{selectedCandidate.full_name}</div>
                <div className="text-sm text-[#7C3AED] font-semibold">{selectedCandidate.role_name}</div>
                <div className="text-xs text-[#94A3B8]">{selectedCandidate.location} • {selectedCandidate.experience_years} שנות ניסיון</div>
              </div>
              <CandidateRecommendationsPanel
                candidate={selectedCandidate}
                onAssignToJob={async (job) => {
                  try {
                    // Check for existing application
                    const existing = await base44.entities.Application.filter(
                      { job_id: job.id, candidate_email: selectedCandidate.email }, '', 1
                    );
                    if (existing.length > 0) {
                      showToast(`מועמדות כבר קיימת עבור ${selectedCandidate.full_name} במשרת ${job.title}`, 'info');
                      return;
                    }
                    await base44.entities.Application.create({
                      job_id: job.id,
                      job_title: job.title,
                      company: job.company,
                      employer_id: job.employer_id || '',
                      candidate_name: selectedCandidate.full_name,
                      candidate_email: selectedCandidate.email || '',
                      candidate_phone: selectedCandidate.phone || '',
                      resume_url: selectedCandidate.resume_url || selectedCandidate.converted_resume_url || '',
                      location: selectedCandidate.location || '',
                      source: 'app',
                      status: 'new',
                      assigned_to: selectedCandidate.recruiter_id || '',
                    });
                    showToast(`${selectedCandidate.full_name} שויך למשרת ${job.title} והוכנס ל-Pipeline!`);
                  } catch (e) {
                    showToast(`שגיאה: ${e.message}`, 'error');
                  }
                }}
              />
            </div>
          )}

          {mode === 'job' && selectedJob && (
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
                   await base44.entities.Application.create({
                     job_id: selectedJob.id,
                     job_title: selectedJob.title,
                     company: selectedJob.company,
                     employer_id: selectedJob.employer_id || '',
                     candidate_name: candidate.full_name,
                     candidate_email: candidate.email || '',
                     candidate_phone: candidate.phone || '',
                     resume_url: candidate.resume_url || '',
                     location: candidate.location || '',
                     source: 'app',
                     status: 'new',
                     assigned_to: candidate.recruiter_id || '',
                   });
                   showToast(`${candidate.full_name} הוסף ל-Pipeline עבור ${selectedJob.title}!`);
                 } catch (e) {
                   showToast(`שגיאה: ${e.message}`, 'error');
                 }
               }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F3EFFF] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#C4B5FD]" />
      </div>
      <p className="text-[#94A3B8] font-semibold">{text}</p>
    </div>
  );
}