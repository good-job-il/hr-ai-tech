import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Video, Phone, Users as UsersIcon } from 'lucide-react';

export default function InterviewScheduler({ applicationId, jobTitle, candidateName, candidateEmail, jobId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'video',
    location_or_link: ''
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data) => {
      const interview = await base44.entities.Interview.create({
        ...data,
        application_id: applicationId,
        job_id: jobId,
        job_title: jobTitle,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        status: 'scheduled'
      });

      await base44.integrations.Core.SendEmail({
        to: candidateEmail,
        subject: `📅 הזמנה לראיון - ${jobTitle}`,
        body: `שלום ${candidateName},\n\nנשמח להזמינך לראיון:\n\nתאריך: ${data.date}\nשעה: ${data.time}\nסוג: ${data.type}\n${data.location_or_link ? `קישור/מקום: ${data.location_or_link}` : ''}\n\nבהצלחה!`
      });

      return interview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setShowForm(false);
      setFormData({ date: '', time: '', type: 'video', location_or_link: '' });
    }
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4" dir="rtl">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-hhblue text-white py-2 rounded-lg font-semibold hover:bg-hhblue/90"
        >
          📅 הזמן ראיון
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">שעה</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">סוג ראיון</label>
            <div className="flex gap-2">
              {[
                { value: 'video', label: 'וידאו', icon: Video },
                { value: 'phone', label: 'טלפון', icon: Phone },
                { value: 'in_person', label: 'פנים אל פנים', icon: UsersIcon }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setFormData(prev => ({ ...prev, type: value }))}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.type === value ? 'bg-hhblue text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {formData.type !== 'in_person' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">קישור</label>
              <input
                type="text"
                value={formData.location_or_link}
                onChange={(e) => setFormData(prev => ({ ...prev, location_or_link: e.target.value }))}
                placeholder="https://zoom.us/..."
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              />
            </div>
          )}

          {formData.type === 'in_person' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">מקום</label>
              <input
                type="text"
                value={formData.location_or_link}
                onChange={(e) => setFormData(prev => ({ ...prev, location_or_link: e.target.value }))}
                placeholder="כתובת הציאה"
                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              ביטול
            </button>
            <button
              onClick={() => scheduleMutation.mutate(formData)}
              disabled={!formData.date || !formData.time || scheduleMutation.isPending}
              className="flex-1 bg-hhblue text-white py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90 disabled:opacity-50"
            >
              {scheduleMutation.isPending ? 'שמירה...' : 'הזמן'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}