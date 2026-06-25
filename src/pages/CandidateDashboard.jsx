import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/home/Navbar';
import { FileText, Bookmark, Send, Bell, Settings, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ['my-applications', user?.email],
    queryFn: () => base44.entities.Application.filter({ candidate_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: saved = [] } = useQuery({
    queryKey: ['saved-jobs', user?.email],
    queryFn: () => base44.entities.SavedJob.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.CandidateProfile.filter({ user_email: user.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  const newApps = applications.filter(a => a.status === 'new').length;
  const inProgress = applications.filter(a => ['reviewed', 'phone_interview', 'recommended', 'employer_interview'].includes(a.status)).length;
  const hiredApps = applications.filter(a => a.status === 'hired').length;

  const stats = [
    { label: 'מועמדויות חדשות', value: newApps, icon: Send, color: 'from-blue-50 to-blue-100 text-blue-600' },
    { label: 'בתהליך גיוס', value: inProgress, icon: Clock, color: 'from-purple-50 to-purple-100 text-purple-600' },
    { label: 'התקבלו לעבודה', value: hiredApps, icon: CheckCircle, color: 'from-green-50 to-green-100 text-green-600' },
    { label: 'משרות שמורות', value: saved.length, icon: Bookmark, color: 'from-orange-50 to-orange-100 text-orange-600' },
  ];

  const menuItems = [
    { label: 'הפרופיל שלי', path: '/my-profile', icon: FileText, desc: 'עדכן מידע אישי וניסיון' },
    { label: 'קורות החיים שלי', path: '/resumes', icon: FileText, desc: 'נהל קורות חיים' },
    { label: 'המועמדויות שלי', path: '/my-applications', icon: Send, desc: 'עקוב אחרי הגשות' },
    { label: 'משרות שמורות', path: '/saved-jobs', icon: Bookmark, desc: 'צפה במשרות שנשמרו' },
    { label: 'התראות', path: '/job-alerts', icon: Bell, desc: 'קבל התראות על משרות חדשות' },
    { label: 'הגדרות החשבון', path: '/settings', icon: Settings, desc: 'נהל הגדרות חשבון' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <Navbar />
      
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">דשבורד אישי</h1>
          <p className="text-gray-600 text-sm mt-2">שלום {user?.full_name || 'מועמד/ת'}, ברוך/ה חזרת!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((s) => (
            <Link key={s.label} to={s.label === 'מועמדויות חדשות' ? '/my-applications' : s.label === 'בתהליך גיוס' ? '/my-applications' : s.label === 'התקבלו לעבודה' ? '/my-applications' : '/saved-jobs'}
              className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-105 transition-all group cursor-pointer`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-white bg-opacity-80 ${s.color.split(' ')[2]}`}>
                  <s.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-600 mt-2 font-medium group-hover:text-gray-900 transition-colors">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-hhblue" />
              ניהול הפרופיל שלך
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}
                className="p-4 rounded-xl border border-gray-200 hover:border-hhblue/50 hover:bg-blue-50/30 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hhblue/10 flex items-center justify-center flex-shrink-0 group-hover:bg-hhblue/20 transition-colors">
                    <item.icon className="w-5 h-5 text-hhblue" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-hhblue transition-colors">{item.label}</h3>
                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 text-lg">מועמדויות אחרונות</h2>
            <Link to="/my-applications" className="text-hhblue hover:text-hhblue/80 text-sm font-medium">צפה בהכל →</Link>
          </div>
          {applications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">עדיין לא הגשת מועמדויות</p>
              <Link to="/jobs" className="text-hhblue text-sm font-medium mt-2 inline-block hover:underline">עיין במשרות →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {applications.slice(0, 5).map((app) => {
                const statusLabels = {
                  new: 'נשלחה', reviewed: 'סינון בוצע', phone_interview: 'ראיון טלפוני',
                  recommended: 'הומלץ', employer_interview: 'בראיון', offer: 'הצעה',
                  hired: 'התקבלת!', rejected: 'לא התקדמה'
                };
                const statusColors = {
                  new: 'bg-blue-50 text-blue-600', reviewed: 'bg-cyan-50 text-cyan-600',
                  phone_interview: 'bg-indigo-50 text-indigo-600', recommended: 'bg-purple-50 text-purple-600',
                  employer_interview: 'bg-violet-50 text-violet-600', offer: 'bg-green-50 text-green-600',
                  hired: 'bg-emerald-50 text-emerald-600', rejected: 'bg-red-50 text-red-600'
                };
                return (
                  <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{app.job_title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{app.company}</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ml-4 ${statusColors[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}