import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Users, Search, Shield, UserCheck, Building2 } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const ROLE_CONFIG = {
  admin:                { bg: 'bg-red-50',     text: 'text-red-700' },
  super_admin:          { bg: 'bg-red-100',    text: 'text-red-800' },
  org_admin:            { bg: 'bg-purple-50',  text: 'text-purple-700' },
  recruitment_manager:  { bg: 'bg-blue-50',    text: 'text-blue-700' },
  team_manager:         { bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  recruiter:            { bg: 'bg-cyan-50',    text: 'text-cyan-700' },
  hr_manager:           { bg: 'bg-teal-50',    text: 'text-teal-700' },
  internal_recruiter:   { bg: 'bg-sky-50',     text: 'text-sky-700' },
  candidate:            { bg: 'bg-gray-50',    text: 'text-gray-600' },
};

export default function UsersManagementPage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const isRTL = i18n.language?.startsWith('he');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['platform-users'],
    queryFn: () => base44.entities.User.list('-created_date', 500).catch(() => []),
    staleTime: 2 * 60 * 1000,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('', 500),
    staleTime: 5 * 60 * 1000,
  });

  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => ['admin', 'super_admin', 'org_admin'].includes(u.role)).length,
    recruiters: users.filter(u => ['recruiter', 'team_manager', 'recruitment_manager', 'internal_recruiter'].includes(u.role)).length,
    candidates: users.filter(u => u.role === 'candidate').length,
  };

  const getRoleLabel = (role) => {
    return t(`platform.usersManagement.roles.${role}`, role);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('platform.usersManagement.title')}</h1>
          <p className="text-slate-500 mt-1 font-semibold">{t('platform.usersManagement.subtitle')}</p>
        </div>
        <LanguageSwitcher variant="badge" />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('platform.usersManagement.stats.totalUsers'), value: stats.total, color: 'bg-purple-50 text-purple-700' },
          { label: t('platform.usersManagement.stats.admins'), value: stats.admins, color: 'bg-red-50 text-red-700' },
          { label: t('platform.usersManagement.stats.recruiters'), value: stats.recruiters, color: 'bg-blue-50 text-blue-700' },
          { label: t('platform.usersManagement.stats.candidates'), value: stats.candidates, color: 'bg-gray-50 text-gray-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-3xl font-black">{isLoading ? '...' : s.value}</p>
            <p className="text-sm font-semibold mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('platform.usersManagement.search')} className="outline-none text-sm w-full bg-transparent" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">{t('platform.usersManagement.filters.allRoles')}</option>
          <option value="super_admin">{getRoleLabel('super_admin')}</option>
          <option value="org_admin">{getRoleLabel('org_admin')}</option>
          <option value="recruitment_manager">{getRoleLabel('recruitment_manager')}</option>
          <option value="team_manager">{getRoleLabel('team_manager')}</option>
          <option value="recruiter">{getRoleLabel('recruiter')}</option>
          <option value="hr_manager">{getRoleLabel('hr_manager')}</option>
          <option value="internal_recruiter">{getRoleLabel('internal_recruiter')}</option>
          <option value="candidate">{getRoleLabel('candidate')}</option>
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} {t('platform.usersManagement.usersCount')}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={`${isRTL ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.usersManagement.table.user')}</th>
              <th className={`${isRTL ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.usersManagement.table.role')}</th>
              <th className={`${isRTL ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.usersManagement.table.organization')}</th>
              <th className={`${isRTL ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.usersManagement.table.created')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array(4).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">{t('platform.usersManagement.noUsers')}</td></tr>
            ) : filtered.map(u => {
              const role = ROLE_CONFIG[u.role] || { bg: 'bg-gray-50', text: 'text-gray-600' };
              const roleLabel = getRoleLabel(u.role);
              const orgName = orgMap[u.organization_id] || u.organization_id || '—';
              const locale = isRTL ? 'he-IL' : 'en-US';
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black text-xs flex-shrink-0">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role.bg} ${role.text}`}>
                      {roleLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">{orgName}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString(locale) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}