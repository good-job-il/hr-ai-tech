import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Pin, Eye, EyeOff, Trash2, Plus, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const VISIBILITY_CONFIG = {
  internal:         { icon: Lock,    label: 'פנימי', color: 'text-[#64748B]', bg: 'bg-[#F0F1F5]' },
  employer_visible: { icon: Eye,     label: 'גלוי למעסיק', color: 'text-green-700', bg: 'bg-green-50' },
  all:              { icon: Eye,     label: 'גלוי לכל', color: 'text-blue-700', bg: 'bg-blue-50' },
};

const TYPE_LABELS = {
  general: 'כללי', interview_feedback: 'משוב ראיון',
  status_change: 'שינוי סטטוס', document_request: 'בקשת מסמך', system: 'מערכת',
};

export default function CandidateNotesPanel({ notes, onAddNote, onUpdateNote, onDeleteNote, userRole }) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('internal');
  const [noteType, setNoteType] = useState('general');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onAddNote({ content: content.trim(), visibility, note_type: noteType, is_pinned: isPinned });
    setContent('');
    setShowForm(false);
    setSaving(false);
  };

  const pinned = notes.filter(n => n.is_pinned);
  const regular = notes.filter(n => !n.is_pinned);

  return (
    <div>
      {/* Add Note Button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#E4ECFF] text-[#94A3B8] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all text-sm font-semibold mb-4">
          <Plus className="w-4 h-4" /> הוסף הערה
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-[#F7F8FC] rounded-xl p-4 mb-4 border border-[#E4ECFF]">
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="כתוב הערה..."
            className="mb-3 min-h-[80px] bg-white"
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Visibility */}
            {['internal', 'employer_visible'].map(v => {
              const cfg = VISIBILITY_CONFIG[v];
              const Ico = cfg.icon;
              return (
                <button key={v} onClick={() => setVisibility(v)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${visibility === v ? `${cfg.bg} ${cfg.color} border-current` : 'border-[#E4ECFF] text-[#94A3B8] hover:bg-[#F0F1F5]'}`}>
                  <Ico className="w-3 h-3" />{cfg.label}
                </button>
              );
            })}
            {/* Type */}
            <select value={noteType} onChange={e => setNoteType(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E4ECFF] bg-white text-[#64748B]">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {/* Pin */}
            <button onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${isPinned ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'border-[#E4ECFF] text-[#94A3B8]'}`}>
              <Pin className="w-3 h-3" /> {isPinned ? 'מוצמד' : 'הצמד'}
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || saving}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs">
              {saving ? 'שומר...' : 'שמור הערה'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setContent(''); }} className="text-xs">
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Pinned Notes */}
      {pinned.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-black text-[#94A3B8] uppercase tracking-wide mb-2 flex items-center gap-1">
            <Pin className="w-3 h-3 text-yellow-500" /> מוצמדות
          </div>
          <div className="space-y-2">
            {pinned.map(note => <NoteCard key={note.id} note={note} onDelete={onDeleteNote} onUpdate={onUpdateNote} />)}
          </div>
        </div>
      )}

      {/* Regular Notes */}
      <div className="space-y-2">
        {regular.length === 0 && pinned.length === 0 && (
          <div className="text-center py-8 text-[#94A3B8]">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">אין הערות עדיין</p>
          </div>
        )}
        {regular.map(note => <NoteCard key={note.id} note={note} onDelete={onDeleteNote} onUpdate={onUpdateNote} />)}
      </div>
    </div>
  );
}

function NoteCard({ note, onDelete, onUpdate }) {
  const cfg = VISIBILITY_CONFIG[note.visibility] || VISIBILITY_CONFIG.internal;
  const Ico = cfg.icon;

  return (
    <div className={`rounded-xl p-4 border ${note.is_pinned ? 'border-yellow-200 bg-yellow-50/50' : 'border-[#E4ECFF] bg-white'} group`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[#1F2937] leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onUpdate?.(note.id, { is_pinned: !note.is_pinned })}
            className={`p-1.5 rounded-lg hover:bg-yellow-100 transition-colors ${note.is_pinned ? 'text-yellow-600' : 'text-[#94A3B8]'}`}>
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete?.(note.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-xs font-bold text-[#7C3AED]">{note.author_name || note.author_email}</span>
        <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
          <Ico className="w-3 h-3" />{cfg.label}
        </span>
        {note.note_type && note.note_type !== 'general' && (
          <span className="text-xs bg-[#EEF4FF] text-[#4F46E5] px-2 py-0.5 rounded-full font-semibold">
            {TYPE_LABELS[note.note_type] || note.note_type}
          </span>
        )}
        {note.created_date && (
          <span className="text-xs text-[#CBD5E1]">
            {format(new Date(note.created_date), 'dd MMM, HH:mm', { locale: he })}
          </span>
        )}
      </div>
    </div>
  );
}