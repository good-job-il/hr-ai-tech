import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Calendar } from 'lucide-react';

export default function InterviewModal({ application: app, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: '',
    time: '',
    type: 'video',
    location_or_link: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      alert('יש למלא תאריך ושעה');
      return;
    }
    setLoading(true);
    const user = await base44.auth.me();
    await base44.entities.Interview.create({
      ...form,
      application_id: app.id,
      job_id: app.job_id,
      job_title: app.job_title,
      employer_id: user.email,
      candidate_name: app.candidate_name,
      candidate_email: app.candidate_email,
      status: 'scheduled',
    });
    await base44.entities.Application.update(app.id, { status: 'phone_interview' });
    
    // Send email to candidate
    await base44.integrations.Core.SendEmail({
      to: app.candidate_email,
      subject: `ראיון מוזמן - ${app.job_title}`,
      body: `שלום ${app.candidate_name},\n\nמזל טוב! זמנו אתך לראיון עבור תפקיד ${app.job_title} ב${app.company}.\n\nפרטי הראיון:\nתאריך: ${form.date}\nשעה: ${form.time}\nסוג: ${form.type === 'video' ? 'וידאו' : form.type === 'phone' ? 'טלפון' : 'פיזי'}\n${form.location_or_link ? `קישור/כתובת: ${form.location_or_link}\n` : ''}\n${form.notes ? `הערות: ${form.notes}\n` : ''}\nבהצלחה!`
    });
    
    setLoading(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">תזמון ראיון</h2>
            <p className="text-xs text-gray-500 mt-0.5">{app.candidate_name} · {app.job_title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">תאריך *</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">שעה *</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">סוג ראיון</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30">
              <option value="video">וידאו (Zoom/Meet)</option>
              <option value="phone">טלפון</option>
              <option value="in_person">פגישה פיזית</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {form.type === 'in_person' ? 'כתובת' : 'קישור לפגישה'}
            </label>
            <input value={form.location_or_link} onChange={e => setForm({ ...form, location_or_link: e.target.value })} placeholder={form.type === 'in_person' ? 'תל אביב, רחוב...' : 'https://zoom.us/...'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">הערות</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hhblue/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">ביטול</button>
            <button type="submit" disabled={loading} className="flex-1 bg-hhblue text-white py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              {loading ? 'שומר...' : 'קבע ראיון'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}