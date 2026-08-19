import { useState, useMemo, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { organizationService } from "@/api/services/organizationService"
import {
  Flag,
  Search,
  Building2,
  Zap,
  BarChart3,
  Users,
  Shield,
  Cpu,
  Globe,
  Layers,
  DollarSign,
} from "lucide-react"

// ─── Feature catalogue ───────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "ai", label: "AI", icon: Cpu },
  { id: "ats", label: "ATS", icon: Layers },
  { id: "import", label: "Import", icon: Globe },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "teams", label: "Teams", icon: Users },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "security", label: "Security", icon: Shield },
]

const FEATURES = [
  {
    id: "ai_matching",
    label: "AI Matching",
    category: "ai",
    description: "Smart candidate–job fit scoring",
  },
  {
    id: "ai_cv_parsing",
    label: "AI CV Parsing",
    category: "ai",
    description: "Automatic CV data extraction",
  },
  {
    id: "custom_pipeline",
    label: "Custom Pipeline Stages",
    category: "ats",
    description: "Add, rename or reorder ATS stages",
  },
  {
    id: "pipeline_automation",
    label: "Pipeline Automation",
    category: "ats",
    description: "Auto-advance candidates on triggers",
  },
  {
    id: "bulk_import",
    label: "Bulk CV Import",
    category: "import",
    description: "Import many CVs at once from files",
  },
  {
    id: "email_parsing",
    label: "Email CV Parsing",
    category: "import",
    description: "Auto-parse CVs received by email",
  },
  {
    id: "advanced_analytics",
    label: "Advanced Analytics",
    category: "analytics",
    description: "Pipeline metrics, time-to-hire reports",
  },
  {
    id: "export_data",
    label: "Data Export",
    category: "analytics",
    description: "Export candidates, jobs and reports",
  },
  {
    id: "multi_team",
    label: "Multi-team Support",
    category: "teams",
    description: "Multiple divisions/teams per org",
  },
  {
    id: "team_performance",
    label: "Team Performance",
    category: "teams",
    description: "Recruiter KPIs and leaderboard",
  },
  {
    id: "compensation_tracking",
    label: "Compensation Tracking",
    category: "finance",
    description: "Fee calculations and placement revenue",
  },
  {
    id: "api_access",
    label: "API Access",
    category: "integrations",
    description: "REST API keys for custom integrations",
  },
  {
    id: "third_party",
    label: "Third-party Integrations",
    category: "integrations",
    description: "Slack, LinkedIn, HR systems",
  },
  {
    id: "audit_log",
    label: "Audit Log",
    category: "security",
    description: "Full per-user activity trail",
  },
  {
    id: "sso",
    label: "SSO / SAML",
    category: "security",
    description: "Single sign-on via corporate IdP",
  },
]

// Default plan → feature matrix
const PLAN_DEFAULTS = {
  trial: {
    ai_matching: false,
    ai_cv_parsing: false,
    custom_pipeline: false,
    pipeline_automation: false,
    bulk_import: false,
    email_parsing: false,
    advanced_analytics: false,
    export_data: false,
    multi_team: false,
    team_performance: false,
    compensation_tracking: false,
    api_access: false,
    third_party: false,
    audit_log: false,
    sso: false,
  },
  starter: {
    ai_matching: true,
    ai_cv_parsing: true,
    custom_pipeline: true,
    pipeline_automation: false,
    bulk_import: true,
    email_parsing: true,
    advanced_analytics: false,
    export_data: true,
    multi_team: false,
    team_performance: false,
    compensation_tracking: false,
    api_access: false,
    third_party: false,
    audit_log: false,
    sso: false,
  },
  pro: {
    ai_matching: true,
    ai_cv_parsing: true,
    custom_pipeline: true,
    pipeline_automation: true,
    bulk_import: true,
    email_parsing: true,
    advanced_analytics: true,
    export_data: true,
    multi_team: true,
    team_performance: true,
    compensation_tracking: true,
    api_access: false,
    third_party: true,
    audit_log: true,
    sso: false,
  },
  enterprise: {
    ai_matching: true,
    ai_cv_parsing: true,
    custom_pipeline: true,
    pipeline_automation: true,
    bulk_import: true,
    email_parsing: true,
    advanced_analytics: true,
    export_data: true,
    multi_team: true,
    team_performance: true,
    compensation_tracking: true,
    api_access: true,
    third_party: true,
    audit_log: true,
    sso: true,
  },
}

