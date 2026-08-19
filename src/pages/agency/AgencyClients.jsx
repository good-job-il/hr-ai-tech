import React, { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { agencyClientService } from "@/api/services/agencyClientService"
import { toast } from "sonner"
import {
  Building2,
  Plus,
  Search,
  Briefcase,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Mail,
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRY_KEYS = [
  "hitech",
  "finance",
  "manufacturing",
  "retail",
  "services",
  "healthcare",
  "education",
  "realestate",
  "logistics",
  "communications",
  "other",
]

const PALETTE = [
  "#7C3AED",
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#0891B2",
  "#9333EA",
  "#EA580C",
  "#65A30D",
  "#0F766E",
]

const STALE_TIME = 3 * 60 * 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??"
  )
}

function getIndustryKey(value, t) {
  if (!value || INDUSTRY_KEYS.includes(value)) return value

  return (
    INDUSTRY_KEYS.find(
      (key) =>
        t(`agencyClients.industries.${key}`, { lng: "en" }) === value ||
        t(`agencyClients.industries.${key}`, { lng: "he" }) === value,
    ) || value
  )
}

function getIndustryLabel(value, t) {
  const key = getIndustryKey(value, t)
  return INDUSTRY_KEYS.includes(key) ? t(`agencyClients.industries.${key}`) : value
}

function CompanyAvatar({ company, size = "md" }) {
  const sz = size === "lg" ? "w-16 h-16 text-lg" : "w-12 h-12 text-sm"
  const color = company.color || PALETTE[0]
  const initials = company.initials || getInitials(company.name)

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sz} rounded-xl object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center text-white font-black flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

// ─── Create Client Modal ──────────────────────────────────────────────────────

