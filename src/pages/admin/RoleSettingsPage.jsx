/**
 * RoleSettingsPage — Phase B-3
 * Editable Role Display Names per org_type
 * Accessible by: super_admin, admin, org_admin
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, RefreshCw, Users, Lock, Pencil, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const EDITABLE_ROLES = ['super_admin', 'admin', 'org_admin'];

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
    <tr className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
      {/* Hierarchy Level */}
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${levelColor}`}>
          {t(`roleSettings.levels.${record.hierarchy_level}`, { defaultValue: String(record.hierarchy_level) })}
        </span>
      </td>

      {/* system_role_key — read only */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
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
              className="h-8 text-sm w-48"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            />
            <button onClick={handleSave} disabled={saving}
              className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleCancel}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="font-semibold text-gray-900">{record.display_name}</span>
            {canEdit && record.is_editable_name && (
              <button onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-purple-50 text-purple-500 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </td>

      {/* parent_role_key */}
      <td className="px-4 py-3 text-center">
        {record.parent_role_key ? (
          <span className="text-xs text-gray-500 font-mono">{record.parent_role_key}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* is_system_required */}
      <td className="px-4 py-3 text-center">
        {record.is_system_required ? (
          <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">{t('roleSettings.required')}</span>
        ) : (
          <span className="text-xs bg-gray-50 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">{t('roleSettings.optional')}</span>
        )}
      </td>

      {/* is_active */}
      <td className="px-4 py-3 text-center">
        <span className={`w-2 h-2 rounded-full inline-block ${record.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
      </td>
    </tr>
  );
}

export default function RoleSettingsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = !i18n.language?.startsWith('en');
  const [records, setRecords] = useState([]);
  const [orgType, setOrgType] = useState('staffing_agency');
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

  const canEdit = EDITABLE_ROLES.includes(user?.role);
  const orgId = user?.organization_id || null;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.RoleTemplate.list('hierarchy_level', 200);
    setRecords(all);
    setLoading(false);
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

    let saved;
    if (existing) {
      saved = await base44.entities.RoleTemplate.update(existing.id, { display_name: newDisplayName });
    } else {
      // Create org-specific override based on global template
      saved = await base44.entities.RoleTemplate.create({
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
    await base44.functions.invoke('createAuditLog', {
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
      <div className="flex items-center justify-center min-h-[60vh]" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="text-center text-gray-500">
          <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">{t('roleSettings.accessDenied')}</p>
          <p className="text-sm mt-1">{t('roleSettings.accessDeniedDesc')}</p>
        </div>
      </div>
    );
  }

  const displayRecords = getDisplayRecords();

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-purple-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t('roleSettings.title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('roleSettings.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="badge" />
          {/* org_type toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setOrgType('staffing_agency')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'staffing_agency' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t('roleSettings.staffingAgency')}
            </button>
            <button
              onClick={() => setOrgType('organization')}
              className={`px-4 py-2 font-semibold transition-all ${orgType === 'organization' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t('roleSettings.organization')}
            </button>
          </div>
          <button onClick={load} disabled={loading}
            className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> {savedMsg}
            </span>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700"
        dangerouslySetInnerHTML={{ __html: t('roleSettings.infoBanner') }}
      />

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t('roleSettings.loading')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-bold text-gray-600 text-center">{t('roleSettings.columns.level')}</th>
                <th className={`px-4 py-3 font-bold text-gray-600 ${isRtl ? 'text-right' : 'text-left'}`}>{t('roleSettings.columns.systemRoleKey')}</th>
                <th className={`px-4 py-3 font-bold text-gray-600 ${isRtl ? 'text-right' : 'text-left'}`}>{t('roleSettings.columns.displayName')}</th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">{t('roleSettings.columns.parentRole')}</th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">{t('roleSettings.columns.status')}</th>
                <th className="px-4 py-3 font-bold text-gray-600 text-center">{t('roleSettings.columns.active')}</th>
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
                  <td colSpan={6} className="text-center py-12 text-gray-400">{t('roleSettings.noRoles')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        {t('roleSettings.footer')}
      </p>
    </div>
  );
}