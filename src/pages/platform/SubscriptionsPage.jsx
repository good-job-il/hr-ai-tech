import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Search, Filter, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';

const PLAN_COLORS = {
  trial:      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'ניסיון' },
  starter:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Starter' },
  pro:        { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  label: 'Pro' },
  enterprise: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Enterprise' },
};

const STATUS_COLORS = {
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  suspended: { bg: 'bg-red-50',     text: 'text-red-700',     icon: XCircle },
  inactive:  { bg: 'bg-gray-50',    text: 'text-gray-500',    icon: Clock },
};

const PLAN_PRICES = { trial: 0, starter: 499, pro: 1499, enterprise: 2999 };

export default function SubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || o.plan === planFilter;
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const stats = {
    total: orgs.length,
    active: orgs.filter(o => o.status === 'active').length,
    enterprise: orgs.filter(o => o.plan === 'enterprise').length,
    mrr: orgs.filter(o => o.status === 'active').reduce((s, o) => s + (PLAN_PRICES[o.plan] || 0), 0),
  };

  const handleChangePlan = async (org, newPlan) => {
    await base44.entities.Organization.update(org.id, { plan: newPlan });
  };

  const handleChangeStatus = async (org, newStatus) => {
    await base44.entities.Organization.update(org.id, { status: newStatus });
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">ניהול מנויים</h1>
        <p className="text-slate-500 mt-1 font-semibold">כל הארגונים ותוכניות המנוי שלהם</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ ארגונים', value: stats.total, color: 'bg-purple-50 text-purple-700' },
          { label: 'פעילים', value: stats.active, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Enterprise', value: stats.enterprise, color: 'bg-blue-50 text-blue-700' },
          { label: 'MRR (₪)', value: `₪${stats.mrr.toLocaleString()}`, color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-2xl font-black">{isLoading ? '...' : s.value}</p>
            <p className="text-sm font-semibold mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש ארגון..."
            className="outline-none text-sm w-full bg-transparent"
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">כל התוכניות</option>
          <option value="trial">ניסיון</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">כל הסטטוסים</option>
          <option value="active">פעיל</option>
          <option value="suspended">מושהה</option>
          <option value="inactive">לא פעיל</option>
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} ארגונים</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right font-black text-gray-600 px-5 py-3">ארגון</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">סוג</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">תוכנית</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">סטטוס</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">MRR</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">אין ארגונים תואמים</td></tr>
            ) : filtered.map(org => {
              const plan = PLAN_COLORS[org.plan] || PLAN_COLORS.trial;
              const status = STATUS_COLORS[org.status] || STATUS_COLORS.inactive;
              const StatusIcon = status.icon;
              return (
                <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-400">{org.contact_email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">
                    {org.org_type === 'staffing_agency' ? 'השמה' : 'HR פנימי'}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      defaultValue={org.plan || 'trial'}
                      onChange={e => handleChangePlan(org, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${plan.bg} ${plan.text} ${plan.border}`}
                    >
                      <option value="trial">ניסיון</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {org.status === 'active' ? 'פעיל' : org.status === 'suspended' ? 'מושהה' : 'לא פעיל'}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">
                    {org.status === 'active' ? `₪${(PLAN_PRICES[org.plan] || 0).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {org.status === 'active' ? (
                        <button onClick={() => handleChangeStatus(org, 'suspended')}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors">
                          השהה
                        </button>
                      ) : (
                        <button onClick={() => handleChangeStatus(org, 'active')}
                          className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold hover:bg-emerald-100 transition-colors">
                          הפעל
                        </button>
                      )}
                    </div>
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