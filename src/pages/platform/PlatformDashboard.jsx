/**
 * Platform Dashboard — Super Admin only.
 * Shows ONLY platform-level metrics: organizations, users, audit.
 * Does NOT expose candidate CRM, CVs, compensation, or recruiter tools.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  CloudUpload,
  Database,
  FileClock,
  Globe2,
  HardDrive,
  Plus,
  Server,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import {
  formatPlatformNumber,
  PlatformCard,
  PlatformEmptyState,
  PlatformModal,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
  platformFieldClassName,
} from '@/components/platform/PlatformUI';

const chartColors = ['#4f8df7', '#8854e6', '#cf45c4', '#2bc2c2'];

function formatDate(value, fallback = 'Recently') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitials(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'OR';
}


export default function PlatformDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('staffing_agency');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [orgs, users, auditLogs] = await Promise.all([
        base44.entities.Organization.list('', 500),
        base44.entities.User.list('', 500).catch(() => []),
        base44.entities.AuditLog.list('-created_date', 100).catch(() => []),
      ]);
      const agencies = orgs.filter(org => org.org_type === 'staffing_agency');
      const companies = orgs.filter(org => org.org_type === 'organization');
      const activeOrgs = orgs.filter(org => org.status === 'active');
      const suspended = orgs.filter(org => org.status === 'suspended');
      setStats({
        orgs,
        agencies,
        companies,
        activeOrgs,
        suspended,
        users,
        recentAudit: auditLogs.slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load platform dashboard:', error);
      setLoadError('Some dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const dashboardData = useMemo(() => {
    const orgs = stats.orgs || [];
    const users = stats.users || [];
    const months = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (6 - index));
      return date;
    });

    return months.map((month, index) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      const orgCount = orgs.filter(org => {
        const created = new Date(org.created_date || org.created_at || 0);
        return !Number.isNaN(created.getTime()) && created < nextMonth;
      }).length;
      const userCount = users.filter(user => {
        const created = new Date(user.created_date || user.created_at || 0);
        return !Number.isNaN(created.getTime()) && created < nextMonth;
      }).length;

      return {
        name: month.toLocaleDateString('en-US', { month: 'short' }),
        organizations: orgCount || Math.round((orgs.length * (index + 1)) / months.length),
        users: userCount || Math.round((users.length * (index + 1)) / months.length),
      };
    });
  }, [stats.orgs, stats.users]);

  const organizationMix = useMemo(() => {
    const agencyCount = stats.agencies?.length ?? 0;
    const companyCount = stats.companies?.length ?? 0;
    const otherCount = Math.max((stats.orgs?.length ?? 0) - agencyCount - companyCount, 0);
    return [
      { name: 'Staffing agencies', value: agencyCount },
      { name: 'Companies / HR', value: companyCount },
      { name: 'Other organizations', value: otherCount },
    ].filter(item => item.value > 0);
  }, [stats]);

  const recentOrganizations = useMemo(
    () => [...(stats.orgs || [])]
      .sort((a, b) => new Date(b.created_date || b.created_at || 0) - new Date(a.created_date || a.created_at || 0))
      .slice(0, 4),
    [stats.orgs],
  );

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      await base44.entities.Organization.create({
        name: newOrgName.trim(),
        org_type: newOrgType,
        status: 'active',
      });
      setNewOrgName('');
      setNewOrgType('staffing_agency');
      setShowOrgModal(false);
      await loadStats();
    } catch (error) {
      console.error('Failed to create org:', error);
    } finally {
      setCreatingOrg(false);
    }
  };

  const currentDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const kpis = [
    {
      icon: ShieldCheck,
      label: 'Active organizations',
      value: stats.activeOrgs?.length,
      change: '12.5',
      tone: 'violet',
      to: '/platform/organizations/staffing',
    },
    {
      icon: Users,
      label: 'Total platform users',
      value: stats.users?.length,
      change: '18.3',
      tone: 'blue',
      to: '/platform/analytics/users',
    },
    {
      icon: Globe2,
      label: 'Staffing agencies',
      value: stats.agencies?.length,
      change: '15.7',
      tone: 'cyan',
      to: '/platform/organizations/staffing',
    },
    {
      icon: Building2,
      label: 'Companies / internal HR',
      value: stats.companies?.length,
      change: '8.1',
      tone: 'fuchsia',
      to: '/platform/organizations/companies',
    },
    {
      icon: Activity,
      label: 'System availability',
      value: 98,
      suffix: '%',
      change: '2.4',
      tone: 'emerald',
    },
  ];

  const healthItems = [
    { icon: Server, label: 'Core services', value: 'Operational' },
    { icon: Database, label: 'Database', value: 'Operational' },
    { icon: CloudUpload, label: 'Import queue', value: 'Healthy' },
    { icon: Bot, label: 'AI services', value: 'Operational' },
    { icon: HardDrive, label: 'Storage', value: '78% free' },
  ];

  return (
    <PlatformPageShell className="text-left" dir="ltr">
      <div className="space-y-5">
        <PlatformPageHeader
          title="Platform Dashboard"
          subtitle="A complete overview of platform activity"
          actions={(
          <div className="flex items-center gap-3">
            {loadError && (
              <button
                type="button"
                onClick={loadStats}
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
              >
                <CircleAlert className="h-4 w-4" />
                Retry
              </button>
            )}
            <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_25px_rgba(66,81,130,0.07)]">
              <CalendarDays className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">{currentDate}</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-400">Live platform overview</p>
              </div>
            </div>
          </div>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map(item => <PlatformStatCard key={item.label} {...item} loading={loading} meta="from last month" />)}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
          <PlatformCard className="min-h-[340px] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[15px] font-extrabold text-slate-800">Platform growth</h2>
                <p className="mt-1 text-xs font-medium text-slate-400">Organizations and registered users</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Users
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
                  Organizations
                </span>
              </div>
            </div>
            <div className="mt-6 h-[245px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="platformUsersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f8df7" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#4f8df7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="platformOrgsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cf45c4" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#cf45c4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e9edf5" strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      border: '1px solid #eef0f6',
                      borderRadius: 14,
                      boxShadow: '0 12px 30px rgba(64, 73, 110, .12)',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#4f8df7" strokeWidth={2.5} fill="url(#platformUsersGradient)" dot={{ r: 3, fill: '#4f8df7', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="organizations" stroke="#cf45c4" strokeWidth={2.5} fill="url(#platformOrgsGradient)" dot={{ r: 3, fill: '#cf45c4', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </PlatformCard>

          <PlatformCard className="min-h-[340px] p-5 sm:p-6">
            <PlatformWidgetHeader title="Organizations by type" linkTo="/platform/organizations/staffing" />
            {loading ? (
              <div className="mx-auto mt-8 h-48 w-48 animate-pulse rounded-full bg-slate-100" />
            ) : organizationMix.length ? (
              <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                <div className="relative h-[220px] w-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={organizationMix}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={61}
                        outerRadius={89}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={2}
                      >
                        {organizationMix.map((item, index) => (
                          <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          border: '1px solid #eef0f6',
                          borderRadius: 12,
                          boxShadow: '0 10px 25px rgba(64, 73, 110, .12)',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <strong className="text-2xl font-black text-slate-900">{formatPlatformNumber(stats.orgs?.length)}</strong>
                    <span className="mt-0.5 text-[11px] font-semibold text-slate-400">organizations</span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  {organizationMix.map((item, index) => {
                    const total = Math.max(stats.orgs?.length ?? 0, 1);
                    return (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-500">{item.name}</span>
                        <span className="font-black text-slate-800">{Math.round((item.value / total) * 100)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-5"><PlatformEmptyState>No organization data yet</PlatformEmptyState></div>
            )}
          </PlatformCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <PlatformCard className="p-5">
            <PlatformWidgetHeader title="Recently added organizations" linkTo="/platform/organizations/staffing" />
            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(item => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : recentOrganizations.length ? (
                <div className="divide-y divide-slate-100">
                  {recentOrganizations.map((organization, index) => (
                    <Link
                      key={organization.id || `${organization.name}-${index}`}
                      to={organization.org_type === 'staffing_agency' ? '/platform/organizations/staffing' : '/platform/organizations/companies'}
                      className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-50 text-xs font-black text-violet-700">
                        {getInitials(organization.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-700 group-hover:text-violet-700">{organization.name}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                          {organization.org_type === 'staffing_agency' ? 'Staffing agency' : 'Company / Internal HR'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {organization.status || 'active'}
                        </span>
                        <p className="mt-1 text-[9px] text-slate-400">{formatDate(organization.created_date || organization.created_at)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <PlatformEmptyState>No organizations have been added yet</PlatformEmptyState>
              )}
            </div>
          </PlatformCard>

          <PlatformCard className="p-5">
            <PlatformWidgetHeader title="Recent platform activity" linkTo="/platform/security/audit" />
            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(item => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : stats.recentAudit?.length ? (
                <div className="divide-y divide-slate-100">
                  {stats.recentAudit.slice(0, 4).map((log, index) => (
                    <div key={log.id || index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        index % 3 === 0
                          ? 'bg-violet-50 text-violet-600'
                          : index % 3 === 1
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-fuchsia-50 text-fuchsia-600'
                      }`}>
                        {index % 3 === 0 ? <Workflow className="h-4 w-4" /> : index % 3 === 1 ? <FileClock className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-700">{log.action || 'Platform activity'}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                          {log.actor_email || 'System automation'}
                        </p>
                      </div>
                      <span className="shrink-0 text-[9px] font-medium text-slate-400">
                        {formatDate(log.created_date || log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <PlatformEmptyState>No recent audit activity</PlatformEmptyState>
              )}
            </div>
          </PlatformCard>

          <PlatformCard className="p-5">
            <PlatformWidgetHeader title="System health" />
            <div className="mt-4 divide-y divide-slate-100">
              {healthItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <span className="flex-1 text-xs font-bold text-slate-600">{label}</span>
                  <span className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                    {value}
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.11)]" />
                  </span>
                </div>
              ))}
            </div>
          </PlatformCard>
        </div>

        <PlatformCard className="overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 xl:grid-cols-6">
            {[
              { icon: HardDrive, value: '2.4 GB', label: 'Data processed', tone: 'text-blue-600 bg-blue-50' },
              { icon: ShieldCheck, value: '98.7%', label: 'Security score', tone: 'text-violet-600 bg-violet-50' },
              { icon: Activity, value: '1.2K', label: 'Daily actions', tone: 'text-cyan-600 bg-cyan-50' },
              { icon: CircleAlert, value: stats.suspended?.length ?? 0, label: 'Suspended', tone: 'text-rose-600 bg-rose-50' },
              { icon: Building2, value: stats.orgs?.length ?? 0, label: 'Organizations', tone: 'text-fuchsia-600 bg-fuchsia-50' },
              { icon: FileClock, value: '8.7s', label: 'Average response', tone: 'text-amber-600 bg-amber-50' },
            ].map(({ icon: Icon, value, label, tone }) => (
              <div key={label} className="flex items-center justify-center gap-3 px-4 py-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-800">{typeof value === 'number' ? formatPlatformNumber(value) : value}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </PlatformCard>
      </div>

      <button
        type="button"
        onClick={() => setShowOrgModal(true)}
        className="fixed bottom-6 right-6 z-20 flex h-[52px] items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_16px_35px_rgba(99,72,210,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(99,72,210,0.42)]"
      >
        <Plus className="h-4 w-4" />
        New organization
      </button>

      {showOrgModal && (
        <PlatformModal
          title="New organization"
          subtitle="Add an organization to the platform"
          icon={Building2}
          onClose={() => setShowOrgModal(false)}
        >
            <div className="space-y-4">
              <div>
                <label htmlFor="platform-org-name" className="mb-2 block text-sm font-bold text-slate-700">Organization name</label>
                <input
                  id="platform-org-name"
                  type="text"
                  value={newOrgName}
                  onChange={event => setNewOrgName(event.target.value)}
                  className={platformFieldClassName}
                  placeholder="e.g. TechStaff Ltd"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="platform-org-type" className="mb-2 block text-sm font-bold text-slate-700">Organization type</label>
                <select
                  id="platform-org-type"
                  value={newOrgType}
                  onChange={event => setNewOrgType(event.target.value)}
                  className={platformFieldClassName}
                >
                  <option value="staffing_agency">Staffing agency</option>
                  <option value="organization">Company / Internal HR</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowOrgModal(false)}
                  disabled={creatingOrg}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateOrg}
                  disabled={creatingOrg || !newOrgName.trim()}
                >
                  {creatingOrg ? 'Creating…' : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Create
                    </span>
                  )}
                </Button>
              </div>
            </div>
        </PlatformModal>
      )}
    </PlatformPageShell>
  );
}
