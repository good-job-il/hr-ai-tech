import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmployerLayout from '@/components/employer/EmployerLayout';
import InterviewScheduler from '@/components/interviews/InterviewScheduler';
import { Search, Users, Calendar } from 'lucide-react';
import { logError } from '@/lib/errorHandler';
import ErrorAlert from '@/components/common/ErrorAlert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const statusOptions = [
  { value: 'new', label: 'חדש' },
  { value: 'contacted', label: 'יצור קשר' },
  { value: 'interview', label: 'ראיון' },
  { value: 'offer', label: 'הצעה' },
  { value: 'hired', label: 'התקבל' },
  { value: 'rejected', label: 'דחוי' },
  { value: 'inactive', label: 'לא פעיל' },
];

export default function EmployerCandidates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [error, setError] = useState('');

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['employer-candidates', user?.email],
    queryFn: async () => {
      try {
        const result = await base44.entities.Candidate.filter({ employer_id: user?.email }, '-created_date', 500);
        return result || [];
      } catch (err) {
        logError(err, 'fetch-employer-candidates');
        setError('שגיאה בטעינת המועמדים');
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ candidateId, newStatus }) => {
      return base44.entities.Candidate.update(candidateId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer-candidates'] });
    },
    onError: (err) => {
      logError(err, 'update-candidate-status');
      setError('שגיאה בעדכון הסטטוס');
    },
  });

  // Filter candidates
  const filtered = candidates.filter((candidate) => {
    const matchesSearch = candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.email && candidate.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.phone && candidate.phone.includes(searchTerm)) ||
      (candidate.location && candidate.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || candidate.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <EmployerLayout>
        <LoadingSpinner text="טוען מועמדים..." />
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

         <div>
           <h1 className="text-3xl font-bold text-gray-900">מועמדים</h1>
           <p className="text-gray-500 text-sm mt-1">{filtered.length} מועמדים</p>
         </div>

         {/* Search and Filter */}
         <div className="flex gap-3">
           <div className="flex-1 relative">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input
               placeholder="חיפוש לפי שם, אימייל, טלפון או עיר..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
             />
           </div>
           <select
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30"
           >
             <option value="">כל הסטטוסים</option>
             {statusOptions.map((opt) => (
               <option key={opt.value} value={opt.value}>
                 {opt.label}
               </option>
             ))}
           </select>
         </div>

         {/* Candidates List */}
         {filtered.length === 0 ? (
           <EmptyState
             icon={Users}
             title="אין מועמדים עדיין"
             description="כאשר תיבא מועמדים או יגישו מועמדויות, הם יופיעו כאן"
           />
         ) : (
           <div className="space-y-3">
             {filtered.map((candidate) => {
               const statusOpt = statusOptions.find((s) => s.value === candidate.status);
               return (
                 <div
                   key={candidate.id}
                   className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all"
                 >
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1">
                       <h3 className="font-semibold text-gray-900">{candidate.full_name}</h3>
                       {candidate.role_name && <p className="text-sm text-gray-600 mt-1">{candidate.role_name}</p>}
                       <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                         {candidate.email && <span>{candidate.email}</span>}
                         {candidate.phone && <span>• {candidate.phone}</span>}
                         {candidate.location && <span>• {candidate.location}</span>}
                       </div>
                       <p className="text-xs text-gray-400 mt-1">
                         נוסף {new Date(candidate.created_date).toLocaleDateString('he-IL')}
                       </p>
                     </div>

                     <div className="flex items-center gap-2">
                       <select
                         value={candidate.status}
                         onChange={(e) => updateStatusMutation.mutate({ candidateId: candidate.id, newStatus: e.target.value })}
                         disabled={updateStatusMutation.isPending}
                         className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 disabled:opacity-50"
                       >
                         {statusOptions.map((opt) => (
                           <option key={opt.value} value={opt.value}>
                             {opt.label}
                           </option>
                         ))}
                       </select>
                       <button
                         onClick={() => setSelectedApp(candidate)}
                         className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:text-hhblue hover:border-hhblue transition-colors"
                         title="הזמן ראיון"
                       >
                         <Calendar className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         )}

        {/* Interview Scheduler Modal */}
         {selectedApp && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
             <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
               <h2 className="text-xl font-bold text-gray-900">הזמן ראיון</h2>
               <p className="text-sm text-gray-600">{selectedApp.full_name}</p>
               <button
                 onClick={() => setSelectedApp(null)}
                 className="w-full border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
               >
                 סגור
               </button>
             </div>
           </div>
         )}
      </div>
    </EmployerLayout>
  );
}