function CreateClientModal({ isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState({
    name: "",
    industry: "",
    contact_email: "",
    website: "",
    color: PALETTE[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError(t("agencyClients.createModal.clientNameRequired"))
      return
    }
    setError("")
    setSaving(true)
    try {
      await agencyClientService.create({
        name: form.name.trim(),
        industry: form.industry || undefined,
        contact_email: form.contact_email || undefined,
        website: form.website || undefined,
        initials: getInitials(form.name),
        color: form.color,
        status: "active",
      })
      setForm({ name: "", industry: "", contact_email: "", website: "", color: PALETTE[0] })
      toast.success(t("agencyClients.createModal.success"))
      onClose()
      onSuccess?.()
    } catch (err) {
      setError(err.message || t("agencyClients.createModal.errorCreating"))
    } finally {
      setSaving(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit()
  }

  if (!isOpen) return null

  const dir = i18n.language?.startsWith("he") ? "rtl" : "ltr"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" dir={dir}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">
            {t("agencyClients.createModal.title")}
          </h3>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClients.createModal.clientName")} *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={handleKey}
              placeholder={t("agencyClients.createModal.namePlaceholder")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
              autoFocus
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClients.createModal.industry")}
            </label>
            <select
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm bg-white"
            >
              <option value="">{t("agencyClients.createModal.selectIndustry")}</option>
              {INDUSTRY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`agencyClients.industries.${key}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Contact email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClients.createModal.contactEmail")}
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="hr@company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClients.createModal.website")}
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t("agencyClients.createModal.color")}
            </label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    form.color === c
                      ? "scale-125 ring-2 ring-offset-1 ring-gray-400"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-sm transition-colors"
            >
              {t("agencyClients.createModal.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors"
            >
              {saving
                ? t("agencyClients.createModal.creating")
                : t("agencyClients.createModal.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({ company }) {
  const { t, i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const DirectionIcon = isRtl ? ChevronLeft : ChevronRight
  return (
    <Link
      to={`/agency/clients/${company.id}`}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-purple-100 transition-all block group"
    >
      <div className="flex items-start gap-4 mb-4">
        <CompanyAvatar company={company} />
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-base leading-tight truncate group-hover:text-purple-700 transition-colors">
            {company.name}
          </h3>
          {company.industry && (
            <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {getIndustryLabel(company.industry, t)}
            </span>
          )}
        </div>
        <DirectionIcon className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1 group-hover:text-purple-400 transition-colors" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-xl font-black text-gray-900">{company.openJobs}</p>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {t("agencyClients.stats.jobs")}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2.5">
          <p className="text-xl font-black text-amber-700">{company.inProcess}</p>
          <p className="text-xs text-amber-600 font-semibold mt-0.5">
            {t("agencyClients.stats.inProcess")}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5">
          <p className="text-xl font-black text-emerald-700">{company.hired}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            {t("agencyClients.stats.hired")}
          </p>
        </div>
      </div>

      {company.contact_email && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <Mail className="w-3.5 h-3.5" />
          <span className="truncate">{company.contact_email}</span>
        </div>
      )}
    </Link>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, loading }) {
  const colors = {
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  }
  const c = colors[color] || colors.purple
  return (
    <div className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-gray-900">{value ?? 0}</p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgencyClients() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { can } = usePermissionMatrix()
  const orgId = user?.organization_id
  const canManageClients =
    ["org_admin", "recruitment_manager", "admin"].includes(user?.role) && can("create")
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [filterIndustry, setFilterIndustry] = useState("")
  const [filterActive, setFilterActive] = useState("all") // 'all' | 'active' | 'inactive'
  const [showCreate, setShowCreate] = useState(false)

  const dir = i18n.language?.startsWith("he") ? "rtl" : "ltr"

  // ── Data queries ─────────────────────────────────────────────────────────

  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
    refetch,
  } = useQuery({
    queryKey: ["agency-clients-list", orgId],
    queryFn: () => agencyClientService.list({ limit: 300, sort: "name", order: "ASC" }),
    enabled: !!orgId,
    staleTime: STALE_TIME,
  })

  const loading = clientsLoading

  // ── Compute clients with stats ────────────────────────────────────────────

  const clientsWithStats = useMemo(() => {
    return clients
      .filter((client) => client.status !== "archived")
      .sort((a, b) => {
        // Active clients first, then by name
        if (b.isActive !== a.isActive) return b.isActive - a.isActive
        return a.name.localeCompare(b.name, i18n.language?.startsWith("he") ? "he" : "en")
      })
  }, [clients, i18n.language])

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return clientsWithStats.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterIndustry && getIndustryKey(c.industry, t) !== filterIndustry) return false
      if (filterActive === "active" && !c.isActive) return false
      if (filterActive === "inactive" && c.isActive) return false
      return true
    })
  }, [clientsWithStats, search, filterIndustry, filterActive, t])

  const industries = useMemo(() => {
    const set = new Set(clientsWithStats.map((c) => getIndustryKey(c.industry, t)).filter(Boolean))
    return [...set].sort((a, b) =>
      getIndustryLabel(a, t).localeCompare(getIndustryLabel(b, t), i18n.language),
    )
  }, [clientsWithStats, i18n.language, t])

  // ── Aggregate stats ───────────────────────────────────────────────────────

  const totals = useMemo(
    () => ({
      total: clientsWithStats.length,
      active: clientsWithStats.filter((c) => c.isActive).length,
      openJobs: clientsWithStats.reduce((s, c) => s + c.openJobs, 0),
      inProcess: clientsWithStats.reduce((s, c) => s + c.inProcess, 0),
    }),
    [clientsWithStats],
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div dir={dir} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t("agencyClients.title")}</h1>
          <p className="text-gray-500 mt-1 font-semibold">{t("agencyClients.subtitle")}</p>
        </div>
        {canManageClients && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("agencyClients.newClient")}
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label={t("agencyClients.stats.totalClients")}
          value={totals.total}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label={t("agencyClients.stats.activeClients")}
          value={totals.active}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={Briefcase}
          label={t("agencyClients.stats.openJobs")}
          value={totals.openJobs}
          color="amber"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label={t("agencyClients.stats.candidatesInProcess")}
          value={totals.inProcess}
          color="green"
          loading={loading}
        />
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search
            className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
          />
          <input
            type="text"
            placeholder={t("agencyClients.filters.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm`}
          />
        </div>

        {/* Industry */}
        {industries.length > 0 && (
          <select
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm bg-white"
          >
            <option value="">{t("agencyClients.filters.allIndustries")}</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {getIndustryLabel(i, t)}
              </option>
            ))}
          </select>
        )}

        {/* Active filter */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-bold">
          {[
            { val: "all", label: t("agencyClients.filters.all") },
            { val: "active", label: t("agencyClients.filters.active") },
            { val: "inactive", label: t("agencyClients.filters.inactive") },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setFilterActive(opt.val)}
              className={`px-4 py-2.5 transition-colors ${
                filterActive === opt.val
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-400 font-semibold -mt-2">
          {t("agencyClients.results.count", { count: filtered.length })}
        </p>
      )}

      {/* Grid */}
      {clientsError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <p className="font-bold text-red-700">{t("agencyClients.loadError")}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm font-bold text-purple-700 hover:underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-14 bg-gray-50 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-black text-lg">
            {search || filterIndustry || filterActive !== "all"
              ? t("agencyClients.results.noMatchingClients")
              : t("agencyClients.results.noClients")}
          </p>
          {!search && !filterIndustry && filterActive === "all" && canManageClients && (
            <>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                {t("agencyClients.results.addFirstClient")}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
              >
                + {t("agencyClients.newClient")}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <ClientCard key={company.id} company={company} />
          ))}
        </div>
      )}

      {canManageClients && (
        <CreateClientModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["agency-clients-list", orgId] })
            queryClient.invalidateQueries({ queryKey: ["agency-clients", orgId] })
          }}
        />
      )}
    </div>
  )
}
