/**
 * PermissionsPage — Organization Permission Matrix Editor
 * Accessible only by: super_admin, admin, org_admin
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, ShieldCheck, Lock } from 'lucide-react';

const PERM_KEYS = [
  { key: 'view',              label: 'צפייה' },
  { key: 'create',            label: 'יצירה' },
  { key: 'update',            label: 'עריכה' },
  { key: 'delete',            label: 'מחיקה' },
  { key: 'export',            label: 'ייצוא' },
  { key: 'download_cv',       label: 'הורדת CV' },
  { key: 'view_compensation', label: 'צפייה בתגמולים' },
  { key: 'edit_compensation', label: 'עריכת תגמולים' },
  { key: 'manage_users',      label: 'ניהול משתמשים' },
  { key: 'manage_settings',   label: 'הגדרות מערכת' },
];

const STAFFING_ROLES = [
  { key: 'org_admin',           label: 'מנהל ארגון' },
  { key: 'recruitment_manager', label: 'מנהל גיוס' },
  { key: 'team_manager',        label: 'מנהל צוות' },
  { key: 'recruiter',           label: 'רכז גיוס' },
];

const ORG_ROLES = [
  { key: 'org_admin',         label: 'מנהל ארגון' },
  { key: 'hr_manager',        label: 'מנהל HR' },
  { key: 'internal_recruiter',label: 'מגייס פנימי' },
];

const EDITABLE_ROLES = ['super_admin', 'admin', 'org_admin'];

const emptyPerms = () => ({
  view: false, create: false, update: false, delete: false,
  export: false, download_cv: false, view_compensation: false,
  edit_compensation: false, manage_users: false, manage_settings: false,
});

export default function PermissionsPage() {
  const { user } = useAuth();
  const [allRecords, setAllRecords] = useState([]);
  const [matrix, setMatrix] = useState({});   // { role_key: { ...perms } }
  const [orgType, setOrgType] = useState('staffing_agency');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState({});     // { role_key: boolean }

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const orgId = user?.organization_id || null;
  const roles = orgType === 'staffing_agency' ? STAFFING_ROLES : ORG_ROLES;

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
    for (const role of [...STAFFING_ROLES, ...ORG_ROLES]) {
      // Priority: org override > template
      const override = records.find(r =>
        r.organization_id === orgId && r.role_key === role.key && !r.is_template
      );
      const template = records.find(r =>
        r.is_template && r.role_key === role.key
      );
      built[role.key] = { ...(override?.permissions || template?.permissions || emptyPerms()) };
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
      entity_label: `הרשאות תפקיד: ${roleKey}`,
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
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center text-gray-500">
          <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">אין הרשאה לדף זה</p>
          <p className="text-sm mt-1">רק org_admin ומעלה יכולים לנהל הרשאות.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">ניהול הרשאות</h1>
            <p className="text-sm text-gray-500 mt-0.5">Permission Matrix לפי תפקיד</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* org_type toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setOrgType('staffing_agency')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'staffing_agency' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              חברת השמה
            </button>
            <button
              onClick={() => setOrgType('organization')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'organization' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              ארגון
            </button>
          </div>
          <button onClick={load} disabled={loading}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(dirty).filter(k => dirty[k]).length === 0}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-4 h-4" />
            {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור שינויים'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">טוען הרשאות...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-5 py-3 font-black text-gray-700 w-40 sticky right-0 bg-gray-50 z-10">תפקיד</th>
                {PERM_KEYS.map(p => (
                  <th key={p.key} className="px-3 py-3 font-bold text-gray-600 text-center whitespace-nowrap">
                    {p.label}
                  </th>
                ))}
                {Object.keys(dirty).some(k => dirty[k]) && (
                  <th className="px-3 py-3 text-center font-bold text-gray-600">שמור</th>
                )}
              </tr>
            </thead>
            <tbody>
              {roles.map((role, i) => (
                <tr key={role.key} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-purple-50/20 transition-colors`}>
                  <td className="px-5 py-4 sticky right-0 bg-inherit z-10">
                    <div className="font-bold text-gray-900">{role.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{role.key}</div>
                    {dirty[role.key] && (
                      <span className="text-xs text-amber-600 font-semibold">● שונה</span>
                    )}
                  </td>
                  {PERM_KEYS.map(p => (
                    <td key={p.key} className="px-3 py-4 text-center">
                      <button
                        onClick={() => toggle(role.key, p.key)}
                        disabled={!canEdit}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all
                          ${matrix[role.key]?.[p.key]
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'bg-white border-gray-300 hover:border-purple-400'
                          }
                          ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                        `}
                      >
                        {matrix[role.key]?.[p.key] && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  ))}
                  {Object.keys(dirty).some(k => dirty[k]) && (
                    <td className="px-3 py-4 text-center">
                      {dirty[role.key] && (
                        <button
                          onClick={async () => {
                            setSaving(true);
                            await saveRole(role.key);
                            await load();
                            setSaving(false);
                          }}
                          className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-lg hover:bg-purple-200 transition-all"
                        >
                          שמור
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
        שינויים נשמרים per-organization ואינם משפיעים על ארגונים אחרים.
        ברירות מחדל נטענות מ-template גלובלי.
      </p>
    </div>
  );
}