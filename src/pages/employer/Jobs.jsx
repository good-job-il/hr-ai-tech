import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmployerLayout from '@/components/employer/EmployerLayout';
import JobFormModal from '@/components/employer/JobFormModal';
import { Plus, Trash2, Eye, Send, Lock, Globe, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { logError } from '@/lib/errorHandler';
import ErrorAlert from '@/components/common/ErrorAlert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function EmployerJobs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['employer-jobs', user?.email],
    queryFn: async () => {
      try {
        const result = await base44.entities.Job.filter({ employer_id: user?.email });
        return result || [];
      } catch (err) {
        logError(err, 'fetch-employer-jobs');
        setError('שגיאה בטעינת המשרות');
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const { data: compensationPlans = [] } = useQuery({
    queryKey: ['compensation-plans'],
    queryFn: async () => {
      try {
        return await base44.entities.CompensationPlan.list('', 100);
      } catch (err) {
        return [];
      }
    },
  });

  const getCompensation = (job) => {
    if (!job) return null;
    const jobPlan = compensationPlans.find(p => p.job_id === job.id);
    return jobPlan || compensationPlans.find(p => p.client_name === job.company && !p.job_id);
  };

  const deleteMutation = useMutation({
    mutationFn: async (jobId) => {
      return base44.entities.Job.delete(jobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
    onError: (err) => {
      logError(err, 'delete-job');
      setError('שגיאה במחיקת המשרה');
    },
  });

  const toggleCloseMutation = useMutation({
    mutationFn: async (job) => {
      return base44.entities.Job.update(job.id, { is_closed: !job.is_closed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
    },
    onError: (err) => {
      logError(err, 'toggle-job-status');
      setError('שגיאה בעדכון המשרה');
    },
  });

  const handleEdit = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedJob(null);
    setShowModal(true);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['employer-jobs'] });
  };

  if (isLoading) {
    return (
      <EmployerLayout>
        <LoadingSpinner text="טוען משרות..." />
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="p-6 space-y-6">
        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => setError('')}
            onRetry={() => window.location.reload()}
          />
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול משרות</h1>
            <p className="text-gray-500 text-sm mt-1">{jobs.length} משרות פעילות</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 h-10 rounded-xl font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> משרה חדשה
          </button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="אין משרות עדיין"
            description="התחל בפרסום משרה ראשונה"
            action={handleNew}
            actionText="פרסם משרה"
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{job.company} • {job.location}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Eye className="w-3.5 h-3.5" /> {job.views || 0} צפיות
                      <Send className="w-3.5 h-3.5" /> {job.applications_count || 0} מועמדויות
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       {job.is_anonymous ? (
                         <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center gap-1">
                           <Lock className="w-3 h-3" /> אנונימית
                         </span>
                       ) : (
                         <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                           <Globe className="w-3 h-3" /> גלויה
                         </span>
                       )}
                       {job.is_closed && (
                         <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">סגורה</span>
                       )}
                     </div>

                     {(() => {
                       const plan = getCompensation(job);
                       if (!plan || (!plan.recruiter_compensation && !plan.warranty_period_days)) return null;

                       const formatComp = (value, type, total) => {
                         if (!value) return null;
                         if (type === 'fixed') {
                           return `${value.toLocaleString()} ₪`;
                         } else if (type === 'percent' && total) {
                           const fixed = (total * value) / 100;
                           return `${fixed.toLocaleString()} ₪ (${value}%)`;
                         }
                         return `${value}%`;
                       };

                       return (
                         <div className="flex items-center gap-2 text-xs mt-3 pt-3 border-t border-gray-100">
                           {plan.recruiter_compensation && (
                             <span className="text-gray-700 font-medium">{formatComp(plan.recruiter_compensation, plan.recruiter_compensation_type, plan.total_fee)}</span>
                           )}
                           {plan.warranty_period_days && (
                             <span className="text-gray-700 font-medium">{plan.warranty_period_days} ימים</span>
                           )}
                         </div>
                       );
                     })()}
                    </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(job)}
                      className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => toggleCloseMutation.mutate(job)}
                      disabled={toggleCloseMutation.isPending}
                      className="px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {job.is_closed ? 'פתח מחדש' : 'סגור'}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(job.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JobFormModal
        job={selectedJob}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </EmployerLayout>
  );
}