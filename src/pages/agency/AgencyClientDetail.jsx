import { useTranslation, Trans } from "react-i18next"
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { agencyClientService } from "@/api/services/agencyClientService"
import { jobService } from "@/api/services/jobService"
import { applicationService } from "@/api/services/applicationService"
import { toast } from "sonner"
import { Building2, Briefcase, Users, Mail, Globe, Phone, MapPin } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
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

const APPLICATION_STATUS = {
  new: { label: "agencyClientDetail.status_new", bg: "bg-blue-50", text: "text-blue-700" },
  reviewed: {
    label: "agencyClientDetail.status_reviewed",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
  phone_interview: {
    label: "agencyClientDetail.status_phone_interview",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  recommended: {
    label: "agencyClientDetail.status_recommended",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  employer_interview: {
    label: "agencyClientDetail.status_employer_interview",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
  offer: { label: "agencyClientDetail.status_offer", bg: "bg-sky-50", text: "text-sky-700" },
  hired: {
    label: "agencyClientDetail.status_hired",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  probation: {
    label: "agencyClientDetail.status_probation",
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
  completed: {
    label: "agencyClientDetail.status_completed",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  rejected: { label: "agencyClientDetail.status_rejected", bg: "bg-red-50", text: "text-red-700" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIndustryKey(value, t) {
  return (
    INDUSTRY_OPTIONS.find(
      (key) =>
        key === value ||
        ["he", "en"].some((lng) => t(`agencyClients.industries.${key}`, { lng }) === value),
    ) || value
  )
}

function getIndustryLabel(value, t) {
  const key = getIndustryKey(value, t)

  return INDUSTRY_OPTIONS.includes(key) ? t(`agencyClients.industries.${key}`) : value
}

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

function CompanyAvatar({ company, size = "lg" }) {
  const sz = size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-sm"

  const color = company.color || "#7C3AED"

  const initials = company.initials || getInitials(company.name)

  if (company.logo_url) {
    return (
      <img
        src={company.logo_url}
        alt={company.name}
        className={`${sz} rounded-2xl object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sz} rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const { t } = useTranslation()

  const cfg = APPLICATION_STATUS[status] || {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-700",
  }

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
      {t(cfg.label, { defaultValue: status })}
    </span>
  )
}

function formatDate(str, language) {
  if (!str) {
    return "—"
  }

  return new Date(str).toLocaleDateString(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditClientModal({ company, isOpen, onClose, onSaved }) {
  const { t, i18n } = useTranslation()

  const [form, setForm] = useState({
    name: company.name || "",
    industry: getIndustryKey(company.industry, t) || "",
    contact_email: company.contact_email || "",
    contact_phone: company.contact_phone || "",
    website: company.website || "",
    address: company.address || "",
    color: company.color || PALETTE[0],
  })

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t("agencyClientDetail.nameRequired"))

      return
    }

    setError("")
    setSaving(true)

    try {
      await agencyClientService.update(company.id, {
        name: form.name.trim(),
        industry: form.industry || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        website: form.website || undefined,
        address: form.address || undefined,
        color: form.color,
        initials: getInitials(form.name),
      })
      toast.success(t("agencyClientDetail.saved"))
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || t("agencyClientDetail.saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        dir={i18n.dir()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">{t("agencyClientDetail.editClient")}</h3>

          <button
            aria-label={t("common.close")}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.companyName")}
            </label>

            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.industry")}
            </label>

            <select
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm bg-white"
            >
              <option value="">{t("agencyClientDetail.selectIndustry")}</option>

              {form.industry && !INDUSTRY_OPTIONS.includes(form.industry) && (
                <option value={form.industry}>{form.industry}</option>
              )}
              {INDUSTRY_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {t(`agencyClients.industries.${i}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.email")}
            </label>

            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="hr@company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.phone")}
            </label>

            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="03-1234567"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.website")}
            </label>

            <input
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t("agencyClientDetail.address")}
            </label>

            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder={t("agencyClientDetail.addressPlaceholder")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t("agencyClientDetail.color")}
            </label>

            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"}`}
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
              {t("agencyClientDetail.cancel")}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />

              {saving ? t("agencyClientDetail.saving") : t("agencyClientDetail.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Jobs ────────────────────────────────────────────────────────────────

function JobsTab({ jobs, clientId }) {
  const { t, i18n } = useTranslation()

  const open = jobs.filter((j) => !j.is_closed)

  const closed = jobs.filter((j) => j.is_closed)

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />

        <p className="text-gray-500 font-bold">{t("agencyClientDetail.noJobs")}</p>

        <Link
          to={`/agency/jobs?clientId=${clientId}`}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("agencyClientDetail.postJob")}
        </Link>
      </div>
    )
  }

  const JobRow = ({ job }) => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-purple-100 hover:shadow-sm transition-all">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{job.title}</p>

        <div className="flex items-center gap-3 mt-0.5">
          {job.location && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />

              {job.location}
            </span>
          )}

          <span className="text-xs text-gray-400">
            {formatDate(job.created_date, i18n.language)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ms-4 flex-shrink-0">
        <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full">
          {t("agencyClientDetail.applicants", { count: job.applications_count || 0 })}
        </span>

        {job.is_closed ? (
          <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
            {t("agencyClientDetail.closed")}
          </span>
        ) : (
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
            {t("agencyClientDetail.open")}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {open.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
            {t("agencyClientDetail.openJobsCount", { count: open.length })}
          </h3>

          <div className="space-y-2">
            {open.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">
            {t("agencyClientDetail.closedJobsCount", { count: closed.length })}
          </h3>

          <div className="space-y-2 opacity-70">
            {closed.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Candidates ──────────────────────────────────────────────────────────

function CandidatesTab({ applications, jobs }) {
  const { t } = useTranslation()

  const jobMap = useMemo(() => {
    const m = {}

    jobs.forEach((j) => {
      m[j.id] = j
    })

    return m
  }, [jobs])

  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return applications
    }

    return applications.filter((a) => a.status === statusFilter)
  }, [applications, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = {}

    applications.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1
    })

    return counts
  }, [applications])

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />

        <p className="text-gray-500 font-bold">{t("agencyClientDetail.noCandidates")}</p>
      </div>
    )
  }

  const activeStatuses = Object.keys(APPLICATION_STATUS).filter((s) => statusCounts[s])

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            statusFilter === "all"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("agencyClientDetail.allCount", { count: applications.length })}
        </button>

        {activeStatuses.map((s) => {
          const cfg = APPLICATION_STATUS[s]

          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === s
                  ? `${cfg.bg} ${cfg.text}`
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t(cfg.label)} ({statusCounts[s]})
            </button>
          )
        })}
      </div>

      {/* Candidate rows */}
      <div className="space-y-2">
        {filtered.map((app) => {
          const job = jobMap[app.job_id]

          return (
            <div
              key={app.id}
              className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-purple-100 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">
                  {app.candidate_name ||
                    app.candidate_email ||
                    t("agencyClientDetail.candidate", { id: String(app.id ?? "").slice(-4) })}
                </p>

                {job && <p className="text-xs text-gray-400 mt-0.5 truncate">{job.title}</p>}
              </div>

              <div className="flex items-center gap-3 ms-4 flex-shrink-0">
                {app.match_score != null && (
                  <span className="text-xs text-gray-500 font-bold">
                    {t("agencyClientDetail.match", { score: app.match_score })}
                  </span>
                )}

                <StatusBadge status={app.status} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: About ───────────────────────────────────────────────────────────────

function AboutTab({ company, onEdit }) {
  const { t } = useTranslation()

  const fields = [
    {
      icon: Mail,
      label: t("agencyClientDetail.email"),
      value: company.contact_email,
      href: `mailto:${company.contact_email}`,
    },
    {
      icon: Phone,
      label: t("agencyClientDetail.phone"),
      value: company.contact_phone,
      href: `tel:${company.contact_phone}`,
    },
    {
      icon: Globe,
      label: t("agencyClientDetail.site"),
      value: company.website,
      href: company.website,
    },
    { icon: MapPin, label: t("agencyClientDetail.address"), value: company.address },
    {
      icon: Building2,
      label: t("agencyClientDetail.industry"),
      value: getIndustryLabel(company.industry, t),
    },
  ].filter((f) => f.value)

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-900 text-base">{t("agencyClientDetail.details")}</h3>

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> {t("agencyClientDetail.edit")}
            </button>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm font-semibold">{t("agencyClientDetail.noContact")}</p>

            {onEdit && (
              <button
                onClick={onEdit}
                className="mt-2 text-sm text-purple-600 font-bold hover:underline"
              >
                {t("agencyClientDetail.addDetails")}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-gray-500" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400">{f.label}</p>

                  {f.href ? (
                    <a
                      href={f.href}
                      target={f.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-1"
                    >
                      {f.value}

                      {f.href.startsWith("http") && <ExternalLink className="w-3 h-3" />}
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{f.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-black text-gray-900 text-base mb-4">
          {t("agencyClientDetail.quickActions")}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/agency/jobs?clientId=${company.id}`}
            className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
          >
            <Briefcase className="w-4 h-4" /> {t("agencyClientDetail.postJob")}
          </Link>

          <Link
            to="/agency/pipeline"
            className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
          >
            <Kanban className="w-4 h-4" /> Pipeline
          </Link>

          <Link
            to="/agency/crm"
            className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Users className="w-4 h-4" /> {t("agencyClientDetail.crm")}
          </Link>

          <Link
            to="/agency/ai-matching"
            className="flex items-center gap-2 p-3 bg-violet-50 text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-100 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> {t("agencyClientDetail.aiMatching")}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "about", label: "agencyClientDetail.tab_about", icon: Building2 },
  { id: "jobs", label: "agencyClientDetail.tab_jobs", icon: Briefcase },
  { id: "candidates", label: "agencyClientDetail.tab_candidates", icon: Users },
]

export default function AgencyClientDetail() {
  const { t, i18n } = useTranslation()

  const { id } = useParams()

  const { user } = useAuth()

  const { can } = usePermissionMatrix()

  const orgId = user?.organization_id

  const canEditClient =
    ["org_admin", "recruitment_manager", "admin"].includes(user?.role) && can("update")

  const canArchiveClient =
    ["org_admin", "recruitment_manager", "admin"].includes(user?.role) && can("delete")

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("about")

  const [showEdit, setShowEdit] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const [archiveError, setArchiveError] = useState("")

  // ── Data ─────────────────────────────────────────────────────────────────

  const {
    data: company,
    isLoading: companyLoading,
    error: companyError,
    refetch: refetchCompany,
  } = useQuery({
    queryKey: ["agency-client-detail", id, orgId],
    queryFn: () => agencyClientService.get(id),
    enabled: !!id && !!orgId,
    staleTime: STALE_TIME,
  })

  const {
    data: jobs = [],
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["client-jobs", id, orgId],
    queryFn: () =>
      jobService.list({
        employer_company_id: company.company_id,
        organization_id: orgId,
        is_deleted: false,
        sort: "created_date",
        order: "DESC",
        limit: 200,
      }),
    enabled: !!company?.company_id && !!orgId,
    staleTime: STALE_TIME,
  })

  const {
    data: applications = [],
    isLoading: appsLoading,
    error: appsError,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["client-applications", id, orgId],
    queryFn: () =>
      applicationService.list({
        organization_id: orgId,
        employer_company_id: company.company_id,
        is_deleted: false,
        sort: "created_date",
        order: "DESC",
        limit: 500,
      }),
    enabled: !!orgId && !!company?.company_id,
    staleTime: STALE_TIME,
  })

  const loading = companyLoading || jobsLoading || appsLoading

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    return {
      openJobs: company?.openJobs ?? jobs.filter((j) => !j.is_closed).length,
      inProcess:
        company?.inProcess ??
        applications.filter((a) => !["hired", "completed", "rejected"].includes(a.status)).length,
      hired: company?.hired ?? applications.filter((a) => a.status === "hired").length,
      totalApps: company?.totalApplications ?? applications.length,
    }
  }, [company, jobs, applications])

  // ── Delete ────────────────────────────────────────────────────────────────

  const { mutate: deleteClient, isPending: deleting } = useMutation({
    mutationFn: () => agencyClientService.archive(id),
    onSuccess: () => {
      toast.success(t("agencyClientDetail.archived"))
      queryClient.invalidateQueries({ queryKey: ["agency-clients-list", orgId] })
      queryClient.invalidateQueries({ queryKey: ["agency-clients", orgId] })
      navigate("/agency/clients")
    },
    onError: (error) => {
      setArchiveError(error?.message || t("agencyClientDetail.archiveError"))
    },
  })

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div dir={i18n.dir()} className="max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl" />

            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-100 rounded w-48" />

              <div className="h-4 bg-gray-100 rounded w-28" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (companyError) {
    return (
      <div dir={i18n.dir()} className="max-w-5xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />

        <p className="text-gray-600 font-black text-lg">{t("agencyClientDetail.loadError")}</p>

        <button
          onClick={() => refetchCompany()}
          className="mt-4 text-purple-600 font-bold hover:underline"
        >
          {t("agencyClientDetail.retry")}
        </button>
      </div>
    )
  }

  if (!company && !companyLoading) {
    return (
      <div dir={i18n.dir()} className="max-w-5xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />

        <p className="text-gray-600 font-black text-lg">{t("agencyClientDetail.notFound")}</p>

        <Link
          to="/agency/clients"
          className="mt-4 inline-block text-purple-600 font-bold hover:underline"
        >
          {t("agencyClientDetail.back")}
        </Link>
      </div>
    )
  }

  return (
    <div dir={i18n.dir()} className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/agency/clients"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
      >
        <ArrowRight className={`w-4 h-4 ${i18n.dir() === "ltr" ? "rotate-180" : ""}`} />
        {t("agencyClientDetail.clients")}
      </Link>

      {/* Client header card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <CompanyAvatar company={company} size="lg" />

            <div>
              <h1 className="text-2xl font-black text-gray-900">{company.name}</h1>

              <div className="flex items-center gap-3 mt-1">
                {company.industry && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {getIndustryLabel(company.industry, t)}
                  </span>
                )}

                {company.status === "active" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    {t("agencyClientDetail.active")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(canEditClient || canArchiveClient) && (
            <div className="flex gap-2">
              {canEditClient && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-purple-300 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> {t("agencyClientDetail.edit")}
                </button>
              )}

              {canArchiveClient && (
                <button
                  aria-label={t("agencyClientDetail.archive")}
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          {[
            {
              label: t("agencyClientDetail.openJobs"),
              value: stats.openJobs,
              color: "text-purple-700",
              bg: "bg-purple-50",
            },
            {
              label: t("agencyClientDetail.totalApplications"),
              value: stats.totalApps,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: t("agencyClientDetail.inProcess"),
              value: stats.inProcess,
              color: "text-amber-700",
              bg: "bg-amber-50",
            },
            {
              label: t("agencyClientDetail.hired"),
              value: stats.hired,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
            },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>

              <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {(jobsError || appsError) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <span className="font-bold">{t("agencyClientDetail.activityError")}</span>

          <button
            onClick={() => {
              refetchJobs()
              refetchApplications()
            }}
            className="font-black text-purple-700 hover:underline"
          >
            {t("agencyClientDetail.retry")}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-purple-600 text-purple-700 bg-purple-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />

              {t(tab.label)}

              {tab.id === "jobs" && jobs.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-black">
                  {jobs.length}
                </span>
              )}

              {tab.id === "candidates" && applications.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-black">
                  {applications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "about" && (
            <AboutTab company={company} onEdit={canEditClient ? () => setShowEdit(true) : null} />
          )}

          {activeTab === "jobs" && <JobsTab jobs={jobs} clientId={company.id} />}

          {activeTab === "candidates" && <CandidatesTab applications={applications} jobs={jobs} />}
        </div>
      </div>

      {/* Edit modal */}
      {company && canEditClient && (
        <EditClientModal
          key={`${company.id}-${company.updated_date || ""}`}
          company={company}
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["agency-client-detail", id, orgId] })
            queryClient.invalidateQueries({ queryKey: ["agency-clients-list", orgId] })
          }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && canArchiveClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" dir={i18n.dir()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>

              <h3 className="font-black text-gray-900 text-lg">
                {t("agencyClientDetail.archiveTitle")}
              </h3>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              <Trans
                i18nKey="agencyClientDetail.archiveConfirm"
                values={{ name: company.name }}
                components={{ strong: <strong /> }}
              />
            </p>

            {archiveError && (
              <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                {archiveError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-sm"
              >
                {t("agencyClientDetail.cancel")}
              </button>

              <button
                onClick={() => {
                  setArchiveError("")
                  deleteClient()
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deleting ? t("agencyClientDetail.archiving") : t("agencyClientDetail.archive")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Edit2,
  Trash2,
  X,
  Save,
  TrendingUp,
  Kanban,
  AlertCircle,
  Plus,
  ExternalLink,
} from "lucide-react"
