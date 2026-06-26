import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Flag, Search, Building2, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Zap, BarChart3, Users, Shield, Cpu, Globe, Layers, DollarSign, Save,
  RotateCcw, Info,
} from 'lucide-react';

// ─── Feature catalogue ───────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'ai',           label: 'AI',              icon: Cpu },
  { id: 'ats',          label: 'ATS',             icon: Layers },
  { id: 'import',       label: 'Import',          icon: Globe },
  { id: 'analytics',    label: 'Analytics',       icon: BarChart3 },
  { id: 'teams',        label: 'Teams',           icon: Users },
  { id: 'finance',      label: 'Finance',         icon: DollarSign },
  { id: 'integrations', label: 'Integrations',    icon: Zap },
  { id: 'security',     label: 'Security',        icon: Shield },
];

const FEATURES = [
  { id: 'ai_matching',         label: 'AI Matching',              category: 'ai',           description: 'Smart candidate–job fit scoring' },
  { id: 'ai_cv_parsing',       label: 'AI CV Parsing',            category: 'ai',           description: 'Automatic CV data extraction' },
  { id: 'custom_pipeline',     label: 'Custom Pipeline Stages',   category: 'ats',          description: 'Add, rename or reorder ATS stages' },
  { id: 'pipeline_automation', label: 'Pipeline Automation',      category: 'ats',          description: 'Auto-advance candidates on triggers' },
  { id: 'bulk_import',         label: 'Bulk CV Import',           category: 'import',       description: 'Import many CVs at once from files' },
  { id: 'email_parsing',       label: 'Email CV Parsing',         category: 'import',       description: 'Auto-parse CVs received by email' },
  { id: 'advanced_analytics',  label: 'Advanced Analytics',       category: 'analytics',    description: 'Pipeline metrics, time-to-hire reports' },
  { id: 'export_data',         label: 'Data Export',              category: 'analytics',    description: 'Export candidates, jobs and reports' },
  { id: 'multi_team',          label: 'Multi-team Support',       category: 'teams',        description: 'Multiple divisions/teams per org' },
  { id: 'team_performance',    label: 'Team Performance',         category: 'teams',        description: 'Recruiter KPIs and leaderboard' },
  { id: 'compensation_tracking', label: 'Compensation Tracking', category: 'finance',      description: 'Fee calculations and placement revenue' },
  { id: 'api_access',          label: 'API Access',               category: 'integrations', description: 'REST API keys for custom integrations' },
  { id: 'third_party',         label: 'Third-party Integrations', category: 'integrations', description: 'Slack, LinkedIn, HR systems' },
  { id: 'audit_log',           label: 'Audit Log',                category: 'security',     description: 'Full per-user activity trail' },
  { id: 'sso',                 label: 'SSO / SAML',               category: 'security',     description: 'Single sign-on via corporate IdP' },
];

// Default plan → feature matrix
const PLAN_DEFAULTS = {
  trial: {
    ai_matching: false, ai_cv_parsing: false, custom_pipeline: false,
    pipeline_automation: false, bulk_import: false, email_parsing: false,
    advanced_analytics: false, export_data: false, multi_team: false,
    team_performance: false, compensation_tracking: false, api_access: false,
    third_party: false, audit_log: false, sso: false,
  },
  starter: {
    ai_matching: true, ai_cv_parsing: true, custom_pipeline: true,
    pipeline_automation: false, bulk_import: true, email_parsing: true,
    advanced_analytics: false, export_data: true, multi_team: false,
    team_performance: false, compensation_tracking: false, api_access: false,
    third_party: false, audit_log: false, sso: false,
  },
  pro: {
    ai_matching: true, ai_cv_parsing: true, custom_pipeline: true,
    pipeline_automation: true, bulk_import: true, email_parsing: true,
    advanced_analytics: true, export_data: true, multi_team: true,
    team_performance: true, compensation_tracking: true, api_access: false,
    third_party: true, audit_log: true, sso: false,
  },
  enterprise: {
    ai_matching: true, ai_cv_parsing: true, custom_pipeline: true,
    pipeline_automation: true, bulk_import: true, email_parsing: true,
    advanced_analytics: true, export_data: true, multi_team: true,
    team_performance: true, compensation_tracking: true, api_access: true,
    third_party: true, audit_log: true, sso: true,
  },
};

