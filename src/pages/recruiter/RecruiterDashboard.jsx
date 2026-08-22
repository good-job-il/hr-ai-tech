import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Kanban,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"
import { candidateService } from "@/api/services/candidateService"
import { applicationService } from "@/api/services/applicationService"
import { interviewService } from "@/api/services/interviewService"
import { jobService } from "@/api/services/jobService"
import { useAuth } from "@/lib/AuthContext"

const ACTIVE_STATUSES = new Set([
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "offer",
  "probation",
])

const SLA_HOURS = {
  new: 24,
  reviewed: 48,
  phone_interview: 72,
  recommended: 48,
  employer_interview: 120,
  offer: 72,
  probation: 168,
}

const COPY = {
  he: {
    hello: "שלום",
    subtitle: "מרחב העבודה האישי שלך — משימות, ראיונות ותהליך הגיוס",
    refresh: "רענון",
    candidates: "המועמדים שלי",
    jobs: "משרות פעילות",
    applications: "תהליכים פעילים",
    interviews: "ראיונות קרובים",
    tasks: "המשימות שלי",
    overdue: "שלבים באיחור",
    newApplications: "מועמדים חדשים לבדיקה",
    weekInterviews: "ראיונות בשבעת הימים הקרובים",
    noTasks: "אין משימות דחופות כרגע",
    upcoming: "ראיונות קרובים",
    noInterviews: "לא נקבעו ראיונות קרובים",
    assignedJobs: "משרות שהוקצו לי",
    noJobs: "אין משרות פעילות שהוקצו לך",
    recentCandidates: "מועמדים אחרונים",
    noCandidates: "אין מועמדים משויכים",
    viewAll: "הצג הכל",
    openPipeline: "פתח תהליך",
    loadError: "לא ניתן לטעון את מרחב העבודה",
  },
  en: {
    hello: "Hello",
    subtitle: "Your personal workspace for tasks, interviews and recruitment progress",
    refresh: "Refresh",
    candidates: "My candidates",
    jobs: "Active jobs",
    applications: "Active applications",
    interviews: "Upcoming interviews",
    tasks: "My tasks",
    overdue: "Overdue stages",
    newApplications: "New candidates to review",
    weekInterviews: "Interviews in the next seven days",
    noTasks: "No urgent tasks right now",
    upcoming: "Upcoming interviews",
    noInterviews: "No upcoming interviews",
    assignedJobs: "Assigned jobs",
    noJobs: "No active jobs are assigned to you",
    recentCandidates: "Recent candidates",
    noCandidates: "No assigned candidates",
    viewAll: "View all",
    openPipeline: "Open pipeline",
    loadError: "Unable to load the recruiter workspace",
  },
}

function StatCard({ icon: Icon, label, value, tone, href, loading }) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }

  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>

      <div>
        <div className="text-2xl font-black text-slate-900">
          {loading ? (
            <span className="inline-block h-6 w-10 animate-pulse rounded bg-slate-100" />
          ) : (
            value
          )}
        </div>

        <div className="text-sm font-semibold text-slate-500">{label}</div>
      </div>
    </div>
  )

  return href ? <Link to={href}>{content}</Link> : content
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>

        {action}
      </div>

      {children}
    </section>
  )
}

