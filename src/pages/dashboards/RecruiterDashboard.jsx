import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import EmployerLayout from '@/components/employer/EmployerLayout';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, BarChart3, Sparkles, ArrowUpRight, CheckCircle2 } from 'lucide-react';

const glassCard = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(220,235,255,0.7)',
  boxShadow: '0 8px 32px rgba(79,124,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="relative overflow-hidden rounded-lg p-7" style={glassCard}>
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-[0.06]"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#CBD5E1]" />
      </div>
      <p className="text-[#64748B] text-sm font-medium mb-1">{label}</p>
      <p className="text-4xl font-black text-[#0F172A] leading-none">{value}</p>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc, color }) {
  return (
    <Link to={to} className="group rounded-lg p-7 flex items-center gap-5 transition-all hover:-translate-y-1"
      style={{ ...glassCard, textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 16px 48px rgba(79,124,255,0.12), inset 0 1px 0 rgba(255,255,255,0.9)`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,124,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)'}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: `${color}15` }}>
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
      <div>
        <h3 className="font-black text-[#0F172A] text-lg">{title}</h3>
        <p className="text-[#64748B] text-sm font-medium mt-0.5">{desc}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-[#CBD5E1] mr-auto transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
    </Link>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const { data: applications = [] } = useQuery({
    queryKey: ['recruiter-applications', user?.id],
    queryFn: async () => {
      return base44.entities.Application.filter({
        organization_id: user?.organization_id,
        recruiter_id: user?.id,
      }, '-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['recruiter-interviews', user?.id],
    queryFn: async () => {
      return base44.entities.Interview.filter({
        organization_id: user?.organization_id,
        recruiter_id: user?.id,
        status: 'scheduled',
      }, '-date', 50);
    },
    enabled: !!user,
  });

  const stats = {
    applications: applications.length,
    reviewed: applications.filter(a => a.status !== 'new').length,
    interviews: interviews.length,
  };

  return (
    <EmployerLayout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #F8FBFF 0%, #F3F0FF 40%, #EFF8FF 100%)' }}>
        <div className="fixed top-32 left-16 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(108,77,255,0.08) 0%, transparent 70%)', zIndex: 0 }} />
        <div className="fixed bottom-32 right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', zIndex: 0 }} />

        <div className="relative z-10 px-6 lg:px-8 xl:px-10 py-10 space-y-10 max-w-[1600px] mx-auto" dir="rtl">

          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4"
              style={{ background: 'rgba(108,77,255,0.08)', color: '#6C4DFF', border: '1px solid rgba(108,77,255,0.15)' }}>
              <Sparkles className="w-3.5 h-3.5" /> דשבורד מגייס
            </div>
            <h1 className="text-4xl font-black text-[#0F172A] leading-tight">
              שלום{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-[#64748B] text-lg mt-2 font-medium">ניהול מועמדים וראיונות</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={Users} label="מועמדים בטיפול" value={stats.applications} color="#6C4DFF" />
            <StatCard icon={CheckCircle2} label="נבדקו" value={stats.reviewed} color="#2F80FF" />
            <StatCard icon={Calendar} label="ראיונות קרובים" value={stats.interviews} color="#10B981" />
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-black text-[#0F172A] text-xl mb-6">גישה מהירה</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <QuickLink to="/employer/candidates" icon={Users} title="מועמדים" desc="ניהול מועמדים בתפקידים" color="#6C4DFF" />
              <QuickLink to="/employer/kanban" icon={BarChart3} title="לוח קנבן" desc="ניהול זרימת הגיוס" color="#2F80FF" />
              <QuickLink to="/recruiter/recruitment" icon={FileText} title="דשבורד גיוס" desc="נתונים וניתוחים" color="#06B6D4" />
              <QuickLink to="/employer/messages" icon={Calendar} title="הודעות" desc="תקשורת עם מועמדים" color="#10B981" />
            </div>
          </div>

          {/* Recent Applications */}
          {applications.length > 0 && (
            <div className="rounded-lg p-8" style={glassCard}>
              <h2 className="font-black text-[#0F172A] mb-8">מועמדויות אחרונות שלי</h2>
              <div className="space-y-3">
                {applications.slice(0, 5).map(app => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-[#F8FBFF]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm"
                        style={{ background: 'linear-gradient(135deg, #6C4DFF, #2F80FF)' }}>
                        {app.candidate_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A]">{app.candidate_name}</p>
                        <p className="text-sm text-[#64748B]">{app.job_title}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(108,77,255,0.1)', color: '#6C4DFF' }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
}
