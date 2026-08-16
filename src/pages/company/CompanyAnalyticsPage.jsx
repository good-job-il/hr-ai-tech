import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/api/services/jobService';
import { candidateService } from '@/api/services/candidateService';
import { interviewService } from '@/api/services/interviewService';
import { applicationService } from '@/api/services/applicationService';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Briefcase, Users, Calendar, CheckCircle2, TrendingUp, TrendingDown,
  Minus, BarChart3, FileText,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STALE = 3 * 60 * 1000;
const EMERALD = '#7C3AED';
const COLORS = ['#7C3AED', '#2563EB', '#059669', '#EA580C', '#0891B2', '#DC2626'];

const APPLICATION_STATUSES = [
  'new', 'phone_interview', 'recommended', 'employer_interview',
  'offer', 'probation', 'hired', 'rejected',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDateRange(range) {
  const now = new Date();
  const start = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const end = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return start(d); };

  const ranges = {
    week:    { from: daysAgo(6),   to: end(now) },
    month:   { from: daysAgo(29),  to: end(now) },
    quarter: { from: daysAgo(89),  to: end(now) },
    year:    { from: daysAgo(364), to: end(now) },
  };
  return ranges[range] || ranges.month;
}

function inRange(dateStr, from, to) {
  const d = new Date(dateStr);
  return !isNaN(d) && d >= from && d <= to;
}

