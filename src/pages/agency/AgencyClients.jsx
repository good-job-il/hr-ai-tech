import { Button } from "@/components/ui/button"
import {
  PlatformPageShell,
  PlatformPageHeader,
  PlatformCard,
  PlatformStatCard,
  PlatformModal,
  platformFieldClassName,
} from "@/components/platform/PlatformUI"
import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/AuthContext"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { agencyClientService } from "@/api/services/agencyClientService"
import { toast } from "sonner"
import { Building2, Briefcase, Users, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"

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
  if (!value || INDUSTRY_KEYS.includes(value)) {
    return value
  }

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
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  if (!isOpen) {
    return null
  }

  const dir = i18n.language?.startsWith("he") ? "rtl" : "ltr"

  return (
    <PlatformModal
      title={t("agencyClients.createModal.title")}
      icon={Building2}
      onClose={onClose}
      dir={dir}
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("agencyClients.createModal.clientName")} *
          </label>

          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("agencyClients.createModal.namePlaceholder")}
            className={platformFieldClassName}
            autoFocus
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("agencyClients.createModal.industry")}
          </label>

          <select
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            className={platformFieldClassName}
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
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("agencyClients.createModal.contactEmail")}
          </label>

          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="hr@company.com"
            className={platformFieldClassName}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            {t("agencyClients.createModal.website")}
          </label>

          <input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://company.com"
            className={platformFieldClassName}
          />
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
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
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 text-sm transition-colors"
          >
            {t("agencyClients.createModal.cancel")}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-2.5 gradient-brand text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 text-sm transition-colors"
          >
            {saving
              ? t("agencyClients.createModal.creating")
              : t("agencyClients.createModal.create")}
          </button>
        </div>
      </div>
    </PlatformModal>
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
      className="rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_38px_rgba(54,74,138,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(77,70,170,0.13)] hover:border-violet-200 block group"
    >
      <div className="flex items-start gap-4 mb-4">
        <CompanyAvatar company={company} />

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-base leading-tight truncate group-hover:text-violet-700 transition-colors">
            {company.name}
          </h3>

          {company.industry && (
            <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {getIndustryLabel(company.industry, t)}
            </span>
          )}
        </div>

        <DirectionIcon className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1 group-hover:text-violet-400 transition-colors" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-xl font-black text-slate-900">{company.openJobs}</p>

          <p className="text-xs text-slate-500 font-semibold mt-0.5">
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
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Mail className="w-3.5 h-3.5" />

          <span className="truncate">{company.contact_email}</span>
        </div>
      )}
    </Link>
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
        if (b.isActive !== a.isActive) {
          return b.isActive - a.isActive
        }

        return a.name.localeCompare(b.name, i18n.language?.startsWith("he") ? "he" : "en")
      })
  }, [clients, i18n.language])

  // ── Filters ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return clientsWithStats.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      if (filterIndustry && getIndustryKey(c.industry, t) !== filterIndustry) {
        return false
      }

      if (filterActive === "active" && !c.isActive) {
        return false
      }

      if (filterActive === "inactive" && c.isActive) {
        return false
      }

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
    <PlatformPageShell dir={dir}>
      <div className="space-y-5">
        <PlatformPageHeader
          title={t("agencyClients.title")}
          subtitle={t("agencyClients.subtitle")}
          icon={Building2}
          actions={
            canManageClients && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreate(true)}
                className="shadow-[0_12px_28px_rgba(99,72,210,0.25)]"
              >
                <Plus className="w-4 h-4" />
                {t("agencyClients.newClient")}
              </Button>
            )
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <PlatformStatCard
            icon={Building2}
            label={t("agencyClients.stats.totalClients")}
            value={totals.total}
            tone="violet"
            loading={loading}
          />

          <PlatformStatCard
            icon={TrendingUp}
            label={t("agencyClients.stats.activeClients")}
            value={totals.active}
            tone="blue"
            loading={loading}
          />

          <PlatformStatCard
            icon={Briefcase}
            label={t("agencyClients.stats.openJobs")}
            value={totals.openJobs}
            tone="amber"
            loading={loading}
          />

          <PlatformStatCard
            icon={Users}
            label={t("agencyClients.stats.candidatesInProcess")}
            value={totals.inProcess}
            tone="emerald"
            loading={loading}
          />
        </div>

        {/* Filters bar */}
        <PlatformCard className="p-5">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative w-full min-w-0 sm:min-w-56 sm:flex-1">
              <Search
                className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`}
              />

              <input
                type="text"
                aria-label={t("agencyClients.filters.searchPlaceholder")}
                placeholder={t("agencyClients.filters.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2.5 border border-slate-200 bg-slate-50/70 rounded-xl outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50 text-sm`}
              />
            </div>

            {/* Industry */}
            {industries.length > 0 && (
              <select
                aria-label={t("agencyClients.filters.allIndustries")}
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 bg-slate-50/70 rounded-xl outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50 text-sm"
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
            <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100/70 p-1 text-sm font-bold">
              {[
                { val: "all", label: t("agencyClients.filters.all") },
                { val: "active", label: t("agencyClients.filters.active") },
                { val: "inactive", label: t("agencyClients.filters.inactive") },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setFilterActive(opt.val)}
                  aria-pressed={filterActive === opt.val}
                  className={`rounded-xl px-4 py-2 transition-all ${
                    filterActive === opt.val
                      ? "gradient-brand text-white shadow-[0_8px_20px_rgba(103,78,218,0.25)]"
                      : "text-slate-500 hover:bg-white hover:text-violet-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="mt-3 text-xs text-slate-400 font-medium">
              {t("agencyClients.results.count", { count: filtered.length })}
            </p>
          )}
        </PlatformCard>

        {/* Grid */}
        {clientsError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">{t("agencyClients.loadError")}</p>

            <button
              onClick={() => refetch()}
              className="mt-3 text-sm font-bold text-violet-700 hover:underline"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[22px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_38px_rgba(54,74,138,0.08)] animate-pulse"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-32" />

                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-14 bg-slate-50 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white/90 rounded-[22px] border border-white/80 shadow-[0_12px_38px_rgba(54,74,138,0.08)]">
            <Building2 className="w-14 h-14 text-slate-200 mx-auto mb-4" />

            <p className="text-slate-600 font-black text-lg">
              {search || filterIndustry || filterActive !== "all"
                ? t("agencyClients.results.noMatchingClients")
                : t("agencyClients.results.noClients")}
            </p>

            {!search && !filterIndustry && filterActive === "all" && canManageClients && (
              <>
                <p className="text-slate-400 text-sm mt-1 mb-4">
                  {t("agencyClients.results.addFirstClient")}
                </p>

                <button
                  onClick={() => setShowCreate(true)}
                  className="px-5 py-2.5 gradient-brand text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
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
    </PlatformPageShell>
  )
}
import { Link } from "react-router-dom"
import { Plus, Search, Mail } from "lucide-react"
