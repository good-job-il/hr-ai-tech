/**
 * WhatsAppPanel
 * WhatsApp deep links + manual conversation logging in CRM.
 * Opens real WhatsApp (web or app) with pre-filled message.
 * Recruiter manually logs the conversation outcome.
 */
import { useState } from 'react';
import { MessageCircle, Plus, Clock, CheckCircle2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const MESSAGE_TEMPLATES = [
  {
    id: 'intro',
    label: 'היכרות ראשונה',
    text: (name) => `שלום ${name},\nאני מגייס של HeadHunter ואשמח לדבר איתך על הזדמנות מעניינת בתחומך.\nמתי נוח לדבר?`,
  },
  {
    id: 'interview',
    label: 'זימון לראיון',
    text: (name) => `שלום ${name},\nאשמח לתאם איתך ראיון טלפוני קצר.\nמה הזמינות שלך השבוע?`,
  },
  {
    id: 'followup',
    label: 'follow-up',
    text: (name) => `שלום ${name},\nרציתי לבדוק אם קיבלת את הפרטים ששלחתי.\nיש שאלות?`,
  },
  {
    id: 'offer',
    label: 'הצעה',
    text: (name) => `שלום ${name},\nיש לי עדכון טוב — יש הצעה לתפקיד שדיברנו עליו.\nנוח לדבר עכשיו?`,
  },
];

function buildWhatsAppUrl(phone, message) {
  const normalized = (phone || '').replace(/\D/g, '');
  const intlPhone = normalized.startsWith('0')
    ? '972' + normalized.slice(1)
    : normalized;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${intlPhone}?text=${encoded}`;
}

export default function WhatsAppPanel({ candidate, communications, onAddCommunication }) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [logSummary, setLogSummary] = useState('');
  const [logOutcome, setLogOutcome] = useState('sent');
  const [saving, setSaving] = useState(false);

  const phone = candidate?.phone;
  const name = candidate?.full_name?.split(' ')[0] || 'שלום';

  const activeMessage = selectedTemplate
    ? (customMsg || MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.text(name) || '')
    : customMsg;

  const waUrl = phone ? buildWhatsAppUrl(phone, activeMessage) : null;

  const handleOpenWA = () => {
    if (waUrl) {
      window.open(waUrl, '_blank');
      // Auto-open log form after opening WA
      setTimeout(() => setShowLog(true), 800);
    }
  };

  const handleLogConversation = async () => {
    if (!logSummary.trim()) return;
    setSaving(true);
    try {
      await base44.entities.CommunicationLog.create({
        candidate_id: candidate.id,
        candidate_email: candidate.email || '',
        channel: 'whatsapp',
        direction: 'outbound',
        sender_email: user?.email || '',
        sender_name: user?.full_name || '',
        content: logSummary,
        status: logOutcome,
      });
      // Also create timeline event
      await base44.entities.CandidateTimeline.create({
        candidate_id: candidate.id,
        candidate_email: candidate.email || '',
        event_type: 'message_sent',
        description: `WhatsApp — ${logOutcome === 'sent' ? 'שיחה' : logOutcome === 'read' ? 'נענה' : 'לא ענה'}: ${logSummary}`,
        performed_by: user?.email || '',
        performed_by_name: user?.full_name || '',
        performed_by_role: user?.role || 'recruiter',
        metadata: { channel: 'whatsapp', outcome: logOutcome },
        is_visible_to_candidate: false,
        is_visible_to_employer: false,
      });
      if (onAddCommunication) onAddCommunication();
      setLogSummary('');
      setShowLog(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const waCommunications = (communications || []).filter(c => c.channel === 'whatsapp');

  return (
    <div className="space-y-4">
      {/* Phone check */}
      {!phone && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs font-bold text-amber-700">אין מספר טלפון — הוסף מספר לפרופיל המועמד</p>
        </div>
      )}

      {/* Templates */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">תבניות הודעה</div>
        <div className="grid grid-cols-2 gap-1.5">
          {MESSAGE_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => {
              setSelectedTemplate(t.id);
              setCustomMsg(t.text(name));
            }}
              className={`text-xs font-bold px-3 py-2.5 rounded-xl border-2 transition-all text-right ${selectedTemplate === t.id ? 'border-[#25D366] bg-[#F0FDF4] text-[#15803D]' : 'border-[#E4ECFF] text-[#64748B] hover:border-[#25D366]/40'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message editor */}
      <div>
        <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">הודעה</div>
        <textarea
          value={customMsg}
          onChange={e => { setCustomMsg(e.target.value); setSelectedTemplate(null); }}
          placeholder="כתוב הודעה..."
          rows={4}
          className="w-full text-sm border border-[#E4ECFF] rounded-xl p-3 resize-none outline-none focus:border-[#25D366] text-[#1F2937]"
        />
      </div>

      {/* Send button */}
      <a
        href={waUrl || '#'}
        target="_blank"
        rel="noreferrer"
        onClick={e => { if (!phone || !activeMessage) e.preventDefault(); else handleOpenWA(); }}
        className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl font-bold text-sm transition-all ${
          phone && activeMessage
            ? 'bg-[#25D366] text-white hover:bg-[#22C55E] shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}>
        <MessageCircle className="w-4 h-4" />
        פתח ב-WhatsApp
      </a>

      {/* Manual log form */}
      {showLog ? (
        <div className="bg-[#F0FDF4] border border-green-200 rounded-xl p-4 space-y-3">
          <div className="text-xs font-black text-[#15803D]">📝 תעד את השיחה</div>
          <textarea
            value={logSummary}
            onChange={e => setLogSummary(e.target.value)}
            placeholder="מה דובר? תוצאת השיחה..."
            rows={2}
            className="w-full text-sm border border-green-200 rounded-xl p-3 resize-none outline-none focus:border-[#25D366]"
          />
          <div className="flex gap-2">
            {[
              { value: 'sent', label: 'שוחח' },
              { value: 'read', label: 'נענה' },
              { value: 'failed', label: 'לא ענה' },
            ].map(o => (
              <button key={o.value} onClick={() => setLogOutcome(o.value)}
                className={`flex-1 text-xs font-bold py-2 rounded-lg border-2 transition-all ${logOutcome === o.value ? 'border-[#25D366] bg-green-50 text-green-700' : 'border-[#E4ECFF] text-[#64748B]'}`}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleLogConversation} disabled={!logSummary.trim() || saving}
              className="flex-1 bg-[#25D366] hover:bg-[#22C55E] text-white text-xs">
              {saving ? 'שומר...' : 'שמור תיעוד'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowLog(false)} className="text-xs">ביטול</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowLog(true)}
          className="w-full flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-[#25D366] px-4 py-2.5 rounded-xl border border-dashed border-[#E4ECFF] hover:border-[#25D366] transition-all">
          <Plus className="w-4 h-4" /> תעד שיחת WhatsApp ידנית
        </button>
      )}

      {/* History */}
      {waCommunications.length > 0 && (
        <div>
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2">היסטוריה</div>
          <div className="space-y-2">
            {waCommunications.slice(0, 5).map((c, i) => (
              <div key={c.id || i} className="flex items-start gap-3 px-3 py-2.5 bg-white rounded-xl border border-[#E4ECFF]">
                <CheckCircle2 className="w-4 h-4 text-[#25D366] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1F2937] line-clamp-2">{c.content}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8]">{new Date(c.created_date).toLocaleDateString('he-IL')}</span>
                    {c.status && <span className="text-xs text-[#94A3B8]">· {c.status}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}