function pctChange(cur, prev) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function buildDailyChart(items, dateField, range) {
  const { from, to } = buildDateRange(range);
  const days = Math.ceil((to - from) / 86400000) + 1;
  return Array.from({ length: Math.min(days, 90) }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    return {
      date: label,
      count: items.filter(x => inRange(x[dateField], dayStart, dayEnd)).length,
    };
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RangeTabs({ value, onChange, t }) {
  const tabs = [
    { id: 'week',    label: t('company.analytics.ranges.week') },
    { id: 'month',   label: t('company.analytics.ranges.month') },
    { id: 'quarter', label: t('company.analytics.ranges.quarter') },
    { id: 'year',    label: t('company.analytics.ranges.year') },
  ];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            value === tab.id
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  if (pct > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />+{pct}%
    </span>
  );
  if (pct < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" />{pct}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
      <Minus className="w-3 h-3" />0%
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, pct, color = 'green', loading, sub }) {
  const colors = {
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
    purple: { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
    red:    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100' },
    cyan:   { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-100' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm flex flex-col gap-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>
      {loading
        ? <div className="h-8 w-24 bg-gray-100 rounded-xl animate-pulse" />
        : (
          <div className="flex items-end justify-between gap-2">
            <p className="text-3xl font-black text-gray-900">{value ?? '—'}</p>
            <TrendBadge pct={pct} />
          </div>
        )
      }
      {sub && !loading && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanyAnalyticsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const orgId = user?.organization_id;
  const [range, setRange] = useState('month');

  // ── Data fetching ────────────────────────────────────────────────────────

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['analytics-jobs', orgId],
    queryFn: () => jobService.list({ organization_id: orgId, is_deleted: false, sort: 'created_date', order: 'DESC', limit: 500 }),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['analytics-apps', orgId],
    queryFn: () => applicationService.list({ organization_id: orgId, is_deleted: false, sort: 'created_date', order: 'DESC', limit: 500 }),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['analytics-candidates', orgId],
    queryFn: () => candidateService.list({ organization_id: orgId, is_deleted: false, sort: 'created_date', order: 'DESC', limit: 500 }),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['analytics-interviews', orgId],
    queryFn: () => interviewService.list({ organization_id: orgId, sort: 'date', order: 'DESC', limit: 300 }),
    enabled: !!orgId,
    staleTime: STALE,
  });

  const loading = jobsLoading || appsLoading || candidatesLoading || interviewsLoading;

  // ── Derived stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const { from, to } = buildDateRange(range);
    const diff = to - from;
    const prevFrom = new Date(from - diff);
    const prevTo   = new Date(from - 1);

    const cur  = (items, field) => items.filter(x => inRange(x[field], from, to)).length;
    const prev = (items, field) => items.filter(x => inRange(x[field], prevFrom, prevTo)).length;

    const appsNow   = cur(applications, 'created_date');
    const appsPrev  = prev(applications, 'created_date');
    const hiredNow  = applications.filter(a => a.status === 'hired' && inRange(a.updated_date, from, to)).length;
    const hiredPrev = applications.filter(a => a.status === 'hired' && inRange(a.updated_date, prevFrom, prevTo)).length;
    const intNow    = cur(interviews, 'created_date');
    const intPrev   = prev(interviews, 'created_date');
    const candNow   = cur(candidates, 'created_date');
    const candPrev  = prev(candidates, 'created_date');
    const openJobs  = jobs.filter(j => !j.is_closed).length;
    const totalViews= jobs.reduce((s, j) => s + (j.views || 0), 0);
    const convRate  = totalViews > 0 ? ((applications.length / totalViews) * 100).toFixed(1) : '0';

    // Funnel: count by status for current range
    const funnelMap = {};
    APPLICATION_STATUSES.forEach(s => { funnelMap[s] = 0; });
    applications.filter(a => inRange(a.created_date, from, to)).forEach(a => {
      if (funnelMap[a.status] !== undefined) funnelMap[a.status]++;
    });

    // Sources pie
    const srcMap = { app: 0, linkedin: 0, facebook: 0, jobsite: 0, other: 0 };
    applications.filter(a => inRange(a.created_date, from, to)).forEach(a => {
      const k = a.source in srcMap ? a.source : 'other';
      srcMap[k]++;
    });

    // Top jobs by applications in range
    const jobCountMap = {};
    applications.filter(a => inRange(a.created_date, from, to)).forEach(a => {
      jobCountMap[a.job_id] = (jobCountMap[a.job_id] || 0) + 1;
    });
    const topJobs = jobs
      .map(j => ({
        ...j,
        appCount: jobCountMap[j.id] || 0,
        convRate: j.views > 0 ? ((jobCountMap[j.id] || 0) / j.views * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.appCount - a.appCount)
      .slice(0, 8);

    return {
      appsNow, appsPrev, pctApps: pctChange(appsNow, appsPrev),
      hiredNow, hiredPrev, pctHired: pctChange(hiredNow, hiredPrev),
      intNow, intPrev, pctInt: pctChange(intNow, intPrev),
      candNow, candPrev, pctCand: pctChange(candNow, candPrev),
      openJobs, convRate,
      funnelMap, srcMap, topJobs,
    };
  }, [jobs, applications, candidates, interviews, range]);

  // ── Chart data ───────────────────────────────────────────────────────────

  const appsChartData = useMemo(() => {
    const daily = buildDailyChart(applications, 'created_date', range);
    const bucketSize = range === 'year' ? 7 : range === 'quarter' ? 3 : 1;
    if (bucketSize === 1) return daily;
    const bucketed = [];
    for (let i = 0; i < daily.length; i += bucketSize) {
      const slice = daily.slice(i, i + bucketSize);
      bucketed.push({
        date: slice[0].date,
        count: slice.reduce((s, x) => s + x.count, 0),
      });
    }
    return bucketed;
  }, [applications, range]);

  const funnelChartData = useMemo(() => (
    APPLICATION_STATUSES
      .map(s => ({
        name: t(`company.analytics.funnel.${s}`, { defaultValue: s }),
        value: stats.funnelMap?.[s] || 0,
      }))
      .filter(d => d.value > 0)
  ), [stats.funnelMap, t]);

  const sourcesChartData = useMemo(() => {
    const srcLabels = {
      app:     t('company.analytics.sources.app'),
      linkedin:'LinkedIn',
      facebook:'Facebook',
      jobsite: t('company.analytics.sources.jobsite'),
      other:   t('company.analytics.sources.other'),
    };
    return Object.entries(stats.srcMap || {})
      .map(([k, v]) => ({ name: srcLabels[k] || k, value: v }))
      .filter(d => d.value > 0);
  }, [stats.srcMap, t]);

  const vsLabel = t('company.analytics.vsLastPeriod');

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t('company.analytics.title')}</h1>
          <p className="text-gray-500 mt-1 font-semibold">{t('company.analytics.subtitle')}</p>
        </div>
        <RangeTabs value={range} onChange={setRange} t={t} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={FileText}
          label={t('company.analytics.stats.newApplications')}
          value={stats.appsNow}
          pct={stats.pctApps}
          color="blue"
          loading={loading}
          sub={vsLabel}
        />
        <KpiCard
          icon={Briefcase}
          label={t('company.analytics.stats.openJobs')}
          value={stats.openJobs}
          color="purple"
          loading={loading}
        />
        <KpiCard
          icon={Calendar}
          label={t('company.analytics.stats.scheduledInterviews')}
          value={stats.intNow}
          pct={stats.pctInt}
          color="purple"
          loading={loading}
          sub={vsLabel}
        />
        <KpiCard
          icon={CheckCircle2}
          label={t('company.analytics.stats.hired')}
          value={stats.hiredNow}
          pct={stats.pctHired}
          color="purple"
          loading={loading}
          sub={vsLabel}
        />
        <KpiCard
          icon={Users}
          label={t('company.analytics.stats.totalCandidates')}
          value={stats.candNow}
          pct={stats.pctCand}
          color="cyan"
          loading={loading}
          sub={vsLabel}
        />
        <KpiCard
          icon={BarChart3}
          label={t('company.analytics.stats.conversionRate')}
          value={`${stats.convRate}%`}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Applications Over Time */}
      <SectionCard title={t('company.analytics.charts.applicationsOverTime')}>
        {loading ? (
          <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
        ) : appsChartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
            {t('company.analytics.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={appsChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={EMERALD}
                strokeWidth={2.5}
                dot={false}
                name={t('company.analytics.stats.newApplications')}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Funnel + Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title={t('company.analytics.charts.recruitmentFunnel')}>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : funnelChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {t('company.analytics.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelChartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name={t('company.analytics.stats.newApplications')}>
                  {funnelChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title={t('company.analytics.charts.candidateSources')}>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : sourcesChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {t('company.analytics.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sourcesChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {sourcesChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Top Jobs Table */}
      <SectionCard title={t('company.analytics.charts.topJobs')}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.topJobs?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            {t('company.analytics.topJobs.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className={`${isRTL ? 'text-right' : 'text-left'} text-xs text-gray-500 font-semibold pb-2`}>
                    {t('company.analytics.topJobs.job')}
                  </th>
                  <th className="text-center text-xs text-gray-500 font-semibold pb-2">
                    {t('company.analytics.topJobs.applications')}
                  </th>
                  <th className="text-center text-xs text-gray-500 font-semibold pb-2">
                    {t('company.analytics.topJobs.views')}
                  </th>
                  <th className="text-center text-xs text-gray-500 font-semibold pb-2">
                    {t('company.analytics.topJobs.conversion')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topJobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-gray-800 truncate max-w-[200px]">{job.title}</div>
                      <div className="text-xs text-gray-400">{job.location || '—'}</div>
                    </td>
                     <td className="text-center font-bold text-purple-600">{job.appCount}</td>
                    <td className="text-center text-gray-500">{(job.views || 0).toLocaleString()}</td>
                    <td className="text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        parseFloat(job.convRate) >= 5
                          ? 'bg-purple-50 text-purple-600'
                          : parseFloat(job.convRate) >= 2
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {job.convRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

    </div>
  );
}
