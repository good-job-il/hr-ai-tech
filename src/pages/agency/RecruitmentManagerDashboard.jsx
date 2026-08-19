import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock3,
  Filter,
  Kanban,
  RefreshCw,
  Send,
  Users,
} from "lucide-react"
import { recruitmentManagementService } from "@/api/services/recruitmentManagementService"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
  platformFieldClassName,
} from "@/components/platform/PlatformUI"
import { REASSIGN_INVALIDATION_KEYS } from "@/domain/agency/rmAcceptance"

const STAGES = [
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "offer",
  "hired",
  "probation",
  "completed",
  "rejected",
]
const parseIds = (value) => [
  ...new Set(
    value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter(Number.isInteger),
  ),
]
const isoDate = (date) => date.toISOString().slice(0, 10)

export default function RecruitmentManagerDashboard() {
  const { i18n } = useTranslation()
  const isRtl = !i18n.language?.startsWith("en")
  const text = isRtl
    ? {
        title: "ניהול גיוס",
        subtitle: "משפך, SLA, עומסים, השמות וחלוקת עבודה",
        refresh: "רענן",
        openJobs: "משרות פתוחות",
        applications: "מועמדויות",
        active: "תהליכים פעילים",
        overdue: "חריגות SLA",
        placements: "השמות",
        overloaded: "מגייסים בעומס",
        funnel: "משפך גיוס",
        workload: "עומס מגייסים",
        overdueTitle: "שלבים באיחור",
        recentPlacements: "השמות אחרונות",
        assign: "הקצאה והעברה מרוכזת",
        jobs: "מזהי משרות",
        candidates: "מזהי מועמדים",
        comma: "מזהים מופרדים בפסיקים",
        team: "צוות",
        recruiter: "מגייס",
        unassigned: "ללא הקצאה",
        reason: "סיבת ההקצאה / ההעברה",
        submit: "הקצה",
        required: "יש להזין לפחות מזהה אחד וסיבה",
        success: "ההקצאה נשמרה בעסקה אחת",
        loadError: "לא ניתן לטעון את לוח הניהול",
        none: "אין נתונים",
        hours: "שעות",
        filters: "מסנני KPI",
        client: "לקוח",
        job: "משרה",
        from: "מתאריך",
        to: "עד תאריך",
        all: "הכול",
      }
    : {
        title: "Recruitment Management",
        subtitle: "Funnel, SLA, workload, placements and work distribution",
        refresh: "Refresh",
        openJobs: "Open jobs",
        applications: "Applications",
        active: "Active pipeline",
        overdue: "SLA overdue",
        placements: "Placements",
        overloaded: "Overloaded recruiters",
        funnel: "Recruitment funnel",
        workload: "Recruiter workload",
        overdueTitle: "Overdue stages",
        recentPlacements: "Recent placements",
        assign: "Bulk assign / reassign",
        jobs: "Job IDs",
        candidates: "Candidate IDs",
        comma: "Comma-separated IDs",
        team: "Team",
        recruiter: "Recruiter",
        unassigned: "Unassigned",
        reason: "Assignment / reassignment reason",
        submit: "Assign",
        required: "Provide at least one ID and a reason",
        success: "Assignment saved in one transaction",
        loadError: "Unable to load manager dashboard",
        none: "No data",
        hours: "hours",
        filters: "KPI filters",
        client: "Client",
        job: "Job",
        from: "From",
        to: "To",
        all: "All",
      }
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    date_from: isoDate(new Date(Date.now() - 90 * 86400000)),
    date_to: isoDate(new Date()),
    client_id: "",
    job_id: "",
    recruiter_id: "",
    team_id: "",
  })
  const reportQuery = Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, key.endsWith("_id") ? Number(value) : value]),
  )
  const dashboard = useQuery({
    queryKey: ["recruitment-manager-dashboard", reportQuery],
    queryFn: () => recruitmentManagementService.dashboard(reportQuery),
    refetchInterval: 5 * 60_000,
  })
  const teamsQuery = useQuery({ queryKey: ["agency-teams"], queryFn: agencyTeamsService.overview })
  const [form, setForm] = useState({
    job_ids: "",
    candidate_ids: "",
    application_ids: "",
    team_id: "none",
    recruiter_id: "none",
    reason: "",
  })
  const [formError, setFormError] = useState("")
  const [saved, setSaved] = useState(false)
  const data = dashboard.data
  const dimensions = data?.dimensions || { clients: [], jobs: [], recruiters: [], teams: [] }
  const teams = teamsQuery.data?.teams || []
  const recruiters = useMemo(
    () =>
      (teamsQuery.data?.members || []).filter(
        (member) =>
          member.role === "recruiter" &&
          member.is_active &&
          (form.team_id === "none" || String(member.team_id) === form.team_id),
      ),
    [form.team_id, teamsQuery.data],
  )
  const assignment = useMutation({
    mutationFn: recruitmentManagementService.assign,
    onSuccess: () => {
      setSaved(true)
      setFormError("")
      setForm((current) => ({
        ...current,
        job_ids: "",
        candidate_ids: "",
        application_ids: "",
        reason: "",
      }))
      REASSIGN_INVALIDATION_KEYS.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      )
    },
    onError: (error) => setFormError(error?.message || text.loadError),
  })
  const submit = (event) => {
    event.preventDefault()
    setSaved(false)
    const payload = {
      job_ids: parseIds(form.job_ids),
      candidate_ids: parseIds(form.candidate_ids),
      application_ids: parseIds(form.application_ids),
      team_id: form.team_id === "none" ? null : Number(form.team_id),
      recruiter_id: form.recruiter_id === "none" ? null : Number(form.recruiter_id),
      reason: form.reason.trim(),
    }
    if (
      !payload.reason ||
      ![...payload.job_ids, ...payload.candidate_ids, ...payload.application_ids].length
    ) {
      setFormError(text.required)
      return
    }
    assignment.mutate(payload)
  }

  if (dashboard.isError)
    return (
      <PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
        <PlatformCard className="p-6">
          <PlatformEmptyState icon={AlertTriangle}>
            <p>{text.loadError}</p>
            <Button className="mt-4" onClick={() => dashboard.refetch()}>
              {text.refresh}
            </Button>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    )
  const maxFunnel = Math.max(1, ...Object.values(data?.funnel || {}))
  return (
    <PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <PlatformPageHeader
          title={text.title}
          subtitle={text.subtitle}
          icon={Kanban}
          actions={
            <Button
              variant="outline"
              disabled={dashboard.isFetching}
              onClick={() => dashboard.refetch()}
            >
              <RefreshCw className={`h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />
              {text.refresh}
            </Button>
          }
        />
        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title={text.filters}
            action={<Filter className="h-4 w-4 text-violet-600" />}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <DashboardFilter
              label={text.from}
              type="date"
              value={filters.date_from}
              onChange={(value) => setFilters((current) => ({ ...current, date_from: value }))}
            />
            <DashboardFilter
              label={text.to}
              type="date"
              value={filters.date_to}
              onChange={(value) => setFilters((current) => ({ ...current, date_to: value }))}
            />
            <DashboardFilter
              label={text.client}
              value={filters.client_id}
              options={dimensions.clients}
              all={text.all}
              onChange={(value) => setFilters((current) => ({ ...current, client_id: value }))}
            />
            <DashboardFilter
              label={text.job}
              value={filters.job_id}
              options={dimensions.jobs}
              all={text.all}
              onChange={(value) => setFilters((current) => ({ ...current, job_id: value }))}
            />
            <DashboardFilter
              label={text.team}
              value={filters.team_id}
              options={dimensions.teams}
              all={text.all}
              onChange={(value) => setFilters((current) => ({ ...current, team_id: value }))}
            />
            <DashboardFilter
              label={text.recruiter}
              value={filters.recruiter_id}
              options={dimensions.recruiters}
              all={text.all}
              onChange={(value) => setFilters((current) => ({ ...current, recruiter_id: value }))}
            />
          </div>
        </PlatformCard>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <PlatformStatCard
            icon={Briefcase}
            label={text.openJobs}
            value={data?.summary.open_jobs}
            loading={dashboard.isLoading}
            tone="violet"
            to="/agency/jobs/open"
          />
          <PlatformStatCard
            icon={Users}
            label={text.applications}
            value={data?.summary.applications}
            loading={dashboard.isLoading}
            tone="cyan"
            to="/agency/pipeline"
          />
          <PlatformStatCard
            icon={Kanban}
            label={text.active}
            value={data?.summary.active_applications}
            loading={dashboard.isLoading}
            tone="blue"
            to="/agency/pipeline"
          />
          <PlatformStatCard
            icon={Clock3}
            label={text.overdue}
            value={data?.summary.overdue_stages}
            loading={dashboard.isLoading}
            tone="amber"
          />
          <PlatformStatCard
            icon={CheckCircle2}
            label={text.placements}
            value={data?.summary.placements}
            loading={dashboard.isLoading}
            tone="emerald"
          />
          <PlatformStatCard
            icon={AlertTriangle}
            label={text.overloaded}
            value={data?.summary.overloaded_recruiters}
            loading={dashboard.isLoading}
            tone="rose"
          />
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <PlatformCard className="p-5">
            <PlatformWidgetHeader title={text.funnel} />
            <div className="mt-5 space-y-3">
              {STAGES.map((stage) => (
                <div key={stage}>
                  <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
                    <span>{stage.replaceAll("_", " ")}</span>
                    <span>{data?.funnel?.[stage] || 0}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                      style={{ width: `${((data?.funnel?.[stage] || 0) / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PlatformCard>
          <PlatformCard className="overflow-hidden">
            <div className="p-5">
              <PlatformWidgetHeader
                title={text.workload}
                subtitle={
                  data
                    ? `${data.thresholds.application_overload} apps / ${data.thresholds.job_overload} jobs`
                    : ""
                }
              />
            </div>
            {!data?.workload.length ? (
              <PlatformEmptyState icon={Users} className="m-5">
                {text.none}
              </PlatformEmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.workload.map((item) => (
                  <div
                    key={item.recruiter_id}
                    className={`flex items-center gap-3 p-4 ${item.overloaded ? "bg-rose-50/70" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{item.recruiter_name}</p>
                      <p className="text-xs text-slate-400">{item.team_name || "—"}</p>
                    </div>
                    <span className="text-sm font-black text-violet-700">
                      {item.active_applications} apps
                    </span>
                    <span className="text-sm font-black text-blue-700">{item.open_jobs} jobs</span>
                    {item.overloaded && <AlertTriangle className="h-4 w-4 text-rose-600" />}
                  </div>
                ))}
              </div>
            )}
          </PlatformCard>
        </div>
        <PlatformCard className="p-5">
          <PlatformWidgetHeader title={text.assign} />
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                ["job_ids", text.jobs],
                ["candidate_ids", text.candidates],
                ["application_ids", text.applications],
              ].map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    dir="ltr"
                    className="mt-1"
                    value={form[key]}
                    placeholder={text.comma}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <Label>{text.team}</Label>
                <Select
                  value={form.team_id}
                  onValueChange={(team_id) => setForm({ ...form, team_id, recruiter_id: "none" })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{text.unassigned}</SelectItem>
                    {teams
                      .filter((team) => team.is_active)
                      .map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{text.recruiter}</Label>
                <Select
                  value={form.recruiter_id}
                  onValueChange={(recruiter_id) => setForm({ ...form, recruiter_id })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{text.unassigned}</SelectItem>
                    {recruiters.map((recruiter) => (
                      <SelectItem key={recruiter.id} value={String(recruiter.id)}>
                        {recruiter.full_name || recruiter.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignment-reason">{text.reason}</Label>
                <Input
                  id="assignment-reason"
                  className="mt-1"
                  required
                  minLength={3}
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                />
              </div>
            </div>
            {formError && (
              <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {formError}
              </p>
            )}
            {saved && (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                {text.success}
              </p>
            )}
            <div className="flex justify-end">
              <Button disabled={assignment.isPending}>
                <Send className="h-4 w-4" />
                {text.submit}
              </Button>
            </div>
          </form>
        </PlatformCard>
        <div className="grid gap-5 xl:grid-cols-2">
          <ListCard
            title={text.overdueTitle}
            rows={data?.overdue || []}
            empty={text.none}
            render={(item) => (
              <Link
                to={`/agency/pipeline?applicationId=${item.id}`}
                className="flex items-center justify-between p-4 hover:bg-amber-50"
              >
                <div>
                  <p className="font-bold text-slate-800">{item.candidate_name}</p>
                  <p className="text-xs text-slate-400">
                    {item.job_title} · {item.status}
                  </p>
                </div>
                <span className="font-black text-amber-700">
                  {item.overdue_hours} {text.hours}
                </span>
              </Link>
            )}
          />
          <ListCard
            title={text.recentPlacements}
            rows={data?.placements || []}
            empty={text.none}
            render={(item) => (
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-bold text-slate-800">{item.candidate_name}</p>
                  <p className="text-xs text-slate-400">
                    {item.job_title} · {item.company}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            )}
          />
        </div>
      </div>
    </PlatformPageShell>
  )
}

function ListCard({ title, rows, empty, render }) {
  return (
    <PlatformCard className="overflow-hidden">
      <div className="p-5">
        <PlatformWidgetHeader title={title} />
      </div>
      {rows.length ? (
        <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
          {rows.map((row, index) => (
            <div key={row.id || row.application_id || index}>{render(row)}</div>
          ))}
        </div>
      ) : (
        <PlatformEmptyState icon={Clock3} className="m-5">
          {empty}
        </PlatformEmptyState>
      )}
    </PlatformCard>
  )
}

function DashboardFilter({ label, value, onChange, type, options = [], all }) {
  return (
    <label className="text-xs font-bold text-slate-500">
      {label}
      {type ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${platformFieldClassName} mt-2`}
        />
      ) : (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${platformFieldClassName} mt-2`}
        >
          <option value="">{all}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
    </label>
  )
}
