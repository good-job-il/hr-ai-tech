/**
 * SendToEmployerModal
 * Full email composition modal for sending a candidate to an employer.
 * Includes: To, CC, Subject, recruiter note, document selection, preview, send.
 */
import { useState, useMemo } from 'react';
import { X, Send, Eye, Paperclip, CheckSquare, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { candidateCrmService } from '@/api/services/candidateCrmService';
import { useTranslation } from 'react-i18next';

export default function SendToEmployerModal({ candidate, documents, job, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';
  const isRTL = currentLang === 'he';
  
  const DOC_TYPE_LABELS = {
    cv: t('candidateCRM.sendToEmployer.docTypes.cv'),
    cover_letter: t('candidateCRM.sendToEmployer.docTypes.cover_letter'),
    portfolio: t('candidateCRM.sendToEmployer.docTypes.portfolio'),
    certificate: t('candidateCRM.sendToEmployer.docTypes.certificate'),
    contract: t('candidateCRM.sendToEmployer.docTypes.contract'),
    id: t('candidateCRM.sendToEmployer.docTypes.id'),
    other: t('candidateCRM.sendToEmployer.docTypes.other'),
  };

  const [to, setTo] = useState(candidate?.employer_id || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(t('candidateCRM.sendToEmployer.defaultSubject', { 
    name: candidate?.full_name || '', 
    job: job?.title ? ` — ${job.title}` : '' 
  }));
  const [recruiterNote, setRecruiterNote] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const allDocs = useMemo(() => {
    const docs = [];
    const primaryCvUrl = candidate?.original_resume_url || candidate?.resume_url;
    if (primaryCvUrl) {
      docs.push({
        id: '__original_cv',
        url: primaryCvUrl,
        filename: candidate.original_resume_filename || candidate.resume_filename || t('candidateCRM.sendToEmployer.resumeFile'),
        doc_type: 'cv',
        badge: candidate.original_file_type?.toUpperCase() || 'CV',
      });
    }
    if (candidate?.converted_resume_url && candidate.converted_resume_url !== primaryCvUrl) {
      docs.push({
        id: '__converted_cv',
        url: candidate.converted_resume_url,
        filename: candidate.converted_resume_filename || t('candidateCRM.sendToEmployer.resumeDocx'),
        doc_type: 'cv',
        badge: 'DOCX',
      });
    }
    documents.forEach(doc => {
      docs.push({
        id: doc.id,
        url: doc.file_url || doc.original_file_url,
        filename: doc.filename || doc.original_filename || t('candidateCRM.sendToEmployer.document'),
        doc_type: doc.doc_type,
        badge: doc.doc_type === 'cv' ? 'CV' : null,
      });
    });
    return docs;
  }, [candidate, documents, t]);

  const [selectedDocs, setSelectedDocs] = useState(() => {
    const firstCv = allDocs.find(d => d.doc_type === 'cv');
    return firstCv ? new Set([firstCv.id]) : new Set();
  });

  const toggleDoc = (id) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedDocsList = allDocs.filter(d => selectedDocs.has(d.id));
  const hasCV = selectedDocsList.some(d => d.doc_type === 'cv');

  const handleSend = async () => {
    if (!to.trim()) return;
    if (!hasCV) { alert(t('candidateCRM.sendToEmployer.mustAttachCV')); return; }

    setSending(true);
    setResult(null);
    try {
      if (!job?.id) throw new Error(t('candidateCRM.sendToEmployer.selectJob', { defaultValue: 'Select a job first' }));
      const res = await candidateCrmService.presentCandidate(candidate.id, job.id, recruiterNote);
      setResult({ success: true, message: res?.message || t('candidateCRM.sendToEmployer.sentSuccessfully') });
      if (onSuccess) onSuccess();
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || t('candidateCRM.sendToEmployer.sendError');
      setResult({ success: false, message: errorMsg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/50" onClick={!sending ? onClose : undefined} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECFF] bg-gradient-to-l from-[#F3EFFF] to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#2F80FF] flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0F172A]">{t('candidateCRM.sendToEmployer.title')}</h2>
              <p className="text-xs text-[#7C3AED] font-semibold">{candidate?.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={sending}
            className="w-8 h-8 rounded-xl border border-[#E4ECFF] flex items-center justify-center text-[#64748B] hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.success
              ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            <p className={`text-sm font-bold ${result.success ? 'text-green-700' : 'text-red-600'}`}>{result.message}</p>
            {result.success && (
              <Button size="sm" variant="ghost" onClick={onClose} className="mr-auto text-xs">{t('candidateCRM.sendToEmployer.close')}</Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 font-semibold">
                  <p className="font-bold mb-0.5">{t('candidateCRM.sendToEmployer.infoTitle')}</p>
                  <p>{t('candidateCRM.sendToEmployer.infoDescription', { email: user?.email || t('candidateCRM.sendToEmployer.recruiter') })}</p>
                  {job?.title && <p className="mt-1">{t('candidateCRM.sendToEmployer.jobInfo', { title: job.title })}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-black text-[#94A3B8] w-12 text-right flex-shrink-0">{t('candidateCRM.sendToEmployer.to')}:</label>
              <Input value={to} onChange={e => setTo(e.target.value)}
                placeholder="employer@company.com"
                className="flex-1 text-sm h-9" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-black text-[#94A3B8] w-12 text-right flex-shrink-0">{t('candidateCRM.sendToEmployer.cc')}:</label>
              <Input value={cc} onChange={e => setCc(e.target.value)}
                placeholder={t('candidateCRM.sendToEmployer.ccPlaceholder')}
                className="flex-1 text-sm h-9" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-black text-[#94A3B8] w-12 text-right flex-shrink-0">{t('candidateCRM.sendToEmployer.subject')}:</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)}
                className="flex-1 text-sm h-9" />
            </div>
          </div>

          {/* Recruiter note */}
          <div>
            <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">{t('candidateCRM.sendToEmployer.recruiterNote')}</div>
            <textarea
              value={recruiterNote}
              onChange={e => setRecruiterNote(e.target.value)}
              placeholder={t('candidateCRM.sendToEmployer.notePlaceholder')}
              rows={3}
              className="w-full text-sm border border-[#E4ECFF] rounded-xl p-3 resize-none outline-none focus:border-[#C4B5FD] text-[#1F2937]"
            />
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-[#94A3B8]" />
              <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide">{t('candidateCRM.sendToEmployer.documentsToAttach')}</div>
              {!hasCV && selectedDocs.size > 0 && (
                <span className="text-xs text-orange-600 font-bold">{t('candidateCRM.sendToEmployer.cvRequired')}</span>
              )}
            </div>
            {allDocs.length === 0 ? (
              <p className="text-sm text-[#94A3B8] py-3 text-center">{t('candidateCRM.sendToEmployer.noDocuments')}</p>
            ) : (
              <div className="space-y-2">
                {allDocs.map(doc => {
                  const checked = selectedDocs.has(doc.id);
                  return (
                    <button key={doc.id} onClick={() => toggleDoc(doc.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-right ${checked ? 'border-[#7C3AED] bg-[#F3EFFF]' : 'border-[#E4ECFF] bg-white hover:border-[#C4B5FD]'}`}>
                      {checked
                        ? <CheckSquare className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                        : <Square className="w-4 h-4 text-[#CBD5E1] flex-shrink-0" />}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-sm font-bold text-[#0F172A] truncate">{doc.filename}</div>
                        <div className="text-xs text-[#94A3B8]">{DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}</div>
                      </div>
                      {doc.badge && (
                        <span className="text-xs bg-[#EEF4FF] text-[#4F46E5] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          {doc.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-[#F7F8FC] border border-[#E4ECFF] rounded-xl p-4">
              <div className="text-xs font-black text-[#94A3B8] uppercase mb-3 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" /> {t('candidateCRM.sendToEmployer.preview')}
              </div>
              <div className="text-xs text-[#374151] leading-relaxed font-mono whitespace-pre-wrap">
                {t('candidateCRM.sendToEmployer.previewContent', {
                  to,
                  cc: cc || '—',
                  subject,
                  name: candidate?.full_name,
                  email: candidate?.email || '',
                  note: recruiterNote,
                  documents: selectedDocsList.map(d => `• ${d.filename}`).join('\n')
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E4ECFF] flex items-center justify-between gap-3 bg-[#F7F8FC]">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-semibold">
            <Paperclip className="w-3.5 h-3.5" />
            {t('candidateCRM.sendToEmployer.documentsSelected', { count: selectedDocs.size })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}
              className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              {preview ? t('candidateCRM.sendToEmployer.hidePreview') : t('candidateCRM.sendToEmployer.showPreview')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={sending} className="text-xs">
              {t('candidateCRM.sendToEmployer.cancel')}
            </Button>
            <Button size="sm" onClick={handleSend}
              disabled={sending || !to.trim() || !hasCV}
              className="bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold text-xs gap-2 px-5">
              {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('candidateCRM.sendToEmployer.sending')}</> : result?.success ? <><CheckCircle2 className="w-3.5 h-3.5" /> {t('candidateCRM.sendToEmployer.sendAgain')}</> : <><Send className="w-3.5 h-3.5" /> {t('candidateCRM.sendToEmployer.sendEmail')}</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
