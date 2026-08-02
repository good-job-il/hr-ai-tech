/**
 * RoleSettingsPage — Phase B-3
 * Editable Role Display Names per org_type
 * Accessible by: admin, org_admin
 */
import React, { useState, useEffect } from 'react';
import { roleTemplateService } from '@/api/services/permissionService';
import { auditService } from '@/api/services/auditService';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, Lock, Pencil, Check, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from '@/components/platform/PlatformUI';

const EDITABLE_ROLES = ['admin', 'org_admin'];

const LEVEL_COLORS = {
  1: 'bg-purple-100 text-purple-700 border-purple-200',
  2: 'bg-blue-100 text-blue-700 border-blue-200',
  3: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-gray-100 text-gray-600 border-gray-200',
};

function RoleRow({ record, canEdit, onSave, t }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(record.display_name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!value.trim() || value === record.display_name) { setEditing(false); return; }
    setSaving(true);
    await onSave(record, value.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { setValue(record.display_name); setEditing(false); };

  const levelColor = LEVEL_COLORS[record.hierarchy_level] || LEVEL_COLORS[4];

  return (
    <tr className="border-b border-slate-100 transition-colors hover:bg-violet-50/30">
      {/* Hierarchy Level */}
      <td className="px-4 py-3 text-center">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${levelColor}`}>
          {t(`roleSettings.levels.${record.hierarchy_level}`, { defaultValue: String(record.hierarchy_level) })}
        </span>
      </td>

      {/* system_role_key — read only */}
      <td className="px-4 py-3">
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
          {record.system_role_key}
        </span>
      </td>

      {/* display_name — editable */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={e => setValue(e.target.value)}
              className="h-9 w-48 rounded-xl border-violet-200 text-sm focus:ring-violet-200"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            />
            <button onClick={handleSave} disabled={saving}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="font-semibold text-slate-900">{record.display_name}</span>
            {canEdit && record.is_editable_name && (
              <button onClick={() => setEditing(true)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-violet-500 opacity-0 transition group-hover:opacity-100 hover:bg-violet-50">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </td>

      {/* parent_role_key */}
      <td className="px-4 py-3 text-center">
        {record.parent_role_key ? (
          <span className="font-mono text-xs text-slate-500">{record.parent_role_key}</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>

      {/* is_system_required */}
      <td className="px-4 py-3 text-center">
        {record.is_system_required ? (
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-600">{t('roleSettings.required')}</span>
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-400">{t('roleSettings.optional')}</span>
        )}
      </td>

      {/* is_active */}
      <td className="px-4 py-3 text-center">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${record.is_active ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]' : 'bg-slate-300'}`} />
      </td>
    </tr>
  );
}

