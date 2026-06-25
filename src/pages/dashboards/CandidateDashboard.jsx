import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/home/Navbar';
import { Link } from 'react-router-dom';
import { BriefcaseIcon, BookmarkIcon, MessageSquareIcon, FileTextIcon } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => base44.entities.Application.filter({ candidate_email: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => base44.entities.SavedJob.filter({ user_email: user?.email }, '-created_date', 5),
    enabled: !!user,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['my-interviews'],
    queryFn: () => base44.entities.Interview.filter({ candidate_email: user?.email }, '-date'),
    enabled: !!user,
  });

  const stats = {
    applications: applications.length,
    saved: savedJobs.length,
    interviews: interviews.filter(i => i.status === 'scheduled').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">דשבורד מועמד</h1>
          <p className="text-gray-400">ניהול הפרופיל וטיפול בהצעות עבודה</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">המועמדויות שלי</p>
                <p className="text-3xl font-bold text-white">{stats.applications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <BookmarkIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">משרות שמורות</p>
                <p className="text-3xl font-bold text-white">{stats.saved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">ראיונות קרובים</p>
                <p className="text-3xl font-bold text-white">{stats.interviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/my-applications" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <BriefcaseIcon className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">המועמדויות שלי</h3>
                <p className="text-gray-400 text-sm">צפה בסטטוס כל המועמדויות</p>
              </div>
            </div>
          </Link>

          <Link to="/my-profile" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <FileTextIcon className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">פרופיל וקורות חיים</h3>
                <p className="text-gray-400 text-sm">עדכן את הפרטים שלך</p>
              </div>
            </div>
          </Link>

          <Link to="/saved-jobs" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <BookmarkIcon className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">משרות שמורות</h3>
                <p className="text-gray-400 text-sm">משרות שסימנת כמעניינות</p>
              </div>
            </div>
          </Link>

          <Link to="/messages" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <MessageSquareIcon className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">הודעות</h3>
                <p className="text-gray-400 text-sm">התכתב עם מעסיקים</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}