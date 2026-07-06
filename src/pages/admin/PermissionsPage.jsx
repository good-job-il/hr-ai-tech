/**
 * PermissionsPage — Organization Permission Matrix Editor
 * Accessible only by: admin, org_admin
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const [orgType, setOrgType] = useState('staffing_agency');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState({});     // { role_key: boolean }

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const orgId = user?.organization_id || null;

  const roleKeys = orgType === 'staffing_agency' ? STAFFING_ROLE_KEYS : ORG_ROLE_KEYS;
  const roleLabel = (key) =>
    orgType === 'staffing_agency'
      ? t(`permissionsMatrix.staffingRoles.${key}`)
      : t(`permissionsMatrix.orgRoles.${key}`);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.PermissionMatrix.list('', 200);
    setAllRecords(all);
    buildMatrix(all);
    setLoading(false);
    setDirty({});
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
      savedRecord = await base44.entities.PermissionMatrix.update(existing.id, { permissions: perms });
    } else {
      savedRecord = await base44.entities.PermissionMatrix.create({
        organization_id: orgId,
        org_type: orgType,
        role_key: roleKey,
        is_template: false,
        permissions: perms,
      });
    }

    // Audit log
    await base44.functions.invoke('createAuditLog', {
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
      <div className="flex items-center justify-center min-h-[60vh]" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center text-gray-500">
          <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">{t('permissionsMatrix.accessDenied')}</p>
          <p className="text-sm mt-1">{t('permissionsMatrix.accessDeniedDesc')}</p>
        </div>
      </div>
    );
  }

  const hasDirty = Object.keys(dirty).some(k => dirty[k]);
  const stickyColClass = isRtl ? 'sticky right-0' : 'sticky left-0';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t('permissionsMatrix.title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('permissionsMatrix.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* org_type toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setOrgType('staffing_agency')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'staffing_agency' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t('permissionsMatrix.staffingAgency')}
            </button>
            <button
              onClick={() => setOrgType('organization')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'organization' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t('permissionsMatrix.organization')}
            </button>
          </div>
          <button onClick={load} disabled={loading}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || !hasDirty}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-4 h-4" />
            {saving
              ? t('permissionsMatrix.saving')
              : saved
                ? t('permissionsMatrix.saved')
                : t('permissionsMatrix.saveChanges')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t('permissionsMatrix.loading')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className={`${isRtl ? 'text-right' : 'text-left'} px-5 py-3 font-black text-gray-700 w-40 ${stickyColClass} bg-gray-50 z-10`}>
                  {t('permissionsMatrix.roleColumn')}
                </th>
                {PERM_KEYS.map(key => (
                  <th key={key} className="px-3 py-3 font-bold text-gray-600 text-center whitespace-nowrap">
                    {t(`permissionsMatrix.perms.${key}`)}
                  </th>
                ))}
                {hasDirty && (
                  <th className="px-3 py-3 text-center font-bold text-gray-600">
                    {t('permissionsMatrix.save')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {roleKeys.map((roleKey, i) => (
                <tr key={roleKey} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-purple-50/20 transition-colors`}>
                  <td className={`px-5 py-4 ${stickyColClass} bg-inherit z-10`}>
                    <div className="font-bold text-gray-900">{roleLabel(roleKey)}</div>
                    <div className="text-xs text-gray-400 font-mono">{roleKey}</div>
                    {dirty[roleKey] && (
                      <span className="text-xs text-amber-600 font-semibold">{t('permissionsMatrix.modified')}</span>
                    )}
                  </td>
                  {PERM_KEYS.map(permKey => (
                    <td key={permKey} className="px-3 py-4 text-center">
                      <button
                        onClick={() => toggle(roleKey, permKey)}
                        disabled={!canEdit}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all
                          ${matrix[roleKey]?.[permKey]
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-gray-300 hover:border-purple-400'
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
                  {hasDirty && (
                    <td className="px-3 py-4 text-center">
                      {dirty[roleKey] && (
                        <button
                          onClick={async () => {
                            setSaving(true);
                            await saveRole(roleKey);
                            await load();
                            setSaving(false);
                          }}
                          className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200 transition-all"
                        >
                          {t('permissionsMatrix.save')}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        {t('permissionsMatrix.footer')}
      </p>
    </div>
  );
}
