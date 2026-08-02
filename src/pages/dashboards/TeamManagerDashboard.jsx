import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/employer/EmployerLayout';
import { Link } from 'react-router-dom';
import { Users, FileText, Clock, MessageSquare } from 'lucide-react';

export default function TeamManagerDashboard() {
  const { user } = useAuth();

  const { data: teamApplications = [] } = useQuery({
    queryKey: ['team-applications', user?.id],
    queryFn: async () => {
      return base44.entities.Application.filter({
        organization_id: user?.organization_id,
        team_manager_id: user?.id,
      }, '-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: teamInterviews = [] } = useQuery({
    queryKey: ['team-interviews', user?.id],
    queryFn: async () => {
      return base44.entities.Interview.filter({
        organization_id: user?.organization_id,
        team_manager_id: user?.id,
        status: 'scheduled',
      }, '-date');
    },
    enabled: !!user,
  });

  const stats = {
    candidates: teamApplications.length,
    inProgress: teamApplications.filter(a => ['phone_interview', 'recommended', 'employer_interview'].includes(a.status)).length,
    interviews: teamInterviews.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[#0f1629] to-background" dir="rtl">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">דשבורד מנהל צוות</h1>
          <p className="text-gray-400">ניהול צוות הגיוס והמועמדויות</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">מועמדים בטיפול</p>
                <p className="text-3xl font-bold text-white">{stats.candidates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">בתהליך</p>
                <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
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
          <Link to="/employer/candidates" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">צוות וגיוס</h3>
                <p className="text-gray-400 text-sm">ניהול המועמדויות של הצוות</p>
              </div>
            </div>
          </Link>

          <Link to="/employer/messages" className="bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <MessageSquare className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-white font-bold text-lg">התכתבות</h3>
                <p className="text-gray-400 text-sm">הודעות למועמדים</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
