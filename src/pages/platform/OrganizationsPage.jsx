import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Search, Plus, Users, Briefcase, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';

const STATUS_CONFIG = {
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'פעיל',     icon: CheckCircle },
  suspended: { bg: 'bg-red-50',     text: 'text-red-700',     label: 'מושהה',   icon: XCircle },
  inactive:  { bg: 'bg-gray-50',    text: 'text-gray-500',    label: 'לא פעיל', icon: Clock },
};

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', org_type: 'staffing_agency', contact_email: '' });
  const [creating, setCreating] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const qc = useQueryClient();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.contact_email?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || o.org_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async () => {
    if (!newOrg.name.trim()) return;
    setCreating(true);
    await base44.entities.Organization.create({ ...newOrg, status: 'active', plan: 'trial' });
    await qc.invalidateQueries(['platform-orgs']);
    setNewOrg({ name: '', org_type: 'staffing_agency', contact_email: '' });
    setShowModal(false);
    setCreating(false);
  };

  const handleStatusToggle = async (org) => {
    const next = org.status === 'active' ? 'suspended' : 'active';
    await base44.entities.Organization.update(org.id, { status: next });
    qc.invalidateQueries(['platform-orgs']);
  };

  const stats = {
    total: orgs.length,
    agencies: orgs.filter(o => o.org_type === 'staffing_agency').length,
    companies: orgs.filter(o => o.org_type === 'organization').length,
    active: orgs.filter(o => o.status === 'active').length,
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ארגונים</h1>
          <p className="text-slate-500 mt-1 font-semibold">ניהול כל הארגונים בפלטפורמה</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
          <Plus className="w-4 h-4" /> ארגון חדש
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'סה״כ', value: stats.total, color: 'bg-purple-50 text-purple-700' },
          { label: 'פעילים', value: stats.active, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'חברות השמה', value: stats.agencies, color: 'bg-blue-50 text-blue-700' },
          { label: 'HR פנימי', value: stats.companies, color: 'bg-amber-50 text-amber-700' },
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
            placeholder="חיפוש ארגון..." className="outline-none text-sm w-full bg-transparent" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">כל הסוגים</option>
          <option value="staffing_agency">חברות השמה</option>
          <option value="organization">HR פנימי</option>
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} ארגונים</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right font-black text-gray-600 px-5 py-3">שם</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">סוג</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">מייל</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">תוכנית</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">סטטוס</th>
              <th className="text-right font-black text-gray-600 px-5 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">אין ארגונים תואמים</td></tr>
            ) : filtered.map(org => {
              const st = STATUS_CONFIG[org.status] || STATUS_CONFIG.inactive;
              const StIcon = st.icon;
              return (
                <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-bold text-gray-900">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 font-semibold">
                    {org.org_type === 'staffing_agency' ? '🏢 השמה' : '🏗️ HR פנימי'}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{org.contact_email || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {org.plan || 'trial'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>
                      <StIcon className="w-3 h-3" />
                      {st.label}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleStatusToggle(org)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        org.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}>
                      {org.status === 'active' ? 'השהה' : 'הפעל'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" dir="rtl">
            <h3 className="text-xl font-black text-gray-900 mb-5">ארגון חדש</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">שם הארגון *</label>
                <input type="text" value={newOrg.name} onChange={e => setNewOrg(p => ({ ...p, name: e.target.value }))}
                  placeholder="לדוגמה: TechStaff Ltd"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">סוג ארגון</label>
                <select value={newOrg.org_type} onChange={e => setNewOrg(p => ({ ...p, org_type: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm">
                  <option value="staffing_agency">חברת השמה</option>
                  <option value="organization">חברה / HR פנימי</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">מייל ראשי</label>
                <input type="email" value={newOrg.contact_email} onChange={e => setNewOrg(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder="info@company.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} disabled={creating}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-sm">
                  ביטול
                </button>
                <button onClick={handleCreate} disabled={creating || !newOrg.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors">
                  {creating ? 'יוצר...' : 'צור ארגון'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}