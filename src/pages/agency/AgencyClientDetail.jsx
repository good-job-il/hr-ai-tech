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
  "הייטק",
  "פיננסים",
  "ייצור",
  "קמעונאות",
  "שירותים",
  "בריאות",
  "חינוך",
  "נדל״ן",
  "לוגיסטיקה",
  "תקשורת",
  "אחר",
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
  new: { label: "חדש", bg: "bg-blue-50", text: "text-blue-700" },
  reviewed: { label: "נבדק", bg: "bg-purple-50", text: "text-purple-700" },
  phone_interview: { label: "ראיון טלפוני", bg: "bg-amber-50", text: "text-amber-700" },
  recommended: { label: "הומלץ ללקוח", bg: "bg-orange-50", text: "text-orange-700" },
  employer_interview: { label: "ראיון מעסיק", bg: "bg-violet-50", text: "text-violet-700" },
  offer: { label: "הצעה", bg: "bg-sky-50", text: "text-sky-700" },
  hired: { label: "גויס", bg: "bg-emerald-50", text: "text-emerald-700" },
  probation: { label: "תקופת ניסיון", bg: "bg-teal-50", text: "text-teal-700" },
  completed: { label: "הושלם", bg: "bg-green-50", text: "text-green-700" },
  rejected: { label: "נדחה", bg: "bg-red-50", text: "text-red-700" },
}

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
  const cfg = APPLICATION_STATUS[status] || {
    label: status,
    bg: "bg-gray-50",
    text: "text-gray-700",
  }

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(str) {
  if (!str) {
    return "—"
  }

  return new Date(str).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditClientModal({ company, isOpen, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: company.name || "",
    industry: company.industry || "",
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
      setError("שם לקוח הוא שדה חובה")

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
      toast.success("פרטי הלקוח נשמרו")
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || "שגיאה בשמירה")
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
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">עריכת לקוח</h3>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">שם החברה *</label>

            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">תעשייה</label>

            <select
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm bg-white"
            >
              <option value="">בחר תעשייה</option>

              {INDUSTRY_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">אימייל</label>

            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="hr@company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">טלפון</label>

            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="03-1234567"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">אתר אינטרנט</label>

            <input
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">כתובת</label>

            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="תל אביב"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">צבע</label>

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
              ביטול
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />

              {saving ? "שומר..." : "שמור"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Jobs ────────────────────────────────────────────────────────────────

function JobsTab({ jobs, clientId }) {
  const open = jobs.filter((j) => !j.is_closed)

  const closed = jobs.filter((j) => j.is_closed)

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl">
        <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />

        <p className="text-gray-500 font-bold">אין משרות ללקוח זה עדיין</p>

        <Link
          to={`/agency/jobs?clientId=${clientId}`}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> פרסם משרה
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

          <span className="text-xs text-gray-400">{formatDate(job.created_date)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mr-4 flex-shrink-0">
        <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-full">
          {job.applications_count || 0} מגישים
        </span>

        {job.is_closed ? (
          <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
            סגורה
          </span>
        ) : (
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
            פתוחה
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
            משרות פתוחות ({open.length})
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
            משרות סגורות ({closed.length})
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

        <p className="text-gray-500 font-bold">אין מועמדים בתהליך ללקוח זה</p>
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
          הכל ({applications.length})
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
              {cfg.label} ({statusCounts[s]})
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
                  {app.candidate_name || app.candidate_email || `מועמד #${app.id?.slice(-4)}`}
                </p>

                {job && <p className="text-xs text-gray-400 mt-0.5 truncate">{job.title}</p>}
              </div>

              <div className="flex items-center gap-3 mr-4 flex-shrink-0">
                {app.match_score != null && (
                  <span className="text-xs text-gray-500 font-bold">{app.match_score}% התאמה</span>
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
  const fields = [
    {
      icon: Mail,
      label: "אימייל",
      value: company.contact_email,
      href: `mailto:${company.contact_email}`,
    },
    {
      icon: Phone,
      label: "טלפון",
      value: company.contact_phone,
      href: `tel:${company.contact_phone}`,
    },
    { icon: Globe, label: "אתר", value: company.website, href: company.website },
    { icon: MapPin, label: "כתובת", value: company.address },
    { icon: Building2, label: "תעשייה", value: company.industry },
  ].filter((f) => f.value)

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-gray-900 text-base">פרטי לקוח</h3>

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> עריכה
            </button>
          )}
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm font-semibold">לא הוזנו פרטי קשר</p>

            {onEdit && (
              <button
                onClick={onEdit}
                className="mt-2 text-sm text-purple-600 font-bold hover:underline"
              >
                הוסף פרטים
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
        <h3 className="font-black text-gray-900 text-base mb-4">פעולות מהירות</h3>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/agency/jobs?clientId=${company.id}`}
            className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
          >
            <Briefcase className="w-4 h-4" /> פרסם משרה
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
            <Users className="w-4 h-4" /> CRM מועמדים
          </Link>

          <Link
            to="/agency/ai-matching"
            className="flex items-center gap-2 p-3 bg-violet-50 text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-100 transition-colors"
          >
            <TrendingUp className="w-4 h-4" /> AI התאמה
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "about", label: "פרטים", icon: Building2 },
  { id: "jobs", label: "משרות", icon: Briefcase },
  { id: "candidates", label: "מועמדים", icon: Users },
]

export default function AgencyClientDetail() {
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
      toast.success("הלקוח הועבר לארכיון")
      queryClient.invalidateQueries({ queryKey: ["agency-clients-list", orgId] })
      queryClient.invalidateQueries({ queryKey: ["agency-clients", orgId] })
      navigate("/agency/clients")
    },
    onError: (error) => {
      setArchiveError(
        error?.message || "לא ניתן להעביר את הלקוח לארכיון כל עוד קיימת פעילות גיוס פתוחה.",
      )
    },
  })

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div dir="rtl" className="max-w-5xl mx-auto space-y-6">
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
      <div dir="rtl" className="max-w-5xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />

        <p className="text-gray-600 font-black text-lg">שגיאה בטעינת הלקוח</p>

        <button
          onClick={() => refetchCompany()}
          className="mt-4 text-purple-600 font-bold hover:underline"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (!company && !companyLoading) {
    return (
      <div dir="rtl" className="max-w-5xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />

        <p className="text-gray-600 font-black text-lg">לקוח לא נמצא</p>

        <Link
          to="/agency/clients"
          className="mt-4 inline-block text-purple-600 font-bold hover:underline"
        >
          חזרה לרשימת הלקוחות
        </Link>
      </div>
    )
  }

  return (
    <div dir="rtl" className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/agency/clients"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        לקוחות
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
                    {company.industry}
                  </span>
                )}

                {company.status === "active" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    לקוח פעיל
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
                  <Edit2 className="w-4 h-4" /> עריכה
                </button>
              )}

              {canArchiveClient && (
                <button
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
              label: "משרות פתוחות",
              value: stats.openJobs,
              color: "text-purple-700",
              bg: "bg-purple-50",
            },
            {
              label: "סה״כ הגשות",
              value: stats.totalApps,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: "בתהליך גיוס",
              value: stats.inProcess,
              color: "text-amber-700",
              bg: "bg-amber-50",
            },
            { label: "גויסו", value: stats.hired, color: "text-emerald-700", bg: "bg-emerald-50" },
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
          <span className="font-bold">לא ניתן לטעון את כל המשרות או המועמדים של הלקוח.</span>

          <button
            onClick={() => {
              refetchJobs()
              refetchApplications()
            }}
            className="font-black text-purple-700 hover:underline"
          >
            נסה שוב
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

              {tab.label}

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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>

              <h3 className="font-black text-gray-900 text-lg">מחיקת לקוח</h3>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              להעביר את <strong>{company.name}</strong> לארכיון? ניתן לבצע זאת רק כאשר אין משרות או
              מועמדים בתהליך.
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
                ביטול
              </button>

              <button
                onClick={() => {
                  setArchiveError("")
                  deleteClient()
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deleting ? "מעביר..." : "העבר לארכיון"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