export default function RecruiterDashboard() {
  const { user } = useAuth()

  const { i18n } = useTranslation()

  const language = i18n.language?.startsWith("en") ? "en" : "he"

  const text = COPY[language]

  const isRtl = language === "he"

  const [data, setData] = useState({ candidates: [], applications: [], jobs: [], interviews: [] })

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    setError("")

    try {
      // No client-side fallback: every endpoint applies the Recruiter RLS from R-1.
      const [candidates, applications, jobs, interviews] = await Promise.all([
        candidateService.list({ sort: "created_date", order: "DESC", limit: 200 }),
        applicationService.list({ sort: "updated_date", order: "DESC", limit: 500 }),
        jobService.list({ sort: "updated_date", order: "DESC", limit: 200 }),
        interviewService.list({ sort: "date", order: "DESC", limit: 200 }),
      ])

      setData({ candidates, applications, jobs, interviews })
    } catch (requestError) {
      setData({ candidates: [], applications: [], jobs: [], interviews: [] })
      setError(requestError?.message || text.loadError)
    } finally {
      setLoading(false)
    }
  }, [text.loadError, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const workspace = useMemo(() => {
    const now = Date.now()

    const weekEnd = now + 7 * 86400000

    const activeApplications = data.applications.filter((item) => ACTIVE_STATUSES.has(item.status))

    const overdue = activeApplications
      .filter((item) => SLA_HOURS[item.status])
      .map((item) => ({
        ...item,
        overdueHours: Math.max(
          0,
          Math.floor((now - new Date(item.updated_date).getTime()) / 3600000) -
            SLA_HOURS[item.status],
        ),
      }))
      .filter((item) => item.overdueHours > 0)
      .sort((a, b) => b.overdueHours - a.overdueHours)

    const upcomingInterviews = data.interviews
      .filter((item) => {
        const timestamp = new Date(`${item.date}T${item.time || "00:00"}`).getTime()

        return timestamp >= now && !["cancelled", "completed", "no_show"].includes(item.status)
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time || "00:00"}`).getTime() -
          new Date(`${b.date}T${b.time || "00:00"}`).getTime(),
      )

    return {
      activeApplications,
      activeJobs: data.jobs.filter(
        (item) => !item.is_closed && !["filled", "closed"].includes(item.state),
      ),
      overdue,
      upcomingInterviews,
      weekInterviews: upcomingInterviews.filter(
        (item) => new Date(`${item.date}T${item.time || "00:00"}`).getTime() <= weekEnd,
      ),
      newApplications: data.applications.filter((item) => item.status === "new"),
    }
  }, [data])

  const firstName = user?.full_name?.trim().split(/\s+/)[0] || user?.email || ""

  const shortDate = (value) =>
    new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "short",
    }).format(new Date(value))

  const panelAction = (href, label = text.viewAll) => (
    <Link className="text-sm font-bold text-violet-600" to={href}>
      {label}
    </Link>
  )

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {text.hello}, {firstName}
          </h1>

          <p className="mt-1 font-semibold text-slate-500">{text.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-violet-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />

          {text.refresh}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          label={text.candidates}
          value={data.candidates.length}
          tone="violet"
          href="/agency/recruiter/candidates/all"
          loading={loading}
        />

        <StatCard
          icon={BriefcaseBusiness}
          label={text.jobs}
          value={workspace.activeJobs.length}
          tone="blue"
          href="/agency/recruiter/jobs"
          loading={loading}
        />

        <StatCard
          icon={Kanban}
          label={text.applications}
          value={workspace.activeApplications.length}
          tone="amber"
          href="/agency/recruiter/pipeline"
          loading={loading}
        />

        <StatCard
          icon={CalendarClock}
          label={text.interviews}
          value={workspace.upcomingInterviews.length}
          tone="emerald"
          href="/agency/recruiter/interviews"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title={text.tasks}
          action={panelAction("/agency/recruiter/pipeline", text.openPipeline)}
        >
          <div className="space-y-3">
            {[
              {
                icon: AlertTriangle,
                label: text.overdue,
                count: workspace.overdue.length,
                tone: "text-red-600 bg-red-50",
                href: workspace.overdue[0]
                  ? `/agency/recruiter/pipeline?applicationId=${workspace.overdue[0].id}`
                  : "/agency/recruiter/pipeline",
              },
              {
                icon: UserRoundCheck,
                label: text.newApplications,
                count: workspace.newApplications.length,
                tone: "text-blue-600 bg-blue-50",
                href: workspace.newApplications[0]
                  ? `/agency/recruiter/pipeline?applicationId=${workspace.newApplications[0].id}`
                  : "/agency/recruiter/pipeline",
              },
              {
                icon: CalendarClock,
                label: text.weekInterviews,
                count: workspace.weekInterviews.length,
                tone: "text-emerald-600 bg-emerald-50",
                href: "/agency/recruiter/interviews",
              },
            ].map((task) => (
              <Link
                key={task.label}
                to={task.href}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${task.tone}`}
                >
                  <task.icon className="h-4 w-4" />
                </span>

                <span className="flex-1 text-sm font-bold text-slate-700">{task.label}</span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                  {task.count}
                </span>
              </Link>
            ))}

            {!loading &&
              !workspace.overdue.length &&
              !workspace.newApplications.length &&
              !workspace.weekInterviews.length && (
                <div className="flex items-center gap-2 py-6 text-sm font-semibold text-slate-400">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  {text.noTasks}
                </div>
              )}
          </div>
        </Panel>

        <Panel title={text.upcoming} action={panelAction("/agency/recruiter/interviews")}>
          <div className="space-y-2">
            {workspace.upcomingInterviews.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={
                  item.application_id
                    ? `/agency/recruiter/pipeline?applicationId=${item.application_id}`
                    : "/agency/recruiter/interviews"
                }
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarClock className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">
                    {item.candidate_name}
                  </span>

                  <span className="block truncate text-xs font-semibold text-slate-400">
                    {item.job_title}
                  </span>
                </span>

                <span className="text-xs font-bold text-slate-500">
                  {shortDate(item.date)} {item.time}
                </span>
              </Link>
            ))}

            {!loading && !workspace.upcomingInterviews.length && (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                {text.noInterviews}
              </p>
            )}
          </div>
        </Panel>

        <Panel title={text.assignedJobs} action={panelAction("/agency/recruiter/jobs")}>
          <div className="space-y-2">
            {workspace.activeJobs.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/agency/recruiter/jobs?jobId=${item.id}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BriefcaseBusiness className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">
                    {item.title}
                  </span>

                  <span className="block truncate text-xs font-semibold text-slate-400">
                    {item.company}
                  </span>
                </span>

                <span className="text-xs font-bold text-slate-500">
                  {item.applications_count || 0}
                </span>
              </Link>
            ))}

            {!loading && !workspace.activeJobs.length && (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">{text.noJobs}</p>
            )}
          </div>
        </Panel>

        <Panel
          title={text.recentCandidates}
          action={panelAction("/agency/recruiter/candidates/all")}
        >
          <div className="space-y-2">
            {data.candidates.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                to={`/agency/recruiter/crm/candidate?id=${item.id}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <UsersRound className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">
                    {item.full_name}
                  </span>

                  <span className="block truncate text-xs font-semibold text-slate-400">
                    {item.role_name || item.email}
                  </span>
                </span>

                <Clock3 className="h-4 w-4 text-slate-300" />
              </Link>
            ))}

            {!loading && !data.candidates.length && (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                {text.noCandidates}
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
import { Link } from "react-router-dom"
import { RefreshCw } from "lucide-react"
