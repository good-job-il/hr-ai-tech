import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Send, Calendar } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import { useAuth } from '@/lib/AuthContext';

const statusLabels = {
  new: 'נשלחה',
  reviewed: 'סינון בוצע',
  phone_interview: 'ראיון טלפוני בוצע',
  recommended: 'הומלץ למעסיק',
  employer_interview: 'בראיון אצל מעסיק',
  offer: 'התקבלה הצעה',
  hired: 'התקבלת!',
  probation: 'בתקופת אחריות',
  completed: 'עבר תקופת אחריות',
  rejected: 'לא התקדמה'
};
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
  rejected: 'bg-red-100 text-red-700'
};

export default function MyApplications() {
  const { user } = useAuth();
  const [selectedInterview, setSelectedInterview] = useState(null);

  const { data: applications = [] } = useQuery({
    queryKey: ['my-applications', user?.email],
    queryFn: () => base44.entities.Application.filter({ candidate_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['my-interviews', user?.email],
    queryFn: () => base44.entities.Interview.filter({ candidate_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 py-12">
        <div className="mb-12">
          <Link to="/" className="text-cyan-300 hover:text-purple-300 text-sm font-medium flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4" /> חזרה לעמוד הבית
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3" style={{ background: 'linear-gradient(to right, #67e8f9, #d8b4fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            <Send className="w-8 h-8 text-purple-400" /> המועמדויות שלי
          </h1>
          {applications.length > 0 && <p className="text-gray-400 text-base mt-3">{applications.length} מועמדויות בסה"כ</p>}
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-24">
            <Send className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <p className="text-gray-300 text-xl font-semibold">עדיין לא הגשת מועמדויות</p>
            <p className="text-gray-500 text-base mt-2">התחל בהגשת מועמדות למשרות שמעניינות אותך</p>
            <Link to="/jobs" className="text-cyan-300 font-bold text-base mt-6 inline-block hover:text-purple-300 transition-colors">עיין במשרות זמינות →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app) => (
              <div key={app.id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/15 p-6 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/20 hover:bg-white/15 transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg line-clamp-2">{app.job_title}</h3>
                    <p className="text-base text-cyan-300 font-semibold mt-1">{app.company}</p>
                  </div>
                  <span className={`text-xs px-3.5 py-1.5 rounded-lg font-bold flex-shrink-0 whitespace-nowrap ${
                    app.status === 'new' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    app.status === 'reviewed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    app.status === 'phone_interview' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    app.status === 'recommended' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
                    app.status === 'employer_interview' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    app.status === 'offer' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    app.status === 'hired' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    app.status === 'completed' ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30' :
                    'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {statusLabels[app.status]}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-4">📅 {new Date(app.created_date).toLocaleDateString('he-IL')}</p>
                
                {(app.status === 'phone_interview' || app.status === 'employer_interview') && (
                  <div className="mb-4">
                    {interviews
                      .filter(i => i.application_id === app.id)
                      .map(interview => (
                        <div key={interview.id} className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 text-sm text-purple-300 font-semibold cursor-pointer hover:bg-purple-500/30 transition-all" onClick={() => setSelectedInterview(interview)}>
                          🎉 ראיון זומן - {new Date(interview.date).toLocaleDateString('he-IL')} בשעה {interview.time}
                        </div>
                      ))
                    }
                  </div>
                )}
                {app.status === 'offer' && (
                  <div className="mb-4 bg-green-500/20 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 font-semibold">
                    💼 התקבלה הצעה עבודה! בדוק את המייל.
                  </div>
                )}
                {app.status === 'hired' && (
                  <div className="mb-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-sm text-emerald-300 font-semibold">
                    🏆 כל הכבוד! התחלת עבודה!
                  </div>
                )}
                {app.status === 'completed' && (
                  <div className="mb-4 bg-lime-500/20 border border-lime-500/30 rounded-xl p-3 text-sm text-lime-300 font-semibold">
                    ✅ עברת בהצלחה את תקופת האחריות!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">פרטי הראיון</h2>
              <button onClick={() => setSelectedInterview(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">משרה</div>
                <div className="text-sm text-gray-900 font-semibold">{selectedInterview.job_title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">📅 תאריך</div>
                  <div className="text-sm text-gray-900">{new Date(selectedInterview.date).toLocaleDateString('he-IL')}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">🕐 שעה</div>
                  <div className="text-sm text-gray-900">{selectedInterview.time}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">סוג</div>
                <div className="text-sm text-gray-900">
                  {selectedInterview.type === 'video' && '🎥 וידאו'}
                  {selectedInterview.type === 'phone' && '☎️ טלפון'}
                  {selectedInterview.type === 'in_person' && '🏢 פגישה פיזית'}
                </div>
              </div>
              {selectedInterview.location_or_link && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {selectedInterview.type === 'in_person' ? 'כתובת' : 'קישור'}
                  </div>
                  {selectedInterview.type === 'in_person' ? (
                    <div className="text-sm text-gray-900">{selectedInterview.location_or_link}</div>
                  ) : (
                    <a href={selectedInterview.location_or_link} target="_blank" rel="noopener noreferrer" className="text-sm text-hhblue hover:underline break-all">
                      {selectedInterview.location_or_link}
                    </a>
                  )}
                </div>
              )}
              {selectedInterview.notes && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">הערות</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{selectedInterview.notes}</div>
                </div>
              )}
              <button onClick={() => setSelectedInterview(null)} className="w-full bg-hhblue text-white py-2 rounded-lg text-sm font-semibold hover:bg-hhblue/90">
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}