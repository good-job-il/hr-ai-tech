import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';

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

const ALL_ROLES = [
  'super_admin', 'org_admin', 'recruitment_manager', 'team_manager',
  'recruiter', 'hr_manager', 'internal_recruiter', 'candidate',
];

const EMPTY_FORM = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  role: 'candidate',
  organization_id: '',
  is_active: true,
};

// ─── User Form Modal ─────────────────────────────────────────────────────────
function UserModal({ open, onClose, user, orgs, onSave, isSaving, t, isRTL }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState(
    isEdit
      ? { full_name: user.full_name || '', email: user.email || '', password: '', phone: user.phone || '', role: user.role || 'candidate', organization_id: user.organization_id || '', is_active: user.is_active ?? true }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState({});

  // Sync form when user prop changes
  React.useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        isEdit
          ? { full_name: user.full_name || '', email: user.email || '', password: '', phone: user.phone || '', role: user.role || 'candidate', organization_id: user.organization_id || '', is_active: user.is_active ?? true }
          : { ...EMPTY_FORM }
      );
    }
  }, [open, user?.id]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name?.trim()) e.full_name = t('platform.usersManagement.modal.required', 'Required');
    if (!form.email?.trim()) e.email = t('platform.usersManagement.modal.required', 'Required');
    if (!isEdit && (!form.password || form.password.length < 8)) e.password = t('platform.usersManagement.modal.passwordHint');
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-slate-900">
            {isEdit ? t('platform.usersManagement.modal.editTitle') : t('platform.usersManagement.modal.createTitle')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.fullName')} *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.email')} *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              disabled={isEdit}
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-50 disabled:text-gray-400 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password (create only) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.password')} *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              <p className={`text-xs mt-1 ${errors.password ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {errors.password || t('platform.usersManagement.modal.passwordHint')}
              </p>
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.phone')}</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.role')}</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300">
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{t(`platform.usersManagement.roles.${r}`, r)}</option>
              ))}
            </select>
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('platform.usersManagement.modal.organization')}</label>
            <select value={form.organization_id} onChange={e => set('organization_id', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">—</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-gray-700">{t('platform.usersManagement.modal.status')}</label>
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? (isRTL ? '-translate-x-1' : 'translate-x-6') : (isRTL ? '-translate-x-6' : 'translate-x-1')}`} />
            </button>
            <span className="text-sm text-gray-500">{form.is_active ? t('platform.usersManagement.modal.active') : t('platform.usersManagement.modal.inactive')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={handleSubmit} disabled={isSaving}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
            {isSaving
              ? (isEdit ? t('platform.usersManagement.modal.saving') : t('platform.usersManagement.modal.creating'))
              : t('platform.usersManagement.modal.save')}
          </button>
          <button onClick={onClose} disabled={isSaving}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors text-sm">
            {t('platform.usersManagement.modal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteConfirm({ open, onClose, user, onConfirm, isDeleting, t, isRTL }) {
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-black text-center text-slate-900 mb-2">{t('platform.usersManagement.deleteConfirm.title')}</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {t('platform.usersManagement.deleteConfirm.message', { name: user.full_name || user.email })}
        </p>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
            {isDeleting ? t('platform.usersManagement.deleteConfirm.deleting') : t('platform.usersManagement.deleteConfirm.confirm')}
          </button>
          <button onClick={onClose} disabled={isDeleting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors text-sm">
            {t('platform.usersManagement.deleteConfirm.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [message]);
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 transition-all ${type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsersManagementPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const isRTL = i18n.language?.startsWith('he');

  const showToast = (message, type = 'success') => setToast({ message, type });

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

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.User.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setModalOpen(false);
      showToast(t('platform.usersManagement.toast.created'));
    },
    onError: () => showToast(t('platform.usersManagement.toast.error'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setModalOpen(false);
      setEditUser(null);
      showToast(t('platform.usersManagement.toast.updated'));
    },
    onError: () => showToast(t('platform.usersManagement.toast.error'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setDeleteTarget(null);
      showToast(t('platform.usersManagement.toast.deleted'));
    },
    onError: () => showToast(t('platform.usersManagement.toast.error'), 'error'),
  });

  const handleSave = (form) => {
    // Sanitize: empty string → null for UUID fields, trim strings
    const sanitized = {
      ...form,
      full_name: form.full_name?.trim(),
      email: form.email?.trim(),
      phone: form.phone?.trim() || undefined,
      organization_id: form.organization_id || null,
    };

    if (editUser?.id) {
      const { email, password, ...rest } = sanitized;
      updateMutation.mutate({ id: editUser.id, data: rest });
    } else {
      if (!sanitized.password || sanitized.password.length < 8) {
        showToast(t('platform.usersManagement.modal.passwordHint'), 'error');
        return;
      }
      if (!sanitized.full_name) {
        showToast(t('platform.usersManagement.modal.fullName') + ' — required', 'error');
        return;
      }
      createMutation.mutate(sanitized);
    }
  };

  const openCreate = () => { setEditUser(null); setModalOpen(true); };
  const openEdit = (u) => { setEditUser(u); setModalOpen(true); };
  const openDelete = (u) => setDeleteTarget(u);

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

  const getRoleLabel = (role) => t(`platform.usersManagement.roles.${role}`, role);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-7xl mx-auto">
      {/* Modals */}
      <UserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditUser(null); }}
        user={editUser}
        orgs={orgs}
        onSave={handleSave}
        isSaving={isSaving}
        t={t}
        isRTL={isRTL}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        user={deleteTarget}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isDeleting={deleteMutation.isPending}
        t={t}
        isRTL={isRTL}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('platform.usersManagement.title')}</h1>
          <p className="text-slate-500 mt-1 font-semibold">{t('platform.usersManagement.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            {t('platform.usersManagement.addUser')}
          </button>
        </div>
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
          {ALL_ROLES.map(r => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
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
              <th className={`${isRTL ? 'text-right' : 'text-left'} font-black text-gray-600 px-5 py-3`}>{t('platform.usersManagement.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {Array(5).fill(0).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">{t('platform.usersManagement.noUsers')}</td></tr>
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDelete(u)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
