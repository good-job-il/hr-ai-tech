import React, { useState } from 'react';
import { X, FileText, Mail, Phone, ExternalLink, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_OPTIONS = [
  { value: 'new', label: 'מועמד חדש' },
  { value: 'reviewed', label: 'סינון בוצע' },
  { value: 'phone_interview', label: 'ראיון טלפוני בוצע' },
  { value: 'recommended', label: 'הומלץ למעסיק' },
  { value: 'employer_interview', label: 'עבר ראיון אצל מעסיק' },
  { value: 'offer', label: 'הוצעה עבודה' },
  { value: 'hired', label: 'התחיל עבודה' },
  { value: 'probation', label: 'בתקופת אחריות' },
  { value: 'completed', label: 'עבר תקופת אחריות' },
  { value: 'rejected', label: 'נדחה' },
];

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-cyan-100 text-cyan-700',
  phone_interview: 'bg-indigo-100 text-indigo-700',
  recommended: 'bg-purple-100 text-purple-700',
  employer_interview: 'bg-violet-100 text-violet-700',
  offer: 'bg-green-100 text-green-700',
  hired: 'bg-emerald-100 text-emerald-700',
  probation: 'bg-teal-100 text-teal-700',
  completed: 'bg-lime-100 text-lime-700',
  rejected: 'bg-red-100 text-red-700',
};

const sourceLabels = { app: 'אפליקציה', linkedin: 'LinkedIn', facebook: 'Facebook', jobsite: 'אתר דרושים', other: 'אחר' };

export default function CandidateDetailModal({ application: app, onClose, onStatusChange }) {
   const [notes, setNotes] = useState(app.notes || '');
   const [editingNotes, setEditingNotes] = useState(false);
   const queryClient = useQueryClient();

   const updateMutation = useMutation({
     mutationFn: ({ id, data }) => base44.entities.Application.update(id, data),
     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employer-applications'] }),
   });

   const handleSaveNotes = () => {
     updateMutation.mutate({ id: app.id, data: { notes } });
     setEditingNotes(false);
   };

   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{app.candidate_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[app.status]}`}>
              {STATUS_OPTIONS.find(s => s.value === app.status)?.label}
            </span>
            <span className="text-xs text-gray-400">{sourceLabels[app.source]}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="text-xs font-medium text-gray-500">פרטי קשר</div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <a href={`mailto:${app.candidate_email}`} className="hover:text-hhblue">{app.candidate_email}</a>
            </div>
            {app.candidate_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${app.candidate_phone}`} className="hover:text-hhblue">{app.candidate_phone}</a>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">משרה</div>
            <div className="text-sm text-gray-700">{app.job_title}</div>
          </div>

          {app.cover_letter && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">מכתב מקדים</div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{app.cover_letter}</p>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> הערות פנימיות
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="הוסף הערות פנימיות..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-hhblue/30 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateMutation.isPending}
                    className="text-xs bg-hhblue text-white px-3 py-1.5 rounded-lg hover:bg-hhblue/90 disabled:opacity-50"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => { setEditingNotes(false); setNotes(app.notes || ''); }}
                    className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setEditingNotes(true)}
                className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors min-h-12 flex items-center"
              >
                {notes || <span className="text-gray-400">לחץ להוסיף הערות...</span>}
              </div>
            )}
          </div>

          {app.resume_url && (
            <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-hhblue/10 text-hhblue px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-hhblue/20 w-full justify-center">
              <FileText className="w-4 h-4" /> פתח קורות חיים <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">שנה סטטוס</div>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => onStatusChange(app.id, s.value)}
                  className={`text-xs py-1.5 rounded-lg font-medium border transition-colors ${app.status === s.value ? statusColors[s.value] + ' border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}