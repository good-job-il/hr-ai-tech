/**
 * PermissionsPage — Organization Permission Matrix Editor
 * Accessible only by: admin, org_admin
 */
import React, { useState, useEffect } from 'react';
import { permissionMatrixService } from '@/api/services/permissionService';
import { auditService } from '@/api/services/auditService';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, ShieldCheck, Lock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from '@/components/platform/PlatformUI';
import { invalidatePermissionMatrixCache } from '@/hooks/usePermissionMatrix';

const PERM_KEYS = [
  'view', 'create', 'update', 'delete', 'export',
  'download_cv', 'view_compensation', 'edit_compensation',
  'manage_users', 'manage_settings',
];

const STAFFING_ROLE_KEYS = ['org_admin', 'recruitment_manager', 'team_manager', 'recruiter'];
const ORG_ROLE_KEYS      = ['org_admin', 'hr_manager', 'internal_recruiter'];

const EDITABLE_ROLES = ['admin', 'org_admin'];

const emptyPerms = () => ({
  view: false, create: false, update: false, delete: false,
  export: false, download_cv: false, view_compensation: false,
  edit_compensation: false, manage_users: false, manage_settings: false,
});

export default function PermissionsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');

  const [allRecords, setAllRecords] = useState([]);
  const [matrix, setMatrix] = useState({});   // { role_key: { ...perms } }
  const [orgType, setOrgType] = useState(user?.org_type || 'staffing_agency');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState({});     // { role_key: boolean }

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const canSwitchOrgType = user?.role === 'admin';
  const orgId = user?.organization_id || null;

  const roleKeys = orgType === 'staffing_agency' ? STAFFING_ROLE_KEYS : ORG_ROLE_KEYS;
  const roleLabel = (key) =>
    orgType === 'staffing_agency'
      ? t(`permissionsMatrix.staffingRoles.${key}`)
      : t(`permissionsMatrix.orgRoles.${key}`);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await permissionMatrixService.list({ limit: 200 });
      setAllRecords(all);
      buildMatrix(all);
      setDirty({});
    } catch (requestError) {
      setError({ status: requestError?.status || requestError?.response?.status || null });
    } finally {
      setLoading(false);
    }
  };

  const buildMatrix = (records) => {
    const built = {};
    for (const roleKey of [...STAFFING_ROLE_KEYS, ...ORG_ROLE_KEYS]) {
      // Priority: org override > template
      const override = records.find(r =>
        r.organization_id === orgId && r.role_key === roleKey && !r.is_template
      );
      const template = records.find(r =>
        r.is_template && r.role_key === roleKey
      );
      built[roleKey] = { ...(override?.permissions || template?.permissions || emptyPerms()) };
    }
    setMatrix(built);
  };

  const toggle = (roleKey, permKey) => {
    if (!canEdit) return;
    setMatrix(prev => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], [permKey]: !prev[roleKey][permKey] }
    }));
    setDirty(prev => ({ ...prev, [roleKey]: true }));
    setSaved(false);
  };

  const saveRole = async (roleKey) => {
    const perms = matrix[roleKey];
    const existing = allRecords.find(r =>
      r.organization_id === orgId && r.role_key === roleKey && !r.is_template
    );
    const oldPerms = existing?.permissions || allRecords.find(r => r.is_template && r.role_key === roleKey)?.permissions || emptyPerms();

    let savedRecord;
    if (existing) {
      savedRecord = await permissionMatrixService.update(existing.id, { permissions: perms });
    } else {
      savedRecord = await permissionMatrixService.create({
        organization_id: orgId,
        org_type: orgType,
        role_key: roleKey,
        is_template: false,
        permissions: perms,
      });
    }

    // Audit log
    await auditService.create({
      organization_id: orgId,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      entity_type: 'Organization',
      entity_id: orgId || 'global',
      entity_label: `Role Permissions: ${roleKey}`,
      action: 'permission_update',
      metadata: { role_key: roleKey, before: oldPerms, after: perms },
    });

    invalidatePermissionMatrixCache({ organizationId: orgId, roleKey });

    return savedRecord;
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const dirtyRoles = Object.keys(dirty).filter(k => dirty[k]);
    await Promise.all(dirtyRoles.map(roleKey => saveRole(roleKey)));
    await load();
    setSaving(false);
    setSaved(true);
  };

  if (!canEdit) {
    return (
      <PlatformPageShell dir={isRtl ? 'rtl' : 'ltr'}>
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={Lock} className="min-h-[60vh]">
            <p className="text-lg font-bold text-slate-600">{t('permissionsMatrix.accessDenied')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('permissionsMatrix.accessDeniedDesc')}</p>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    );
  }

  const hasDirty = Object.keys(dirty).some(k => dirty[k]);
  const stickyColClass = isRtl ? 'sticky right-0' : 'sticky left-0';
  const enabledPermissions = roleKeys.reduce(
    (total, roleKey) => total + Object.values(matrix[roleKey] || {}).filter(Boolean).length,
    0,
  );

  return (
    <PlatformPageShell dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-5">
      {/* Header */}
      <PlatformPageHeader
        title={t('permissionsMatrix.title')}
        subtitle={t('permissionsMatrix.subtitle')}
        icon={ShieldCheck}
        actions={(
          <>
          {/* org_type toggle */}
          {canSwitchOrgType && <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 p-1 text-sm">
            <button
              onClick={() => setOrgType('staffing_agency')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all ${orgType === 'staffing_agency' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}
            >
              {t('permissionsMatrix.staffingAgency')}
            </button>
            <button
              onClick={() => setOrgType('organization')}
              className={`rounded-lg px-4 py-2 font-semibold transition-all ${orgType === 'organization' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}
            >
              {t('permissionsMatrix.organization')}
            </button>
          </div>}
          <button onClick={load} disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || !hasDirty}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving
              ? t('permissionsMatrix.saving')
              : saved
                ? t('permissionsMatrix.saved')
                : t('permissionsMatrix.saveChanges')}
          </Button>
          </>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlatformStatCard icon={ShieldCheck} label={t('permissionsMatrix.roleColumn')} value={roleKeys.length} tone="violet" meta={orgType === 'staffing_agency' ? t('permissionsMatrix.staffingAgency') : t('permissionsMatrix.organization')} />
        <PlatformStatCard icon={Lock} label={t('permissionsMatrix.title')} value={enabledPermissions} tone="blue" meta={t('permissionsMatrix.footer')} />
        <PlatformStatCard icon={Save} label={t('permissionsMatrix.modified')} value={Object.keys(dirty).filter(key => dirty[key]).length} tone={hasDirty ? 'amber' : 'emerald'} meta={saved ? t('permissionsMatrix.saved') : t('permissionsMatrix.saveChanges')} />
      </div>

      {loading ? (
        <PlatformCard className="p-16 text-center text-slate-400">{t('permissionsMatrix.loading')}</PlatformCard>
      ) : error ? (
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={ShieldAlert} className="min-h-72">
            <p className="font-bold text-slate-700">
              {error.status === 403
                ? t('permissionsMatrix.accessDenied')
                : t('common.loadError', { defaultValue: 'Unable to load permissions' })}
            </p>
          </PlatformEmptyState>
        </PlatformCard>
      ) : (
        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader title={t('permissionsMatrix.title')} subtitle={t('permissionsMatrix.subtitle')} />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className={`w-40 px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400 ${stickyColClass} z-10 bg-slate-50`}>
                  {t('permissionsMatrix.roleColumn')}
                </th>
                {PERM_KEYS.map(key => (
                  <th key={key} className="whitespace-nowrap px-3 py-3.5 text-center text-[11px] font-extrabold text-slate-400">
                    {t(`permissionsMatrix.perms.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleKeys.map((roleKey, i) => (
                <tr key={roleKey} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/25'} transition-colors hover:bg-violet-50/30`}>
                  <td className={`px-5 py-4 ${stickyColClass} bg-inherit z-10`}>
                    <div className="font-bold text-slate-900">{roleLabel(roleKey)}</div>
                    <div className="font-mono text-xs text-slate-400">{roleKey}</div>
                    {dirty[roleKey] && (
                      <span className="text-xs text-amber-600 font-semibold">{t('permissionsMatrix.modified')}</span>
                    )}
                  </td>
                  {PERM_KEYS.map(permKey => (
                    <td key={permKey} className="px-3 py-4 text-center">
                      <button
                        onClick={() => toggle(roleKey, permKey)}
                        disabled={!canEdit}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all
                          ${matrix[roleKey]?.[permKey]
                            ? 'gradient-brand border-[#6C4DFF] text-white shadow-[0_4px_10px_rgba(99,72,210,0.28)]'
                            : 'border-slate-200 bg-white hover:border-[#8B5CF6]'
                          }
                          ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                        `}
                      >
                        {matrix[roleKey]?.[permKey] && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </PlatformCard>
      )}

      <p className="text-center text-xs text-slate-400">
        {t('permissionsMatrix.footer')}
      </p>
      </div>
    </PlatformPageShell>
  );
}
