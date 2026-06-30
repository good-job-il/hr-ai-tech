import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Search, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TABS = [
  { id: 'staffing', route: '/platform/organizations/staffing', orgType: 'staffing_agency', labelKey: 'platform.orgs.staffing' },
  { id: 'companies', route: '/platform/organizations/companies', orgType: 'organization', labelKey: 'platform.orgs.companies' },
];

const STATUS_CONFIG = {
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active',   icon: CheckCircle },
  suspended: { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Suspended', icon: XCircle },
  inactive:  { bg: 'bg-gray-50',    text: 'text-gray-500',    label: 'Inactive',  icon: Clock },
};

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeTab = TABS.find(tab => location.pathname.startsWith(tab.route)) ?? TABS[0];
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', contact_email: '' });
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const tabOrgs = orgs.filter(o => o.org_type === activeTab.orgType);

  const filtered = tabOrgs.filter(o => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.contact_email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleCreate = async () => {
    if (!newOrg.name.trim()) return;
    setCreating(true);
    await base44.entities.Organization.create({ ...newOrg, org_type: activeTab.orgType, status: 'active', plan: 'trial' });
    await qc.invalidateQueries(['platform-orgs']);
    setNewOrg({ name: '', contact_email: '' });
    setShowModal(false);
    setCreating(false);
  };

  const handleStatusToggle = async (org) => {
    const next = org.status === 'active' ? 'suspended' : 'active';
    await base44.entities.Organization.update(org.id, { status: next });
    qc.invalidateQueries(['platform-orgs']);
  };

  const stats = {
    total: tabOrgs.length,
    active: tabOrgs.filter(o => o.status === 'active').length,
    suspended: tabOrgs.filter(o => o.status === 'suspended').length,
    inactive: tabOrgs.filter(o => o.status !== 'active' && o.status !== 'suspended').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Organizations</h1>
          <p className="text-slate-500 mt-1 font-semibold">Manage all organizations on the platform</p>
        </div>
        <button onClick={() => { setNewOrg({ name: '', contact_email: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
          <Plus className="w-4 h-4" /> New Organization
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(tab => {
          const active = location.pathname.startsWith(tab.route);
          return (
            <Link
              key={tab.id}
              to={tab.route}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                active
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-purple-50 text-purple-700' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Suspended', value: stats.suspended, color: 'bg-red-50 text-red-700' },
          { label: 'Inactive', value: stats.inactive, color: 'bg-gray-50 text-gray-600' },
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
            placeholder="Search organization..." className="outline-none text-sm w-full bg-transparent" />
        </div>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} organizations</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left font-black text-gray-600 px-5 py-3">Name</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">Type</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">Email</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">Plan</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">Status</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">Actions</th>
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
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No matching organizations</td></tr>
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
                    {org.org_type === 'staffing_agency' ? '🏢 Staffing' : '🏗️ Internal HR'}
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
                      {org.status === 'active' ? 'Suspend' : 'Activate'}
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-black text-gray-900 mb-5">New Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Organization Name *</label>
                <input type="text" value={newOrg.name} onChange={e => setNewOrg(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., TechStaff Ltd"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <p className="text-sm font-semibold text-gray-600">{t(activeTab.labelKey)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Primary Email</label>
                <input type="email" value={newOrg.contact_email} onChange={e => setNewOrg(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder="info@company.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} disabled={creating}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-sm">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={creating || !newOrg.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors">
                  {creating ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
