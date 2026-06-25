import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, Bookmark } from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import { useAuth } from '@/lib/AuthContext';

export default function SavedJobs() {
  const { user } = useAuth();

  const { data: saved = [] } = useQuery({
    queryKey: ['saved-jobs', user?.email],
    queryFn: () => base44.entities.SavedJob.filter({ user_email: user.email }, '-created_date', 50),
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
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-purple-400" /> משרות שמורות
          </h1>
          {saved.length > 0 && <p className="text-gray-400 text-base mt-3">{saved.length} משרות שמורות</p>}
        </div>

        {saved.length === 0 ? (
          <div className="text-center py-24">
            <Bookmark className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <p className="text-gray-300 text-xl font-semibold">עדיין לא שמרת משרות</p>
            <p className="text-gray-500 text-base mt-2">שמור משרות שמעניינות אותך כדי לחזור אליהן בקלות</p>
            <Link to="/jobs" className="text-cyan-300 font-bold text-base mt-6 inline-block hover:text-purple-300 transition-colors">עיין במשרות זמינות →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {saved.map((s) => (
              <Link
                key={s.id}
                to={`/jobs/${s.job_id}`}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/20 hover:bg-white/15 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors text-lg line-clamp-2">
                      {s.job_title}
                    </h3>
                    <p className="text-base text-cyan-300 font-semibold mt-1">{s.company}</p>
                  </div>
                  <Bookmark className="w-6 h-6 text-purple-400 fill-purple-400 flex-shrink-0" />
                </div>
                <p className="text-gray-300 text-sm font-medium">צפה בפרטים המלאים →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}