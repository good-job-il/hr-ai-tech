import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import EmployerLayout from '@/components/employer/EmployerLayout';
import { Users, TrendingUp, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6C4DFF', '#2F80FF', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const FUNNEL = [
  { key: 'new',       label: 'חדש',       color: '#6C4DFF', bg: 'rgba(108,77,255,0.1)'  },
  { key: 'contacted', label: 'יצור קשר', color: '#2F80FF', bg: 'rgba(47,128,255,0.1)'  },
  { key: 'interview', label: 'ראיון',     color: '#06B6D4', bg: 'rgba(6,182,212,0.1)'   },
  { key: 'offer',     label: 'הצעה',      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  { key: 'hired',     label: 'התקבל',     color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  { key: 'rejected',  label: 'דחוי',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
];

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="relative overflow-hidden rounded-lg p-7" style={{
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(220,235,255,0.7)',
      boxShadow: '0 8px 32px rgba(79,124,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    }}>
      <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full opacity-[0.06]"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#CBD5E1]" />
      </div>
      <p className="text-[#64748B] text-sm font-medium mb-1">{label}</p>
      <p className="text-4xl font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#94A3B8] mt-2 font-medium">{sub}</p>}
    </div>
  );
}

const glassCard = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(220,235,255,0.7)',
  boxShadow: '0 8px 32px rgba(79,124,255,0.07)',
};

const RecruitmentDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');

  const { data: candidates = [] } = useQuery({
    queryKey: ['recruitment-candidates', user?.email],
    queryFn: async () => (await base44.entities.Candidate.filter({ employer_id: user?.email }, '-created_date', 500)) || [],
    enabled: !!user?.email,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['recruitment-applications', user?.email],
    queryFn: async () => (await base44.entities.Application.filter({ employer_id: user?.email }, '-created_date', 500)) || [],
    enabled: !!user?.email,
  });

  const getDateRange = () => {
    const now = new Date();
    const days = { week: 7, month: 30, quarter: 90, year: 365 }[timeRange] || 30;
    return new Date(now.getTime() - days * 86400000);
  };

  const dateRange = getDateRange();
  const stats = {
    totalCandidates: candidates.length,
    newCandidates: candidates.filter(c => new Date(c.created_date) > dateRange).length,
    interviewCandidates: candidates.filter(c => c.status === 'interview').length,
    offerCandidates: candidates.filter(c => c.status === 'offer').length,
    hiredCandidates: candidates.filter(c => c.status === 'hired').length,
  };

  const statusDistribution = FUNNEL.map(f => ({
    name: f.label,
    value: candidates.filter(c => c.status === f.key).length,
  }));

  const dayCount = { week: 7, month: 30, quarter: 90, year: 365 }[timeRange] || 30;
  const timelineData = {};
  for (let i = dayCount; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('he-IL').substring(0, 5);
    timelineData[dateStr] = { date: dateStr, candidates: 0, applications: 0 };
  }
  candidates.forEach(c => {
    const d = new Date(c.created_date).toLocaleDateString('he-IL').substring(0, 5);
    if (timelineData[d]) timelineData[d].candidates += 1;
  });
  applications.forEach(a => {
    const d = new Date(a.created_date).toLocaleDateString('he-IL').substring(0, 5);
    if (timelineData[d]) timelineData[d].applications += 1;
  });
  const timelineChart = Object.values(timelineData);

  return (
    <EmployerLayout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #F8FBFF 0%, #F3F0FF 40%, #EFF8FF 100%)' }}>
        <div className="fixed top-32 right-16 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,77,255,0.07) 0%, transparent 70%)', zIndex: 0 }} />
        <div className="fixed bottom-24 left-24 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', zIndex: 0 }} />

        <div className="relative z-10 px-6 lg:px-8 xl:px-10 py-10 space-y-10 max-w-[1600px] mx-auto" dir="rtl">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4"
                style={{ background: 'rgba(108,77,255,0.08)', color: '#6C4DFF', border: '1px solid rgba(108,77,255,0.15)' }}>
                <Sparkles className="w-3.5 h-3.5" /> דשבורד גיוס
              </div>
              <h1 className="text-4xl font-black text-[#0F172A]">ניתוח מועמדים</h1>
              <p className="text-[#64748B] text-lg mt-1 font-medium">מעקב אחר תהליך הגיוס בזמן אמת</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-11 px-5 rounded-full text-sm font-bold outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(108,77,255,0.2)', color: '#6C4DFF', boxShadow: '0 2px 12px rgba(108,77,255,0.1)' }}
            >
              <option value="week">השבוע</option>
              <option value="month">החודש</option>
              <option value="quarter">הרבעון</option>
              <option value="year">השנה</option>
            </select>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard icon={Users} label='סה"כ מועמדים' value={stats.totalCandidates} sub={`+${stats.newCandidates} חדשים בתקופה`} color="#6C4DFF" />
            <KpiCard icon={AlertCircle} label="בראיון" value={stats.interviewCandidates} sub={`${stats.totalCandidates > 0 ? Math.round((stats.interviewCandidates/stats.totalCandidates)*100) : 0}% מסה״כ`} color="#2F80FF" />
            <KpiCard icon={TrendingUp} label="הצעות פעילות" value={stats.offerCandidates} color="#F59E0B" />
            <KpiCard icon={CheckCircle2} label="התקבלו" value={stats.hiredCandidates} color="#10B981" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="rounded-lg p-8" style={glassCard}>
              <h2 className="font-black text-[#0F172A] mb-2">מועמדים ומועמדויות</h2>
              <p className="text-[#94A3B8] text-sm font-medium mb-6">לפי תאריך יצירה</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={timelineChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', fontSize: 13 }} />
                  <Legend />
                  <Line type="monotone" dataKey="candidates" stroke="#6C4DFF" strokeWidth={2.5} dot={false} name="מועמדים חדשים" />
                  <Line type="monotone" dataKey="applications" stroke="#2F80FF" strokeWidth={2.5} dot={false} name="מועמדויות" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie */}
            <div className="rounded-lg p-8" style={glassCard}>
              <h2 className="font-black text-[#0F172A] mb-2">התפלגות סטטוסים</h2>
              <p className="text-[#94A3B8] text-sm font-medium mb-6">פי שלב בתהליך</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusDistribution.filter(s => s.value > 0)} cx="50%" cy="50%"
                    labelLine={false} label={({ name, value }) => `${name} (${value})`}
                    outerRadius={90} dataKey="value">
                    {statusDistribution.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel Summary */}
          <div className="rounded-lg p-8" style={glassCard}>
            <h2 className="font-black text-[#0F172A] mb-8">פאנל גיוס — סיכום סטטוסים</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {FUNNEL.map(f => {
                const count = candidates.filter(c => c.status === f.key).length;
                const pct = candidates.length > 0 ? Math.round((count / candidates.length) * 100) : 0;
                return (
                  <div key={f.key} className="rounded-lg p-5 text-center" style={{ background: f.bg }}>
                    <p className="text-xs font-bold mb-3" style={{ color: f.color }}>{f.label}</p>
                    <p className="text-3xl font-black text-[#0F172A]">{count}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
};

export default RecruitmentDashboard;