export default function RoleSettingsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const [records, setRecords] = useState([]);
  const [orgType, setOrgType] = useState(user?.org_type || 'staffing_agency');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const canSwitchOrgType = user?.role === 'admin';
  const orgId = user?.organization_id || null;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await roleTemplateService.list({ sort: 'hierarchy_level', order: 'ASC', limit: 200 });
      setRecords(all);
    } catch (requestError) {
      setError({ status: requestError?.status || requestError?.response?.status || null });
    } finally {
      setLoading(false);
    }
  };

  // For a given org_type, show org-specific overrides if exist, else show global templates
  const getDisplayRecords = () => {
    const orgOverrides = records.filter(r => r.organization_id === orgId && r.org_type === orgType);
    const globalTemplates = records.filter(r => !r.organization_id && r.org_type === orgType);

    // Merge: prefer org override per system_role_key
    const merged = globalTemplates.map(tmpl => {
      const override = orgOverrides.find(o => o.system_role_key === tmpl.system_role_key);
      return override || tmpl;
    });
    return merged.sort((a, b) => a.hierarchy_level - b.hierarchy_level);
  };

  const handleSave = async (record, newDisplayName) => {
    const oldName = record.display_name;

    // Check if org-specific override exists
    const existing = records.find(r =>
      r.organization_id === orgId &&
      r.org_type === record.org_type &&
      r.system_role_key === record.system_role_key
    );

    if (existing) {
      await roleTemplateService.update(existing.id, { display_name: newDisplayName });
    } else {
      // Create org-specific override based on global template
      await roleTemplateService.create({
        organization_id: orgId,
        org_type: record.org_type,
        system_role_key: record.system_role_key,
        display_name: newDisplayName,
        parent_role_key: record.parent_role_key,
        hierarchy_level: record.hierarchy_level,
        is_editable_name: record.is_editable_name,
        is_system_required: record.is_system_required,
        is_active: record.is_active,
      });
    }

    // AuditLog
    await auditService.create({
      organization_id: orgId,
      actor_user_id: user?.id,
      actor_email: user?.email,
      actor_role: user?.role,
      entity_type: 'Organization',
      entity_id: orgId || 'global',
      entity_label: `שם תפקיד: ${record.system_role_key}`,
      action: 'role_display_name_update',
      metadata: {
        system_role_key: record.system_role_key,
        before: oldName,
        after: newDisplayName,
        organization_id: orgId,
        actor_user_id: user?.id,
      },
    });

    await load();
    setSavedMsg(t('roleSettings.saved', { name: newDisplayName }));
    setTimeout(() => setSavedMsg(''), 2500);
  };

  if (!canEdit) {
    return (
      <PlatformPageShell dir={isRtl ? 'rtl' : 'ltr'}>
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={Lock} className="min-h-[60vh]">
            <p className="text-lg font-bold text-slate-600">{t('roleSettings.accessDenied')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('roleSettings.accessDeniedDesc')}</p>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    );
  }

  const displayRecords = getDisplayRecords();
  const activeRoles = displayRecords.filter(record => record.is_active).length;
  const editableRoles = displayRecords.filter(record => record.is_editable_name).length;

  return (
    <PlatformPageShell dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-5">
      {/* Header */}
      <PlatformPageHeader
        title={t('roleSettings.title')}
        subtitle={t('roleSettings.subtitle')}
        icon={Users}
        actions={(
          <>
          {/* org_type toggle */}
          {canSwitchOrgType && <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-1 text-sm">
            <button
              onClick={() => setOrgType('staffing_agency')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all ${orgType === 'staffing_agency' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}
            >
              {t('roleSettings.staffingAgency')}
            </button>
            <button
              onClick={() => setOrgType('organization')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all ${orgType === 'organization' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}
            >
              {t('roleSettings.organization')}
            </button>
          </div>}
          <button onClick={load} disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {savedMsg && (
            <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600">
              <Check className="h-4 w-4" /> {savedMsg}
            </span>
          )}
          </>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlatformStatCard icon={Users} label={t('roleSettings.title')} value={displayRecords.length} tone="violet" meta={orgType === 'staffing_agency' ? t('roleSettings.staffingAgency') : t('roleSettings.organization')} />
        <PlatformStatCard icon={Check} label={t('roleSettings.columns.active')} value={activeRoles} tone="emerald" meta={t('roleSettings.columns.status')} />
        <PlatformStatCard icon={Pencil} label={t('roleSettings.columns.displayName')} value={editableRoles} tone="blue" meta={t('roleSettings.footer')} />
      </div>

      {/* Info banner */}
      <PlatformCard className="border-blue-100 bg-gradient-to-r from-blue-50/90 to-violet-50/70 px-5 py-4 text-sm leading-6 text-blue-700"
        dangerouslySetInnerHTML={{ __html: t('roleSettings.infoBanner') }} />

      {loading ? (
        <PlatformCard className="p-16 text-center text-slate-400">{t('roleSettings.loading')}</PlatformCard>
      ) : error ? (
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={ShieldAlert} className="min-h-72">
            <p className="font-bold text-slate-700">
              {error.status === 403
                ? t('roleSettings.accessDenied')
                : t('common.loadError', { defaultValue: 'Unable to load role settings' })}
            </p>
          </PlatformEmptyState>
        </PlatformCard>
      ) : (
        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader title={t('roleSettings.title')} subtitle={t('roleSettings.subtitle')} />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-4 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.level')}</th>
                <th className="px-4 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.systemRoleKey')}</th>
                <th className="px-4 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.displayName')}</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.parentRole')}</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.status')}</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">{t('roleSettings.columns.active')}</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.map(record => (
                <RoleRow
                  key={record.system_role_key}
                  record={record}
                  canEdit={canEdit}
                  onSave={handleSave}
                  t={t}
                />
              ))}
              {displayRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-5">
                    <PlatformEmptyState icon={Users}>{t('roleSettings.noRoles')}</PlatformEmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </PlatformCard>
      )}

      <p className="text-center text-xs text-slate-400">
        {t('roleSettings.footer')}
      </p>
      </div>
    </PlatformPageShell>
  );
}
