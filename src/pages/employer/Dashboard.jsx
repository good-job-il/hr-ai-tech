import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EmployerLayout from '@/components/employer/EmployerLayout';
import { Users, Briefcase, Eye, Send, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { logError } from '@/lib/errorHandler';
import ErrorAlert from '@/components/common/ErrorAlert';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const STATUS_LABELS = {
  new: 'New', reviewed: 'In Review', phone_interview: 'Phone Interview',
  employer_interview: 'Interview', offer: 'Offer', hired: 'Hired',
  probation: 'Probation', completed: 'Completed', rejected: 'Rejected'
};

const STATUS_COLORS = {
  new: '#6C4DFF', reviewed: '#2F80FF', phone_interview: '#06B6D4',
  employer_interview: '#8B5CF6', offer: '#F59E0B', hired: '#10B981', rejected: '#EF4444'
};

function StatCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-lg p-7 flex flex-col gap-4"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(220,235,255,0.7)',
        boxShadow: '0 8px 32px rgba(79,124,255,0.07), 0 1px 0 rgba(255,255,255,0.9) inset',
      }}>
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-[0.07]"
        style={{ background: gradient }} />
      <div className="flex items-start justify-between">
        <div className="w-13 h-13 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}14` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
      </div>
      <div>
        <p className="text-[#64748B] text-sm font-medium mb-1">{label}</p>
        <p className="text-4xl font-black text-[#0F172A] leading-none">{value}</p>
        {sub && <p className="text-xs text-[#94A3B8] mt-2 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [error, setError] = useState('');

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-jobs', user?.email],
    queryFn: async () => {
      try {
        return await base44.entities.Job.filter({ employer_id: user?.email }) || [];
      } catch (err) { logError(err, 'fetch-employer-jobs'); setError('Error loading jobs'); return []; }
    },
    enabled: !!user?.email,
  });

  const { data: applications = [], isLoading: appLoading } = useQuery({
    queryKey: ['employer-applications', user?.email],
    queryFn: async () => {
      try {
        return await base44.entities.Application.filter({ employer_id: user?.email }) || [];
      } catch (err) { logError(err, 'fetch-employer-applications'); return []; }
    },
    enabled: !!user?.email,
  });

  const loading = jobsLoading || appLoading;

  const stats = {
    jobs: jobs.length,
    applications: applications.length,
    views: jobs.reduce((sum, j) => sum + (j.views || 0), 0),
    newApplications: applications.filter(a => a.status === 'new').length,
  };

  const trendData = [
    { day: 'Mon', views: 45, applications: 12 },
    { day: 'Tue', views: 52, applications: 15 },
    { day: 'Wed', views: 48, applications: 10 },
    { day: 'Thu', views: 61, applications: 18 },
    { day: 'Fri', views: 55, applications: 14 },
    { day: 'Sat', views: 38, applications: 8 },
    { day: 'Sun', views: 67, applications: 22 }
  ];

  const statusBreakdown = [
    { name: 'New', value: applications.filter(a => a.status === 'new').length, color: '#6C4DFF' },
    { name: 'In Review', value: applications.filter(a => a.status === 'reviewed').length, color: '#2F80FF' },
    { name: 'Interview', value: applications.filter(a => ['phone_interview','employer_interview'].includes(a.status)).length, color: '#06B6D4' },
    { name: 'Offer', value: applications.filter(a => a.status === 'offer').length, color: '#F59E0B' },
    { name: 'Hired', value: applications.filter(a => a.status === 'hired').length, color: '#10B981' },
  ];

  if (loading) return <EmployerLayout><LoadingSpinner text="Loading dashboard..." /></EmployerLayout>;

  return (
    <EmployerLayout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #F8FBFF 0%, #F3F0FF 40%, #EFF8FF 100%)' }}>
        {/* Floating ambient blobs */}
        <div className="fixed top-32 left-16 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,77,255,0.08) 0%, transparent 70%)', zIndex: 0 }} />
        <div className="fixed bottom-32 right-16 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.07) 0%, transparent 70%)', zIndex: 0 }} />

        <div className="relative z-10 px-6 lg:px-8 xl:px-10 py-10 space-y-10 max-w-[1600px] mx-auto" dir="ltr">
          {error && <ErrorAlert error={error} onDismiss={() => setError('')} onRetry={() => window.location.reload()} />}

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4"
                style={{ background: 'rgba(108,77,255,0.08)', color: '#6C4DFF', border: '1px solid rgba(108,77,255,0.15)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Employer Dashboard
              </div>
              <h1 className="text-4xl font-black text-[#0F172A] leading-tight">
                Hello{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
              </h1>
              <p className="text-[#64748B] text-lg mt-2 font-medium">Here is a summary of your hiring activity</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Briefcase} label="Active Jobs" value={stats.jobs} color="#6C4DFF" gradient="linear-gradient(135deg,#6C4DFF,#2F80FF)" />
            <StatCard icon={Users} label="Total Applications" value={stats.applications} color="#2F80FF" gradient="linear-gradient(135deg,#2F80FF,#06B6D4)" />
            <StatCard icon={Eye} label="Total Views" value={stats.views.toLocaleString()} color="#06B6D4" gradient="linear-gradient(135deg,#06B6D4,#10B981)" />
            <StatCard icon={Send} label="New Applications" value={stats.newApplications} color="#F59E0B" gradient="linear-gradient(135deg,#F59E0B,#EF4444)"
              sub={stats.newApplications > 0 ? 'Awaiting review' : 'None pending'} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(220,235,255,0.7)',
              boxShadow: '0 8px 32px rgba(79,124,255,0.07)',
            }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(108,77,255,0.1)' }}>
                  <TrendingUp className="w-5 h-5 text-[#6C4DFF]" />
                </div>
                <div>
                  <h2 className="font-black text-[#0F172A]">This Week's Trend</h2>
                  <p className="text-xs text-[#94A3B8] font-medium">Views & Applications</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 13 }} />
                  <Line type="monotone" dataKey="views" stroke="#6C4DFF" strokeWidth={2.5} dot={false} name="Views" />
                  <Line type="monotone" dataKey="applications" stroke="#2F80FF" strokeWidth={2.5} dot={false} name="Applications" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Status Breakdown */}
            <div className="rounded-lg p-8" style={{
              background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(220,235,255,0.7)',
              boxShadow: '0 8px 32px rgba(79,124,255,0.07)',
            }}>
              <h2 className="font-black text-[#0F172A] mb-8">Status Breakdown</h2>
              <div className="space-y-5">
                {statusBreakdown.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#374151]">{s.name}</span>
                      <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(148,163,184,0.15)' }}>
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${stats.applications > 0 ? (s.value / stats.applications) * 100 : 0}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="rounded-lg p-8" style={{
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(220,235,255,0.7)',
            boxShadow: '0 8px 32px rgba(79,124,255,0.07)',
          }}>
            <h2 className="font-black text-[#0F172A] mb-8">Recent Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-16 text-[#94A3B8]">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">No applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(220,235,255,0.8)' }}>
                      {['Candidate', 'Position', 'Date', 'Status'].map(h => (
                        <th key={h} className="text-left pb-4 text-xs font-bold text-[#94A3B8] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 6).map((app) => (
                      <tr key={app.id} className="group" style={{ borderBottom: '1px solid rgba(220,235,255,0.4)' }}>
                        <td className="py-4 font-bold text-[#0F172A]">{app.candidate_name}</td>
                        <td className="py-4 text-[#64748B] font-medium">{app.job_title}</td>
                        <td className="py-4 text-[#94A3B8] text-sm">{new Date(app.created_date).toLocaleDateString('en-US')}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                            background: `${STATUS_COLORS[app.status] || '#6C4DFF'}14`,
                            color: STATUS_COLORS[app.status] || '#6C4DFF',
                          }}>
                            {STATUS_LABELS[app.status] || app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}