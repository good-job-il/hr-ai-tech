import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Search, Plus, CheckCircle, XCircle, Clock, Pencil, Trash2, MoreVertical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const TABS = [
  { id: 'staffing', route: '/platform/organizations/staffing', orgType: 'staffing_agency', labelKey: 'platform.orgs.staffing' },
  { id: 'companies', route: '/platform/organizations/companies', orgType: 'organization', labelKey: 'platform.orgs.companies' },
];

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = TABS.find(tab => location.pathname.startsWith(tab.route)) ?? TABS[0];
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', contact_email: '' });
  const [creating, setCreating] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const STATUS_CONFIG = {
    active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: t('platform.orgs.statusActive'),   icon: CheckCircle },
    suspended: { bg: 'bg-red-50',     text: 'text-red-700',     label: t('platform.orgs.statusSuspended'), icon: XCircle },
    inactive:  { bg: 'bg-gray-50',    text: 'text-gray-500',    label: t('platform.orgs.statusInactive'),  icon: Clock },
  };

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

  const handleEdit = (org) => {
    setEditOrg({ id: org.id, name: org.name, contact_email: org.contact_email || '', plan: org.plan || 'trial' });
  };

  const handleSaveEdit = async () => {
    if (!editOrg.name.trim()) return;
    setSaving(true);
    const payload = { name: editOrg.name, plan: editOrg.plan };
    if (editOrg.contact_email.trim()) payload.contact_email = editOrg.contact_email.trim();
    await base44.entities.Organization.update(editOrg.id, payload);
    await qc.invalidateQueries(['platform-orgs']);
    setEditOrg(null);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    setDeleting(true);
    await base44.entities.Organization.delete(deleteOrg.id);
    await qc.invalidateQueries(['platform-orgs']);
    setDeleteOrg(null);
    setDeleting(false);
  };

  const stats = {
    total: tabOrgs.length,
    active: tabOrgs.filter(o => o.status === 'active').length,
    suspended: tabOrgs.filter(o => o.status === 'suspended').length,
    inactive: tabOrgs.filter(o => o.status !== 'active' && o.status !== 'suspended').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('platform.orgs.title')}</h1>
          <p className="text-slate-500 mt-1 font-semibold">{t('platform.orgs.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setNewOrg({ name: '', contact_email: '' }); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" /> {t('platform.orgs.newOrg')}
          </Button>
        </div>
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
          { labelKey: 'platform.orgs.total',     value: stats.total,     color: 'bg-purple-50 text-purple-700' },
          { labelKey: 'platform.orgs.active',     value: stats.active,    color: 'bg-emerald-50 text-emerald-700' },
          { labelKey: 'platform.orgs.suspended',  value: stats.suspended, color: 'bg-red-50 text-red-700' },
          { labelKey: 'platform.orgs.inactive',   value: stats.inactive,  color: 'bg-gray-50 text-gray-600' },
        ].map(s => (
          <div key={s.labelKey} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-3xl font-black">{isLoading ? '...' : s.value}</p>
            <p className="text-sm font-semibold mt-1 opacity-80">{t(s.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('platform.orgs.searchPlaceholder')} className="outline-none text-sm w-full bg-transparent" />
        </div>
        <span className="text-sm text-gray-400 font-semibold">{t('platform.orgs.orgCount', { count: filtered.length })}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.colName')}</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.colType')}</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.colEmail')}</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.plan')}</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.status')}</th>
              <th className="text-left font-black text-gray-600 px-5 py-3">{t('platform.orgs.actions')}</th>
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
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">{t('platform.orgs.noResults')}</td></tr>
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
                    {org.org_type === 'staffing_agency'
                      ? `🏢 ${t('platform.orgs.typeStaffing')}`
                      : `🏗️ ${t('platform.orgs.typeInternalHR')}`}
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStatusToggle(org)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${
                          org.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}>
                        {org.status === 'active' ? t('platform.orgs.suspend') : t('platform.orgs.activate')}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px]">
                          {org.org_type === 'staffing_agency' && (
                            <DropdownMenuItem
                              onClick={() => navigate(`/company/dashboard?orgId=${org.id}`)}
                              className="flex items-center gap-2 cursor-pointer focus:bg-gray-100 focus:text-gray-900"
                            >
                              <ExternalLink className="w-4 h-4 text-purple-500" />
                              <span>{t('platform.orgs.btnOpen')}</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleEdit(org)}
                            className="flex items-center gap-2 cursor-pointer focus:bg-gray-100 focus:text-gray-900"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                            <span>{t('platform.orgs.btnEdit')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteOrg(org)}
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('platform.orgs.delete')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            <h3 className="text-xl font-black text-gray-900 mb-5">{t('platform.orgs.modalTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.labelOrgName')}</label>
                <input type="text" value={newOrg.name} onChange={e => setNewOrg(p => ({ ...p, name: e.target.value }))}
                  placeholder={t('platform.orgs.placeholderOrgName')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.labelType')}</label>
                <p className="text-sm font-semibold text-gray-600">{t(activeTab.labelKey)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.labelEmail')}</label>
                <input type="email" value={newOrg.contact_email} onChange={e => setNewOrg(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder={t('platform.orgs.placeholderEmail')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                >
                  {t('platform.orgs.btnCancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={creating || !newOrg.name.trim()}
                >
                  {creating ? t('platform.orgs.btnCreating') : t('platform.orgs.btnCreate')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-black text-gray-900 mb-5">{t('platform.orgs.editModalTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.labelOrgName')}</label>
                <input type="text" value={editOrg.name} onChange={e => setEditOrg(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.labelEmail')}</label>
                <input type="email" value={editOrg.contact_email} onChange={e => setEditOrg(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder={t('platform.orgs.placeholderEmail')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.orgs.plan')}</label>
                <select value={editOrg.plan} onChange={e => setEditOrg(p => ({ ...p, plan: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm">
                  {['trial', 'starter', 'pro', 'enterprise'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditOrg(null)} disabled={saving}>
                  {t('platform.orgs.btnCancel')}
                </Button>
                <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveEdit} disabled={saving || !editOrg.name.trim()}>
                  {saving ? t('platform.orgs.btnSaving') : t('platform.orgs.btnSave')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900">{t('platform.orgs.confirmDeleteTitle')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('platform.orgs.confirmDeleteMsg', { name: deleteOrg.name })}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleteOrg(null)} disabled={deleting}>
                {t('platform.orgs.btnCancel')}
              </Button>
              <Button variant="primary" size="sm" className="flex-1 !bg-red-600 hover:!bg-red-700" onClick={handleDelete} disabled={deleting}>
                {deleting ? t('platform.orgs.btnDeleting') : t('platform.orgs.btnConfirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