const PLAN_COLORS = {
  trial: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  starter: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  pro: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  enterprise: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
}

const PLANS = ["trial", "starter", "pro", "enterprise"]

const LS_KEY = "platform_flag_matrix"

function loadMatrix() {
  try {
    const saved = localStorage.getItem(LS_KEY)

    if (saved) {
      return { ...PLAN_DEFAULTS, ...JSON.parse(saved) }
    }
  } catch {}

  return { ...PLAN_DEFAULTS }
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        ${value ? "border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-500 shadow-[0_4px_12px_rgba(109,75,220,0.25)]" : "border-slate-200 bg-slate-100"}`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200
        ${value ? "translate-x-[20px]" : "translate-x-0.5"}`}
      />
    </button>
  )
}

// ─── Plan Matrix tab ──────────────────────────────────────────────────────────

function PlanMatrixTab() {
  const [matrix, setMatrix] = useState(loadMatrix)

  const [dirty, setDirty] = useState(false)

  const [saved, setSaved] = useState(false)

  const [expandedCats, setExpandedCats] = useState(() => new Set(CATEGORIES.map((c) => c.id)))

  const toggleFeature = (plan, featureId) => {
    setMatrix((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [featureId]: !prev[plan][featureId] },
    }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(matrix))
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setMatrix({ ...PLAN_DEFAULTS })
    localStorage.removeItem(LS_KEY)
    setDirty(false)
  }

  const toggleCat = (catId) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)

      next.has(catId) ? next.delete(catId) : next.add(catId)

      return next
    })
  }

  return (
    <div className="space-y-4">
      <PlatformCard className="p-5">
        <PlatformWidgetHeader
          title="Plan feature matrix"
          subtitle="Define which features are included in each subscription plan. Changes apply to new and renewing organizations."
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset defaults
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  saved
                    ? "bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.2)]"
                    : dirty
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_18px_rgba(99,72,210,0.22)] hover:-translate-y-0.5"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                <Save className="h-3.5 w-3.5" />

                {saved ? "Saved!" : "Save changes"}
              </button>
            </div>
          }
        />
      </PlatformCard>

      {/* Matrix table */}
      <PlatformCard className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Plan header */}
          <div
            className="grid border-b border-slate-100 bg-slate-50/70"
            style={{ gridTemplateColumns: "1fr repeat(4, 120px)" }}
          >
            <div className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
              Feature
            </div>

            {PLANS.map((plan) => {
              const c = PLAN_COLORS[plan]

              return (
                <div key={plan} className="px-3 py-4 text-center">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide ${c.bg} ${c.text} ${c.border}`}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Feature rows grouped by category */}
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon

            const features = FEATURES.filter((f) => f.category === cat.id)

            const expanded = expandedCats.has(cat.id)

            return (
              <div key={cat.id} className="border-b border-slate-100 last:border-0">
                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="grid w-full items-center bg-slate-50/45 transition-colors hover:bg-violet-50/45"
                  style={{ gridTemplateColumns: "1fr repeat(4, 120px)" }}
                >
                  <div className="flex items-center gap-2 px-5 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                      <CatIcon className="h-3.5 w-3.5" />
                    </div>

                    <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                      {cat.label}
                    </span>

                    {expanded ? (
                      <ChevronUp className="ml-auto h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>

                  {PLANS.map((plan) => {
                    const enabledCount = features.filter((f) => matrix[plan]?.[f.id]).length

                    return (
                      <div key={plan} className="px-3 py-3 text-center">
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-400 shadow-sm">
                          {enabledCount}/{features.length}
                        </span>
                      </div>
                    )
                  })}
                </button>

                {/* Feature rows */}
                {expanded &&
                  features.map((feat) => (
                    <div
                      key={feat.id}
                      className="grid items-center border-t border-slate-100 transition-colors hover:bg-violet-50/25"
                      style={{ gridTemplateColumns: "1fr repeat(4, 120px)" }}
                    >
                      <div className="px-5 py-3.5 pl-14">
                        <p className="text-sm font-bold text-slate-800">{feat.label}</p>

                        <p className="mt-0.5 text-xs text-slate-400">{feat.description}</p>
                      </div>

                      {PLANS.map((plan) => (
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
            )
          })}
        </div>
      </PlatformCard>

      <p className="flex items-center gap-1.5 px-1 text-xs font-medium text-slate-400">
        <Info className="h-3.5 w-3.5" />
        Plan matrix is stored locally on this device. Organization-level overrides take precedence.
      </p>
    </div>
  )
}

// ─── Org Overrides tab ────────────────────────────────────────────────────────

function OrgOverridesTab() {
  const [search, setSearch] = useState("")

  const [planFilter, setPlanFilter] = useState("all")

  const [expandedOrg, setExpandedOrg] = useState(null)

  const [saving, setSaving] = useState({})

  const [savedOrgs, setSavedOrgs] = useState({})

  const [localOverrides, setLocalOverrides] = useState({})

  const qc = useQueryClient()

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
    staleTime: 2 * 60 * 1000,
  })

  const filtered = orgs.filter((o) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase())

    const matchPlan = planFilter === "all" || o.plan === planFilter

    return matchSearch && matchPlan
  })

  const getOrgFlags = useCallback(
    (org) => {
      // local edits take precedence over stored settings
      if (localOverrides[org.id] !== undefined) {
        return localOverrides[org.id]
      }

      return org.settings?.feature_flags || {}
    },
    [localOverrides],
  )

  const handleToggleOverride = (org, featureId) => {
    const current = getOrgFlags(org)

    const planDefault = loadMatrix()[org.plan || "trial"]?.[featureId] ?? false

    const currentValue = current[featureId] !== undefined ? current[featureId] : planDefault

    setLocalOverrides((prev) => ({
      ...prev,
      [org.id]: {
        ...getOrgFlags(org),
        [featureId]: !currentValue,
      },
    }))
    setSavedOrgs((prev) => ({ ...prev, [org.id]: false }))
  }

  const handleSaveOrg = async (org) => {
    const flags = localOverrides[org.id]

    if (!flags) {
      return
    }

    setSaving((prev) => ({ ...prev, [org.id]: true }))

    try {
      await organizationService.update(org.id, {
        settings: { ...(org.settings || {}), feature_flags: flags },
      })
      qc.invalidateQueries(["platform-orgs"])
      setSavedOrgs((prev) => ({ ...prev, [org.id]: true }))
      setTimeout(() => setSavedOrgs((prev) => ({ ...prev, [org.id]: false })), 2500)
    } finally {
      setSaving((prev) => ({ ...prev, [org.id]: false }))
    }
  }

  const handleResetOrg = (org) => {
    setLocalOverrides((prev) => {
      const next = { ...prev }

      delete next[org.id]

      return next
    })
  }

  const countOverrides = (org) => {
    const flags = getOrgFlags(org)

    const planDefaults = loadMatrix()[org.plan || "trial"] || {}

    return Object.entries(flags).filter(([k, v]) => planDefaults[k] !== v).length
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <PlatformCard className="p-5">
        <PlatformWidgetHeader
          title="Organization overrides"
          subtitle={`${filtered.length} organizations`}
          action={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr)_210px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organization..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
          >
            <option value="all">All Plans</option>

            {PLANS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </PlatformCard>

      {/* Org list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <PlatformCard key={i} className="animate-pulse p-5">
                <div className="mb-2 h-5 w-48 rounded bg-slate-100" />

                <div className="h-4 w-32 rounded bg-slate-100" />
              </PlatformCard>
            ))
        ) : filtered.length === 0 ? (
          <PlatformCard className="p-5">
            <PlatformEmptyState icon={Search}>No matching organizations</PlatformEmptyState>
          </PlatformCard>
        ) : (
          filtered.map((org) => {
            const plan = org.plan || "trial"

            const c = PLAN_COLORS[plan]

            const isExpanded = expandedOrg === org.id

            const flags = getOrgFlags(org)

            const planDefaults = loadMatrix()[plan] || {}

            const overridesCount = countOverrides(org)

            const isDirty = localOverrides[org.id] !== undefined

            return (
              <PlatformCard key={org.id} className="overflow-hidden">
                {/* Org header row */}
                <button
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-violet-50/35"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-50 text-violet-600">
                    <Building2 className="h-5 w-5" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-slate-900">{org.name}</p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {org.org_type === "staffing_agency" ? "Staffing Agency" : "Internal HR"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${c.bg} ${c.text} ${c.border}`}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </span>

                  {overridesCount > 0 && (
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-orange-600">
                      {overridesCount} override{overridesCount !== 1 ? "s" : ""}
                    </span>
                  )}

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Expanded feature overrides */}
                {isExpanded && (
                  <div className="space-y-5 border-t border-slate-100 bg-slate-50/30 px-5 py-5">
                    {CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon

                      const catFeatures = FEATURES.filter((f) => f.category === cat.id)

                      return (
                        <div key={cat.id}>
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
                              <CatIcon className="h-3.5 w-3.5" />
                            </div>

                            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                              {cat.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {catFeatures.map((feat) => {
                              const planVal = planDefaults[feat.id] ?? false

                              const overrideVal = flags[feat.id]

                              const activeVal = overrideVal !== undefined ? overrideVal : planVal

                              const isOverridden =
                                overrideVal !== undefined && overrideVal !== planVal

                              return (
                                <div
                                  key={feat.id}
                                  className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 transition-all
                                  ${isOverridden ? "border-orange-200 shadow-[0_5px_16px_rgba(251,146,60,0.08)]" : "border-slate-100 hover:border-violet-100"}`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-800">
                                      {feat.label}
                                    </p>

                                    {isOverridden && (
                                      <p className="text-xs font-semibold text-orange-500">
                                        override {planVal ? "(plan: on)" : "(plan: off)"}
                                      </p>
                                    )}
                                  </div>

                                  <Toggle
                                    value={activeVal}
                                    onChange={() => handleToggleOverride(org, feat.id)}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Save / reset actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => handleResetOrg(org)}
                        disabled={!isDirty}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveOrg(org)}
                        disabled={!isDirty || saving[org.id]}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          savedOrgs[org.id]
                            ? "bg-emerald-500 text-white"
                            : isDirty
                              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_18px_rgba(99,72,210,0.2)]"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Save className="h-3.5 w-3.5" />

                        {saving[org.id]
                          ? "Saving…"
                          : savedOrgs[org.id]
                            ? "Saved!"
                            : "Save overrides"}
                      </button>

                      <p className="ml-2 text-xs text-slate-400">
                        Overrides saved to{" "}
                        <code className="rounded bg-slate-100 px-1">
                          Organization.settings.feature_flags
                        </code>
                      </p>
                    </div>
                  </div>
                )}
              </PlatformCard>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FlagsPage() {
  const [tab, setTab] = useState("matrix")

  const stats = useMemo(() => {
    const matrix = loadMatrix()

    const counts = {}

    PLANS.forEach((plan) => {
      counts[plan] = Object.values(matrix[plan] || {}).filter(Boolean).length
    })

    return counts
  }, [])

  return (
    <PlatformPageShell dir="ltr">
      <div className="space-y-5">
        <PlatformPageHeader
          title="Feature Flags"
          subtitle="Control which features are enabled per plan and add per-organization overrides"
          icon={Flag}
          actions={
            <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_25px_rgba(66,81,130,0.07)]">
              <Shield className="h-5 w-5 text-violet-500" />

              <div>
                <p className="text-xs font-bold text-slate-700">
                  {FEATURES.length} platform features
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                  Across {CATEGORIES.length} categories
                </p>
              </div>
            </div>
          }
        />

        {/* Plan stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlatformStatCard
              key={plan}
              icon={Flag}
              label={plan.charAt(0).toUpperCase() + plan.slice(1)}
              value={stats[plan]}
              suffix={`/${FEATURES.length}`}
              tone={
                plan === "trial"
                  ? "amber"
                  : plan === "starter"
                    ? "blue"
                    : plan === "pro"
                      ? "violet"
                      : "emerald"
              }
              meta="features enabled"
            />
          ))}
        </div>

        {/* Tabs */}
        <PlatformCard className="inline-flex max-w-full items-center gap-1 overflow-x-auto p-1.5">
          {[
            { id: "matrix", label: "Plan Matrix", icon: Layers },
            { id: "overrides", label: "Org Overrides", icon: Building2 },
          ].map((item) => {
            const TabIcon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex min-w-max items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                  tab === item.id
                    ? "gradient-brand text-white shadow-[0_8px_20px_rgba(103,78,218,0.25)]"
                    : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <TabIcon className="h-4 w-4" />

                {item.label}
              </button>
            )
          })}
        </PlatformCard>

        {tab === "matrix" ? <PlanMatrixTab /> : <OrgOverridesTab />}
      </div>
    </PlatformPageShell>
  )
}
