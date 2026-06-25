import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Shield, UserCheck, Building2 } from 'lucide-react';

const ROLE_CONFIG = {
  admin:                { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Admin' },
  super_admin:          { bg: 'bg-red-100',    text: 'text-red-800',     label: 'Super Admin' },
  org_admin:            { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Org Admin' },
  recruitment_manager:  { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'מנהל גיוס' },
  team_manager:         { bg: 'bg-indigo-50',  text: 'text-indigo-700',  label: 'מנהל צוות' },
  recruiter:            { bg: 'bg-cyan-50',    text: 'text-cyan-700',    label: 'מגייס' },
  hr_manager:           { bg: 'bg-teal-50',    text: 'text-teal-700',    label: 'HR Manager' },
  internal_recruiter:   { bg: 'bg-sky-50',     text: 'text-sky-700',     label: 'מגייס פנימי' },
  candidate:            { bg: 'bg-gray-50',    text: 'text-gray-600',    label: 'מועמד' },
};

export default function UsersManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">ניהול משתמשים</h1>
        <p className="text-slate-500 mt-1 font-semibold">כל המשתמשים בפלטפורמה</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ משתמשים', value: stats.total, color: 'bg-purple-50 text-purple-700' },
          { label: 'אדמינים', value: stats.admins, color: 'bg-red-50 text-red-700' },
          { label: 'מגייסים', value: stats.recruiters, color: 'bg-blue-50 text-blue-700' },
          { label: 'מועמדים', value: stats.candidates, color: 'bg-gray-50 text-gray-700' },
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
            placeholder="חיפוש שם או אימייל..." className="outline-none text-sm w-full bg-transparent" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">כל התפקידים</option>
          <option value="super_admin">Super Admin</option>
          <option value="org_admin">Org Admin</option>
          <option value="recruitment_manager">מנהל גיוס</option>
          <option value="team_manager">מנהל צוות</option>
          <option value="recruiter">מגייס</option>
          <option value="hr_manager">HR Manager</option>
          <option value="internal_recruiter">מגייס פנימי</option>
          <option value="candidate">מועמד</option>
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} משתמשים</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right font-black text-gray-600 px-5 py-3">משתמש</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">תפקיד</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">ארגון</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">נוצר</th>
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
              <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">אין משתמשים תואמים</td></tr>
            ) : filtered.map(u => {
              const role = ROLE_CONFIG[u.role] || { bg: 'bg-gray-50', text: 'text-gray-600', label: u.role };
              const orgName = orgMap[u.organization_id] || u.organization_id || '—';
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
                      {role.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">{orgName}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {u.created_date ? new Date(u.created_date).toLocaleDateString('he-IL') : '—'}
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