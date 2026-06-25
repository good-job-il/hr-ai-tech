import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Tag, X, AlertTriangle, FileText, UserCheck } from 'lucide-react';
import RecruiterDropdown from './RecruiterDropdown';
import RejectModal from './RejectModal';
import SendToEmployerModal from './SendToEmployerModal';
import AssignToJobModal from './AssignToJobModal';

const STATUS_OPTIONS = [
  { value: 'new',       label: 'חדש',           color: '#2563EB' },
  { value: 'contacted', label: 'פנייה נשלחה',   color: '#F59E0B' },
  { value: 'interview', label: 'בראיון',         color: '#8B5CF6' },
  { value: 'offer',     label: 'הצעה',           color: '#F97316' },
  { value: 'hired',     label: 'גויס',           color: '#10B981' },
  { value: 'inactive',  label: 'לא פעיל',        color: '#94A3B8' },
];

const PRESET_TAGS = ['מומלץ', 'Senior', 'Junior', 'Mid-Level', 'דחוף', 'VIP', 'Passive', 'Open to Relocation', 'Remote Only'];

const DOC_REQUESTS = ['קורות חיים מעודכנים', 'תעודות השכלה', 'המלצות', 'תיק עבודות', 'אחר'];

export default function RecruiterWorkspacePanel({ candidate, documents, tags, onUpdateStatus, onAssignRecruiter, onAddTag, onRemoveTag, onSendToEmployer, onRequestDocuments, userRole, currentUser, onReload }) {
  const [tagInput, setTagInput] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocRequest, setShowDocRequest] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [docRequestType, setDocRequestType] = useState('');
  const [saving, setSaving] = useState({});

  const setSavingKey = (key, val) => setSaving(p => ({ ...p, [key]: val }));

  const handleStatus = async (status) => {
    setSavingKey('status', true);
    await onUpdateStatus(status);
    setSavingKey('status', false);
  };

  const handleAddTag = async (tag) => {
    if (!tag.trim()) return;
    setSavingKey('tag', true);
    await onAddTag(tag.trim());
    setTagInput('');
    setSavingKey('tag', false);
  };



  const handleReject = async (reason) => {
    await onUpdateStatus('rejected', reason);
    setShowRejectModal(false);
  };

  const handleRequestDocuments = async () => {
    if (!docRequestType) return;
    setSavingKey('docReq', true);
    await onRequestDocuments?.(docRequestType);
    setDocRequestType('');
    setShowDocRequest(false);
    setSavingKey('docReq', false);
  };

  const canSendToEmployer = ['recruiter', 'team_manager', 'recruitment_manager', 'admin'].includes(userRole);

  return (
    <div className="space-y-5">
      {/* Status */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">סטטוס מועמד</div>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handleStatus(opt.value)}
              disabled={saving.status}
              className={`text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all ${candidate?.status === opt.value ? 'text-white shadow-sm' : 'text-[#64748B] border-[#E4ECFF] hover:border-current bg-white'}`}
              style={candidate?.status === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : {}}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">תגיות</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t.id} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${t.color || '#7C3AED'}15`, color: t.color || '#7C3AED', border: `1px solid ${t.color || '#7C3AED'}40` }}>
              {t.tag}
              <button onClick={() => onRemoveTag(t.id, t.tag)} className="hover:opacity-70 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag(tagInput)}
            placeholder="תגית חדשה..." className="text-xs h-8 flex-1" />
          <Button size="sm" onClick={() => handleAddTag(tagInput)} disabled={!tagInput.trim() || saving.tag}
            className="h-8 text-xs bg-[#7C3AED] text-white hover:bg-[#6D28D9]">
            <Tag className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESET_TAGS.filter(pt => !tags.find(t => t.tag === pt)).map(pt => (
            <button key={pt} onClick={() => handleAddTag(pt)}
              className="text-xs text-[#94A3B8] hover:text-[#7C3AED] px-2 py-1 rounded-full hover:bg-[#EEF4FF] transition-all border border-dashed border-[#E4ECFF] hover:border-[#7C3AED]">
              + {pt}
            </button>
          ))}
        </div>
      </div>

      {/* Assign Recruiter — Dropdown */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">מגייס אחראי</div>
        <RecruiterDropdown
          currentEmail={candidate?.recruiter_id}
          onSelect={(email, name) => onAssignRecruiter(email, name)}
        />
      </div>

      {/* Request Documents */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">בקשת מסמכים</div>
        {!showDocRequest ? (
          <button onClick={() => setShowDocRequest(true)}
            className="w-full flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-[#2563EB] px-4 py-2.5 rounded-xl border border-dashed border-[#E4ECFF] hover:border-[#2563EB] transition-all">
            <FileText className="w-4 h-4" /> בקש מסמך מהמועמד
          </button>
        ) : (
          <div className="space-y-2 bg-[#EFF6FF] rounded-xl p-3 border border-blue-100">
            <div className="grid grid-cols-1 gap-1.5">
              {DOC_REQUESTS.map(d => (
                <button key={d} onClick={() => setDocRequestType(d)}
                  className={`text-xs font-semibold text-right px-3 py-2 rounded-lg border transition-all ${docRequestType === d ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-[#E4ECFF] text-[#374151] hover:border-blue-300'}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleRequestDocuments} disabled={!docRequestType || saving.docReq}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1">
                {saving.docReq ? 'שולח...' : 'שלח בקשה'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDocRequest(false)} className="h-8 text-xs">ביטול</Button>
            </div>
          </div>
        )}
      </div>

      {/* Assign to Job (General Pool) */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">שיוך למשרה</div>
        <button onClick={() => setShowAssignModal(true)}
          className="w-full flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-[#8B5CF6] px-4 py-2.5 rounded-xl border border-dashed border-[#E4ECFF] hover:border-[#8B5CF6] transition-all">
          <UserCheck className="w-4 h-4" /> שייך מועמד למשרה
        </button>
      </div>

      {/* Send to Employer */}
      {canSendToEmployer && (
        <div>
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">שליחה למעסיק</div>
          <button onClick={() => setShowSendModal(true)}
            className="w-full flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-[#10B981] px-4 py-2.5 rounded-xl border border-dashed border-[#E4ECFF] hover:border-[#10B981] transition-all">
            <Send className="w-4 h-4" /> שלח למעסיק
          </button>
        </div>
      )}

      {/* Assign to Job Modal */}
      {showAssignModal && (
        <AssignToJobModal
          candidate={candidate}
          onClose={() => setShowAssignModal(false)}
          onAssignSuccess={() => {
            setShowAssignModal(false);
            if (onReload) onReload();
          }}
        />
      )}

      {/* Send to Employer Modal */}
      {showSendModal && (
        <SendToEmployerModal
          candidate={candidate}
          documents={documents || []}
          job={null} // Can be passed from parent if needed
          onClose={() => setShowSendModal(false)}
          onSuccess={() => setShowSendModal(false)}
        />
      )}

      {/* Reject */}
      <div>
        <button onClick={() => setShowRejectModal(true)}
          disabled={candidate?.status === 'rejected' || saving.status}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 px-4 py-2.5 rounded-xl border border-dashed border-red-200 hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-40">
          <AlertTriangle className="w-4 h-4" /> דחה מועמד
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          candidateName={candidate?.full_name}
          onConfirm={handleReject}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
}