const PLAN_COLORS = {
  trial:      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  starter:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  pro:        { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  enterprise: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const PLANS = ['trial', 'starter', 'pro', 'enterprise'];

const LS_KEY = 'platform_flag_matrix';

function loadMatrix() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) return { ...PLAN_DEFAULTS, ...JSON.parse(saved) };
  } catch {}
  return { ...PLAN_DEFAULTS };
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        ${value ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── Plan Matrix tab ──────────────────────────────────────────────────────────

function PlanMatrixTab() {
  const [matrix, setMatrix] = useState(loadMatrix);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedCats, setExpandedCats] = useState(() => new Set(CATEGORIES.map(c => c.id)));

  const toggleFeature = (plan, featureId) => {
    setMatrix(prev => ({
      ...prev,
      [plan]: { ...prev[plan], [featureId]: !prev[plan][featureId] },
    }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(matrix));
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setMatrix({ ...PLAN_DEFAULTS });
    localStorage.removeItem(LS_KEY);
    setDirty(false);
  };

  const toggleCat = (catId) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 font-semibold">
          Define which features are included in each subscription plan. Changes apply to new and renewing organizations.
        </p>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset defaults
          </button>
          <button onClick={handleSave} disabled={!dirty}
            className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-bold transition-colors
              ${saved ? 'bg-emerald-500 text-white' : dirty ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Plan header */}
        <div className="grid bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: '1fr repeat(4, 120px)' }}>
          <div className="px-5 py-3 font-black text-gray-600 text-sm">Feature</div>
          {PLANS.map(plan => {
            const c = PLAN_COLORS[plan];
            return (
              <div key={plan} className="px-3 py-3 text-center">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Feature rows grouped by category */}
        {CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          const features = FEATURES.filter(f => f.category === cat.id);
          const expanded = expandedCats.has(cat.id);
          return (
            <div key={cat.id} className="border-b border-gray-50 last:border-0">
              {/* Category header */}
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full grid items-center bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                style={{ gridTemplateColumns: '1fr repeat(4, 120px)' }}
              >
                <div className="px-5 py-2.5 flex items-center gap-2">
                  <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">{cat.label}</span>
                  {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />}
                </div>
                {PLANS.map(plan => {
                  const enabledCount = features.filter(f => matrix[plan]?.[f.id]).length;
                  return (
                    <div key={plan} className="px-3 py-2.5 text-center">
                      <span className="text-xs text-slate-400 font-semibold">{enabledCount}/{features.length}</span>
                    </div>
                  );
                })}
              </button>

              {/* Feature rows */}
              {expanded && features.map(feat => (
                <div key={feat.id}
                  className="grid items-center border-t border-gray-50 hover:bg-gray-50/60 transition-colors"
                  style={{ gridTemplateColumns: '1fr repeat(4, 120px)' }}>
                  <div className="px-5 py-3 pl-9">
                    <p className="text-sm font-bold text-gray-800">{feat.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{feat.description}</p>
                  </div>
                  {PLANS.map(plan => (
                    <div key={plan} className="px-3 py-3 flex justify-center">
                      <Toggle
                        value={!!matrix[plan]?.[feat.id]}
                        onChange={() => toggleFeature(plan, feat.id)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        Plan matrix is stored locally on this device. Organization-level overrides take precedence.
      </p>
    </div>
  );
}

// ─── Org Overrides tab ────────────────────────────────────────────────────────

function OrgOverridesTab() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [saving, setSaving] = useState({});
  const [savedOrgs, setSavedOrgs] = useState({});
  const [localOverrides, setLocalOverrides] = useState({});
  const qc = useQueryClient();

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['platform-orgs'],
    queryFn: () => base44.entities.Organization.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || o.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const getOrgFlags = useCallback((org) => {
    // local edits take precedence over stored settings
    if (localOverrides[org.id] !== undefined) return localOverrides[org.id];
    return org.settings?.feature_flags || {};
  }, [localOverrides]);

  const handleToggleOverride = (org, featureId) => {
    const current = getOrgFlags(org);
    const planDefault = loadMatrix()[org.plan || 'trial']?.[featureId] ?? false;
    const currentValue = current[featureId] !== undefined ? current[featureId] : planDefault;

    setLocalOverrides(prev => ({
      ...prev,
      [org.id]: {
        ...getOrgFlags(org),
        [featureId]: !currentValue,
      },
    }));
    setSavedOrgs(prev => ({ ...prev, [org.id]: false }));
  };

  const handleSaveOrg = async (org) => {
    const flags = localOverrides[org.id];
    if (!flags) return;
    setSaving(prev => ({ ...prev, [org.id]: true }));
    try {
      await base44.entities.Organization.update(org.id, {
        settings: { ...(org.settings || {}), feature_flags: flags },
      });
      qc.invalidateQueries(['platform-orgs']);
      setSavedOrgs(prev => ({ ...prev, [org.id]: true }));
      setTimeout(() => setSavedOrgs(prev => ({ ...prev, [org.id]: false })), 2500);
    } finally {
      setSaving(prev => ({ ...prev, [org.id]: false }));
    }
  };

  const handleResetOrg = (org) => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      delete next[org.id];
      return next;
    });
  };

  const countOverrides = (org) => {
    const flags = getOrgFlags(org);
    const planDefaults = loadMatrix()[org.plan || 'trial'] || {};
    return Object.entries(flags).filter(([k, v]) => planDefaults[k] !== v).length;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search organization..."
            className="outline-none text-sm w-full bg-transparent" />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none">
          <option value="all">All Plans</option>
          {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} organizations</span>
      </div>

      {/* Org list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
            No matching organizations
          </div>
        ) : filtered.map(org => {
          const plan = org.plan || 'trial';
          const c = PLAN_COLORS[plan];
          const isExpanded = expandedOrg === org.id;
          const flags = getOrgFlags(org);
          const planDefaults = loadMatrix()[plan] || {};
          const overridesCount = countOverrides(org);
          const isDirty = localOverrides[org.id] !== undefined;

          return (
            <div key={org.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Org header row */}
              <button
                onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{org.name}</p>
                  <p className="text-xs text-gray-400">{org.org_type === 'staffing_agency' ? 'Staffing Agency' : 'Internal HR'}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
                {overridesCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                    {overridesCount} override{overridesCount !== 1 ? 's' : ''}
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {/* Expanded feature overrides */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                  {CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    const catFeatures = FEATURES.filter(f => f.category === cat.id);
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wide">{cat.label}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {catFeatures.map(feat => {
                            const planVal = planDefaults[feat.id] ?? false;
                            const overrideVal = flags[feat.id];
                            const activeVal = overrideVal !== undefined ? overrideVal : planVal;
                            const isOverridden = overrideVal !== undefined && overrideVal !== planVal;

                            return (
                              <div key={feat.id}
                                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors
                                  ${isOverridden ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-gray-50/40'}`}>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{feat.label}</p>
                                  {isOverridden && (
                                    <p className="text-xs text-orange-500 font-semibold">
                                      override {planVal ? '(plan: on)' : '(plan: off)'}
                                    </p>
                                  )}
                                </div>
                                <Toggle value={activeVal} onChange={() => handleToggleOverride(org, feat.id)} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Save / reset actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleResetOrg(org)} disabled={!isDirty}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                    <button onClick={() => handleSaveOrg(org)} disabled={!isDirty || saving[org.id]}
                      className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl font-bold transition-colors
                        ${savedOrgs[org.id] ? 'bg-emerald-500 text-white' : isDirty ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                      <Save className="w-3.5 h-3.5" />
                      {saving[org.id] ? 'Saving…' : savedOrgs[org.id] ? 'Saved!' : 'Save overrides'}
                    </button>
                    <p className="text-xs text-gray-400 ml-2">
                      Overrides saved to <code className="bg-gray-100 px-1 rounded">Organization.settings.feature_flags</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FlagsPage() {
  const [tab, setTab] = useState('matrix');

  const stats = useMemo(() => {
    const matrix = loadMatrix();
    const counts = {};
    PLANS.forEach(plan => {
      counts[plan] = Object.values(matrix[plan] || {}).filter(Boolean).length;
    });
    return counts;
  }, []);

  return (
    <div dir="ltr" className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Feature Flags</h1>
        <p className="text-slate-500 mt-1 font-semibold">
          Control which features are enabled per plan and add per-organization overrides
        </p>
      </div>

      {/* Plan stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const c = PLAN_COLORS[plan];
          return (
            <div key={plan} className={`rounded-2xl p-5 ${c.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Flag className={`w-4 h-4 ${c.text} opacity-70`} />
                <span className={`text-xs font-black uppercase tracking-wide ${c.text} opacity-70`}>{plan}</span>
              </div>
              <p className={`text-2xl font-black ${c.text}`}>{stats[plan]}</p>
              <p className={`text-xs font-semibold mt-0.5 ${c.text} opacity-70`}>
                of {FEATURES.length} features enabled
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'matrix', label: 'Plan Matrix' },
          { id: 'overrides', label: 'Org Overrides' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-black rounded-lg transition-colors
              ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'matrix' ? <PlanMatrixTab /> : <OrgOverridesTab />}
    </div>
  );
}
