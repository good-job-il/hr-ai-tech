import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCandidateCRM } from '@/hooks/useCandidateCRM';
import { useAuth } from '@/lib/AuthContext';
import CandidateProfileHeader from '@/components/crm/candidate/CandidateProfileHeader';
import CandidateTimeline from '@/components/crm/candidate/CandidateTimeline';
import CandidateNotesPanel from '@/components/crm/candidate/CandidateNotesPanel';
import InterviewsPanel from '@/components/crm/candidate/InterviewsPanel';
import RecruiterWorkspacePanel from '@/components/crm/candidate/RecruiterWorkspacePanel';
import DocumentsPanel from '@/components/crm/candidate/DocumentsPanel';
import ApplicationsPanel from '@/components/crm/candidate/ApplicationsPanel';
import WhatsAppPanel from '@/components/crm/candidate/WhatsAppPanel';
import { ArrowRight, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'overview',    label: 'סקירה' },
  { id: 'notes',       label: 'הערות' },
  { id: 'interviews',  label: 'ראיונות' },
  { id: 'applications',label: 'מועמדויות' },
  { id: 'documents',   label: 'מסמכים' },
  { id: 'whatsapp',    label: '💬 WhatsApp' },
  { id: 'timeline',    label: 'היסטוריה' },
];

export default function CandidateCRMPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Get candidateId from query param: /crm/candidate?id=xxx
  const params = new URLSearchParams(location.search);
  const candidateId = params.get('id');

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`האם למחוק את המועמד לצמיתות? פעולה זו תמחק גם את כל המועמדויות, הראיונות, ההערות והמסמכים הקשורים. לא ניתן לבטל.`)) return;
    setDeleting(true);
    await base44.functions.invoke('deleteCandidate', { candidate_id: candidateId });
    navigate(-1);
  };

  const crm = useCandidateCRM(candidateId);
  const {
    candidate, notes, interviews, timeline, tags, documents, communications, applications,
    loading, timelineLoading, commsLoading, error, reload,
    loadTimeline, loadCommunications,
    addNote, updateNote, deleteNote,
    scheduleInterview, updateInterview,
    updateStatus, assignRecruiter,
    addTag, removeTag,
    uploadDocument, sendToEmployer, requestDocuments,
  } = crm;

  // Lazy-load timeline/communications only when tab is opened
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId === 'timeline' || tabId === 'overview') loadTimeline();
    if (tabId === 'whatsapp') loadCommunications();
  }, [loadTimeline, loadCommunications]);

  if (!candidateId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#94A3B8]">
        <AlertCircle className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-bold text-lg">לא נבחר מועמד</p>
        <p className="text-sm mt-1">נווט דרך רשימת המועמדים</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-40 bg-[#F0F1F5] rounded-2xl" />
        <div className="h-12 bg-[#F0F1F5] rounded-xl" />
        <div className="h-64 bg-[#F0F1F5] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p className="font-bold">שגיאה בטעינת נתונים</p>
        <p className="text-sm mt-1 text-[#94A3B8]">{error}</p>
        <button onClick={reload} className="mt-4 flex items-center gap-2 text-sm font-bold text-[#7C3AED] hover:underline">
          <RefreshCw className="w-4 h-4" /> נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="bg-[#F7F8FC] -m-6 p-0">
      {/* Back Button */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-bold text-[#64748B] hover:text-[#7C3AED] transition-colors">
            <ArrowRight className="w-4 h-4" /> חזרה
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> {deleting ? 'מוחק...' : 'מחק מועמד'}
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 max-w-7xl mx-auto">
        {/* Profile Header */}
        <CandidateProfileHeader
          candidate={candidate}
          tags={tags}
          applications={applications}
          onStatusChange={updateStatus}
          onAssignSuccess={reload}
        />

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 mt-4 bg-white rounded-xl border border-[#E4ECFF] p-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-fit text-sm font-bold px-3 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#7C3AED] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F0F1F5]'}`}>
              {tab.label}
              {tab.id === 'notes' && notes.length > 0 && (
                <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-[#E4ECFF] text-[#7C3AED]'}`}>{notes.length}</span>
              )}
              {tab.id === 'interviews' && interviews.length > 0 && (
                <span className={`mr-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-[#E4ECFF] text-[#7C3AED]'}`}>{interviews.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary */}
                  {candidate?.summary && (
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A] mb-2">סיכום</h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">{candidate.summary}</p>
                    </div>
                  )}
                  {/* Previous Companies */}
                  {candidate?.previous_companies?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A] mb-2">חברות קודמות</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.previous_companies.map((c, i) => (
                          <span key={i} className="text-sm bg-[#F7F8FC] border border-[#E4ECFF] text-[#64748B] font-semibold px-3 py-1.5 rounded-lg">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Languages */}
                  {candidate?.languages?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-[#0F172A] mb-2">שפות</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.languages.map((l, i) => (
                          <span key={i} className="text-sm bg-[#EEF4FF] text-[#4F46E5] font-semibold px-3 py-1.5 rounded-lg">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Recent Timeline */}
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A] mb-3">פעילות אחרונה</h3>
                    <CandidateTimeline timeline={timeline.slice(0, 5)} loading={false} />
                  </div>
                </div>
              )}
              {activeTab === 'notes' && (
                <CandidateNotesPanel
                  notes={notes}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  userRole={user?.role}
                />
              )}
              {activeTab === 'interviews' && (
                <InterviewsPanel
                  interviews={interviews}
                  onSchedule={scheduleInterview}
                  onUpdate={updateInterview}
                />
              )}
              {activeTab === 'applications' && (
                <ApplicationsPanel applications={applications} />
              )}
              {activeTab === 'documents' && (
                <DocumentsPanel
                  documents={documents}
                  candidate={candidate}
                  onUpload={uploadDocument}
                />
              )}
              {activeTab === 'whatsapp' && (
                <WhatsAppPanel
                  candidate={candidate}
                  communications={communications}
                  onAddCommunication={reload}
                  loading={commsLoading}
                />
              )}
              {activeTab === 'timeline' && (
                <CandidateTimeline timeline={timeline} loading={timelineLoading} />
              )}
            </div>
          </div>

          {/* Sidebar — Recruiter Workspace */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
              <h3 className="text-sm font-black text-[#0F172A] mb-4">פעולות מגייס</h3>
              <RecruiterWorkspacePanel
                candidate={candidate}
                documents={documents}
                tags={tags}
                job={applications[0] || null}
                onUpdateStatus={updateStatus}
                onAssignRecruiter={assignRecruiter}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onSendToEmployer={sendToEmployer}
                onRequestDocuments={requestDocuments}
                userRole={user?.role}
                currentUser={user}
                onReload={reload}
              />
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-[#E4ECFF] p-5">
              <h3 className="text-sm font-black text-[#0F172A] mb-3">סטטיסטיקה</h3>
              <div className="space-y-2">
                {[
                  { label: 'מועמדויות', value: applications.length },
                  { label: 'ראיונות', value: interviews.length },
                  { label: 'הערות', value: notes.length },
                  { label: 'מסמכים', value: documents.length },
                  { label: 'אירועי ציר זמן', value: timeline.length },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between py-1.5 border-b border-[#F0F1F5] last:border-0">
                    <span className="text-xs font-semibold text-[#64748B]">{stat.label}</span>
                    <span className="text-sm font-black text-[#0F172A]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}