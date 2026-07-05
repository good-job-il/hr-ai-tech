import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { httpClient } from '@/api/client/httpClient';
import { ArrowRight, Bookmark, Send, FileText, Download } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import { useAuth } from '@/lib/AuthContext';

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

export default function MyProfile() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  const statusLabels = {
    new: t('candidate.applications.status.new'),
    reviewed: t('candidate.applications.status.reviewed'),
    phone_interview: t('candidate.applications.status.phone_interview'),
    recommended: t('candidate.applications.status.recommended'),
    employer_interview: t('candidate.applications.status.employer_interview'),
    offer: t('candidate.applications.status.offer'),
    hired: t('candidate.applications.status.hired'),
    probation: t('candidate.applications.status.probation'),
    completed: t('candidate.applications.status.completed'),
    rejected: t('candidate.applications.status.rejected'),
  };
  const [activeTab, setActiveTab] = useState('saved');
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Saved jobs
  const { data: saved = [] } = useQuery({
    queryKey: ['saved-jobs', user?.email],
    queryFn: () => httpClient.get(`/jobs/saved?user_email=${encodeURIComponent(user.email)}&sort=created_date&order=DESC&limit=50`, { cache: false }),
    enabled: !!user,
  });

  // Applications
  const { data: applications = [] } = useQuery({
    queryKey: ['my-applications', user?.email],
    queryFn: () => httpClient.get(`/applications?candidate_email=${encodeURIComponent(user.email)}&sort=created_date&order=DESC&limit=50`, { cache: false }),
    enabled: !!user,
  });

  // Interviews
  const { data: interviews = [] } = useQuery({
    queryKey: ['my-interviews', user?.email],
    queryFn: () => httpClient.get(`/interviews?candidate_email=${encodeURIComponent(user.email)}&sort=created_date&order=DESC&limit=50`, { cache: false }),
    enabled: !!user,
  });

  // Resumes
  const { data: myResumes = [] } = useQuery({
    queryKey: ['my-resumes', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const profiles = await httpClient.get(`/candidates/profiles?user_email=${encodeURIComponent(user.email)}`, { cache: false });
      const arr = Array.isArray(profiles) ? profiles : (profiles?.data || []);
      const profile = arr[0];
      if (!profile || !profile.resume_url) return [];
      return [{
        id: profile.id,
        name: user.full_name,
        email: user.email,
        url: profile.resume_url,
        job: profile.title || 'קורות חיים',
        date: profile.updated_date,
      }];
    },
    enabled: !!user,
  });

  const tabs = [
    { id: 'saved', label: 'משרות שמורות', icon: Bookmark, count: saved.length },
    { id: 'applications', label: 'המועמדויות שלי', icon: Send, count: applications.length },
    { id: 'resumes', label: 'קורות חיים', icon: FileText, count: myResumes.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <Navbar />
      <div className="max-w-[900px] mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-hhblue hover:text-hhblue/80 text-sm font-medium flex items-center gap-1 mb-2">
            <ArrowRight className="w-4 h-4" /> חזרה לעמוד הבית
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">האזור האישי שלי</h1>
          <p className="text-gray-500 text-sm mt-2">צפייה בחיפוש העבודה שלך במקום אחד</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-hhblue text-hhblue'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Saved Jobs Tab */}
        {activeTab === 'saved' && (
          <div>
            {saved.length === 0 ? (
              <div className="text-center py-24">
                <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg">עדיין לא שמרת משרות</p>
                <Link to="/jobs" className="text-hhblue font-medium text-sm mt-3 inline-block hover:underline">
                  עיין במשרות זמינות →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {saved.map((s) => (
                  <Link
                    key={s.id}
                    to={`/jobs/${s.job_id}`}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:border-hhblue/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-hhblue transition-colors">{s.job_title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{s.company}</p>
                    </div>
                    <Bookmark className="w-5 h-5 text-hhblue fill-hhblue flex-shrink-0 ml-4" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            {applications.length === 0 ? (
              <div className="text-center py-24">
                <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg">עדיין לא הגשת מועמדויות</p>
                <Link to="/jobs" className="text-hhblue font-medium text-sm mt-3 inline-block hover:underline">
                  עיין במשרות זמינות →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{app.job_title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{app.company}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          הוגשה {new Date(app.created_date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0 whitespace-nowrap ${statusColors[app.status]}`}>
                        {statusLabels[app.status]}
                      </span>
                    </div>
                    {(app.status === 'phone_interview' || app.status === 'employer_interview') && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {interviews
                          .filter(i => i.application_id === app.id)
                          .map(interview => (
                            <div key={interview.id} className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700 font-medium cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setSelectedInterview(interview)}>
                              🎉 זומנת לראיון - {new Date(interview.date).toLocaleDateString('he-IL')} בשעה {interview.time}
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {app.status === 'offer' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-green-50/50 rounded-lg p-3 text-sm text-green-700 font-medium">
                        💼 התקבלה הצעה עבודה! בדוק/י את המייל לפרטים.
                      </div>
                    )}
                    {app.status === 'hired' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-emerald-50/50 rounded-lg p-3 text-sm text-emerald-700 font-medium">
                        🏆 כל הכבוד! התחלת עבודה!
                      </div>
                    )}
                    {app.status === 'completed' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-lime-50/50 rounded-lg p-3 text-sm text-lime-700 font-medium">
                        ✅ עברת בהצלחה את תקופת האחריות!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === 'resumes' && (
          <div>
            {myResumes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">📄 העלה קורות חיים בפרופיל שלך</p>
                <Link to="/my-profile" className="text-hhblue font-medium text-sm mt-3 inline-block hover:underline">
                  עדכן את הפרופיל שלך →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myResumes.map((resume) => (
                  <div key={resume.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-hhblue/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-hhblue" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{resume.name}</h3>
                        <p className="text-sm text-gray-600 truncate mt-0.5">{resume.job}</p>
                        <p className="text-xs text-gray-500 mt-1">{resume.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
                        title="הורד קובץ"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
