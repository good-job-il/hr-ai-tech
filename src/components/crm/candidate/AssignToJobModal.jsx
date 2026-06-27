/**
 * AssignToJobModal
 * Modal for manually assigning a candidate from the general pool to an open job.
 */
import { useState, useEffect } from 'react';
import { X, Briefcase, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';

export default function AssignToJobModal({ candidate, onClose, onAssignSuccess }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';
  const isRTL = currentLang === 'he';
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState(null); // { success, message }
  const [loading, setLoading] = useState(true);

  // Fetch open jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const openJobs = await base44.entities.Job.filter({ is_closed: false }, '-created_date', 100);
        setJobs(openJobs);
        setFilteredJobs(openJobs);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Filter jobs based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredJobs(
        jobs.filter(job =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.category?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, jobs]);

  const handleAssign = async () => {
    if (!selectedJob) return;

    setAssigning(true);
    setResult(null);

    try {
      // Check if application already exists
      const existing = await base44.entities.Application.filter(
        { job_id: selectedJob.id, candidate_email: candidate.email },
        '-created_date',
        1
      );

      if (existing.length > 0) {
        setResult({ success: false, message: t('candidateCRM.assignToJob.alreadyExists') });
        setAssigning(false);
        return;
      }

      // Create Application
      const application = await base44.entities.Application.create({
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        company: selectedJob.company,
        employer_id: selectedJob.employer_id || '',
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        candidate_phone: candidate.phone || '',
        resume_url: candidate.resume_url || '',
        resume_filename: candidate.resume_filename || '',
        source: 'pool_assignment',
        status: 'new',
      });

      // Create Timeline event
      await base44.functions.invoke('createCandidateTimeline', {
        candidate_id: candidate.id,
        candidate_email: candidate.email,
        event_type: 'application_submitted',
        description: `מועמדות נוצרה למשרת ${selectedJob.title} ב-${selectedJob.company} (שיוך ידני מהמאגר הכללי)`,
        performed_by: 'system',
        performed_by_name: 'מערכת',
        performed_by_role: 'system',
        metadata: {
          job_id: selectedJob.id,
          job_title: selectedJob.title,
          source: 'manual_pool_assignment',
          application_id: application.id,
        },
      });

      setResult({ success: true, message: t('candidateCRM.assignToJob.successMessage', { jobTitle: selectedJob.title }) });
      if (onAssignSuccess) onAssignSuccess(application.id);
    } catch (err) {
      setResult({ success: false, message: err.message || t('candidateCRM.assignToJob.errorMessage') });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={!assigning ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECFF] bg-gradient-to-l from-[#F3EFFF] to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">{t('candidateCRM.assignToJob.title')}</h2>
              <p className="text-xs text-[#7C3AED] font-semibold">{candidate?.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={assigning}
            className="w-8 h-8 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success / Error result */}
        {result && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success
              ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            <p className={`text-sm font-bold ${result.success ? 'text-green-700' : 'text-red-600'}`}>{result.message}</p>
            {result.success && (
              <Button size="sm" variant="ghost" onClick={onClose} className="mr-auto text-xs">{t('candidateCRM.assignToJob.close')}</Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2 block">{t('candidateCRM.assignToJob.searchJob')}</label>
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('candidateCRM.assignToJob.searchPlaceholder')}
              className="text-sm h-10"
            />
          </div>

          {/* Job list */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
              <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-[#94A3B8]`}>{t('candidateCRM.assignToJob.loading')}</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8]">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">{t('candidateCRM.assignToJob.noJobs')}</p>
              <p className="text-xs mt-1">{t('candidateCRM.assignToJob.tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredJobs.map(job => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-right ${
                      isSelected
                        ? 'border-[#7C3AED] bg-[#F3EFFF]'
                        : 'border-[#E4ECFF] bg-white hover:border-[#C4B5FD]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#0F172A] truncate">{job.title}</div>
                      <div className="text-xs text-[#94A3B8] flex items-center gap-2 mt-1">
                        <span>{job.company}</span>
                        {job.location && <span>•</span>}
                        {job.location && <span>{job.location}</span>}
                        {job.salary_min && <span>•</span>}
                        {job.salary_min && <span>{job.salary_min.toLocaleString()}₪</span>}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E4ECFF] flex items-center justify-end gap-3 bg-[#F7F8FC]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={assigning} className="text-xs">
            {t('candidateCRM.assignToJob.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedJob || assigning || result?.success}
            className="bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-xs gap-2 px-5"
          >
            {assigning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('candidateCRM.assignToJob.assigning')}</>
            ) : (
              <><Briefcase className="w-3.5 h-3.5" /> {t('candidateCRM.assignToJob.assign')}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}