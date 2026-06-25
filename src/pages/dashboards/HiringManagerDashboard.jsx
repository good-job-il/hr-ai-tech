import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/employer/EmployerLayout';
import { Link } from 'react-router-dom';
import { Briefcase, Users, TrendingUp, Settings } from 'lucide-react';

export default function HiringManagerDashboard() {
  const { user } = useAuth();

  const { data: jobs = [] } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => base44.entities.Job.filter({ employer_id: user?.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['all-applications'],
    queryFn: () => base44.entities.Application.list('-created_date', 100),
    enabled: !!user,
  });

  const myApplications = allApplications.filter(app => jobs.some(j => j.id === app.job_id));

  const stats = {
    jobs: jobs.filter(j => !j.is_closed).length,
    applications: myApplications.length,
    hired: myApplications.filter(a => a.status === 'hired').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">דשבורד מנהל גיוס</h1>
          <p className="text-gray-400">ניהול תפקידים וגיוס</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">משרות פתוחות</p>
                <p className="text-3xl font-bold text-white">{stats.jobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">מועמדויות סה"כ</p>
                <p className="text-3xl font-bold text-white">{stats.applications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">שכורים</p>
                <p className="text-3xl font-bold text-white">{stats.hired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/employer/jobs" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <Briefcase className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">ניהול משרות</h3>
                <p className="text-gray-400 text-sm">צור וערוך משרות</p>
              </div>
            </div>
          </Link>

          <Link to="/employer/candidates" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">מועמדים</h3>
                <p className="text-gray-400 text-sm">צפה בכל המועמדויות</p>
              </div>
            </div>
          </Link>

          <Link to="/employer/settings" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <Settings className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">הגדרות</h3>
                <p className="text-gray-400 text-sm">ניהול צוות והרשאות</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}