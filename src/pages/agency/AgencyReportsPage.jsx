import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  BriefcaseBusiness,
  Clock3,
  Download,
  Filter,
  PieChart,
  UsersRound,
  WalletCards,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { managementReportService } from "@/api/services/managementReportService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { Button } from "@/components/ui/button"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
  platformFieldClassName,
} from "@/components/platform/PlatformUI"

const isoDate = (date) => date.toISOString().slice(0, 10)
const initialFrom = () => isoDate(new Date(Date.now() - 90 * 86400000))
const money = (value) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function AgencyReportsPage() {
  const { i18n } = useTranslation()
  const isRTL = !i18n.language?.startsWith("en")
  const { can } = usePermissionMatrix()
  const [filters, setFilters] = useState({
    date_from: initialFrom(),
    date_to: isoDate(new Date()),
    client_id: "",
    job_id: "",
    recruiter_id: "",
    team_id: "",
  })
  const [exportError, setExportError] = useState("")
  const query = Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => [key, key.endsWith("_id") ? Number(value) : value]),
  )
  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["management-report", query],
    queryFn: () => managementReportService.get(query),
    staleTime: 60_000,
  })

  const text = isRTL
    ? {
        title: "דוחות ותובנות",
        subtitle: "ביצועי גיוס אמיתיים לפי טווח, לקוח, צוות ומשרה",
        applications: "מועמדויות",
        placements: "השמות",
        rate: "שיעור השמה",
        time: "זמן ממוצע לגיוס",
        revenue: "הכנסות מהשמות",
        compensation: "תגמול מוקצה",
        filters: "מסננים",
        all: "הכול",
        funnel: "משפך גיוס",
        stageTime: "זמן בשלב",
        sources: "אפקטיביות מקורות",
        recruiters: "ביצועי מגייסים",
        teams: "ביצועי צוותים",
        clients: "המרת לקוחות",
        jobs: "המרת משרות",
        export: "ייצוא CSV",
        noData: "אין נתונים בטווח שנבחר",
        loadError: "לא ניתן לטעון את הדוח",
        days: "ימים",
        source: "מקור",
        name: "שם",
        conversion: "המרה",
        client: "לקוח",
        job: "משרה",
        recruiter: "מגייס",
        team: "צוות",
        from: "מתאריך",
        to: "עד תאריך",
      }
    : {
        title: "Reports & Insights",
        subtitle: "Real recruitment performance by period, client, team and job",
        applications: "Applications",
        placements: "Placements",
        rate: "Placement rate",
        time: "Average time to hire",
        revenue: "Placement revenue",
        compensation: "Allocated compensation",
        filters: "Filters",
        all: "All",
        funnel: "Recruitment funnel",
        stageTime: "Time in stage",
        sources: "Source effectiveness",
        recruiters: "Recruiter performance",
        teams: "Team performance",
        clients: "Client conversion",
        jobs: "Job conversion",
        export: "Export CSV",
        noData: "No data for the selected period",
        loadError: "Unable to load report",
        days: "days",
        source: "Source",
        name: "Name",
        conversion: "Conversion",
        client: "Client",
        job: "Job",
        recruiter: "Recruiter",
        team: "Team",
        from: "From",
        to: "To",
      }

  const exportCsv = async () => {
    if (!report) return
    setExportError("")
    let exportedReport
    try {
      exportedReport = await managementReportService.export(query)
    } catch (requestError) {
      setExportError(requestError?.message || text.loadError)
      return
    }
    const rows = [["dimension", "name", "applications", "placements", "conversion_rate"]]
    ;[
      ["source", exportedReport.source_effectiveness, "source"],
      ["recruiter", exportedReport.recruiter_performance, "recruiter_name"],
      ["team", exportedReport.team_performance, "team_name"],
      ["client", exportedReport.client_conversion, "client_name"],
      ["job", exportedReport.job_conversion, "job_title"],
    ].forEach(([dimension, values, nameKey]) => {
      values.forEach((row) =>
        rows.push([dimension, row[nameKey], row.applications, row.placements, row.conversion_rate]),
      )
    })
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `agency-report-${filters.date_from}-${filters.date_to}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const dimensions = report?.dimensions || { clients: [], jobs: [], recruiters: [], teams: [] }
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <PlatformPageHeader
          title={text.title}
          subtitle={text.subtitle}
          icon={PieChart}
          actions={
            <Button variant="outline" onClick={exportCsv} disabled={!can("export") || !report}>
              <Download className="h-4 w-4" />
              {text.export}
            </Button>
          }
        />
        {exportError && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{exportError}</p>
        )}
        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title={text.filters}
            action={<Filter className="h-4 w-4 text-violet-600" />}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <FilterField
              label={text.from}
              type="date"
              value={filters.date_from}
              onChange={(value) => update("date_from", value)}
            />
            <FilterField
              label={text.to}
              type="date"
              value={filters.date_to}
              onChange={(value) => update("date_to", value)}
            />
            <FilterField
              label={text.client}
              value={filters.client_id}
              options={dimensions.clients}
              all={text.all}
              onChange={(value) => update("client_id", value)}
            />
            <FilterField
              label={text.job}
              value={filters.job_id}
              options={dimensions.jobs}
              all={text.all}
              onChange={(value) => update("job_id", value)}
            />
            <FilterField
              label={text.recruiter}
              value={filters.recruiter_id}
              options={dimensions.recruiters}
              all={text.all}
              onChange={(value) => update("recruiter_id", value)}
            />
            <FilterField
              label={text.team}
              value={filters.team_id}
              options={dimensions.teams}
              all={text.all}
              onChange={(value) => update("team_id", value)}
            />
          </div>
        </PlatformCard>

        {error ? (
          <PlatformEmptyState icon={Activity}>{text.loadError}</PlatformEmptyState>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <PlatformStatCard
                icon={UsersRound}
                label={text.applications}
                value={report?.summary.applications}
                loading={isLoading}
                tone="violet"
              />
              <PlatformStatCard
                icon={BriefcaseBusiness}
                label={text.placements}
                value={report?.summary.placements}
                loading={isLoading}
                tone="emerald"
              />
              <PlatformStatCard
                icon={PieChart}
                label={text.rate}
                value={report?.summary.placement_rate}
                suffix="%"
                loading={isLoading}
                tone="blue"
              />
              <PlatformStatCard
                icon={Clock3}
                label={text.time}
                value={report?.summary.average_time_to_hire_days}
                suffix={` ${text.days}`}
                loading={isLoading}
                tone="amber"
              />
              {can("view_compensation") && (
                <PlatformStatCard
                  icon={WalletCards}
                  label={text.revenue}
                  value={report?.summary.placement_revenue}
                  prefix="₪"
                  loading={isLoading}
                  tone="cyan"
                />
              )}
              {can("view_compensation") && (
                <PlatformStatCard
                  icon={WalletCards}
                  label={text.compensation}
                  value={report?.summary.allocated_compensation}
                  prefix="₪"
                  loading={isLoading}
                  tone="fuchsia"
                />
              )}
            </div>
            {!isLoading && report?.summary.applications === 0 ? (
              <PlatformEmptyState icon={PieChart}>{text.noData}</PlatformEmptyState>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                <MetricBars
                  title={text.funnel}
                  rows={report?.funnel || []}
                  labelKey="status"
                  valueKey="count"
                  suffix=""
                />
                <MetricBars
                  title={text.stageTime}
                  rows={report?.time_in_stage || []}
                  labelKey="status"
                  valueKey="average_days"
                  suffix={` ${text.days}`}
                />
                <PerformanceTable
                  title={text.sources}
                  rows={report?.source_effectiveness || []}
                  nameKey="source"
                  text={text}
                />
                <PerformanceTable
                  title={text.recruiters}
                  rows={report?.recruiter_performance || []}
                  nameKey="recruiter_name"
                  text={text}
                />
                <PerformanceTable
                  title={text.teams}
                  rows={report?.team_performance || []}
                  nameKey="team_name"
                  text={text}
                />
                <PerformanceTable
                  title={text.clients}
                  rows={report?.client_conversion || []}
                  nameKey="client_name"
                  text={text}
                />
                <PerformanceTable
                  title={text.jobs}
                  rows={report?.job_conversion || []}
                  nameKey="job_title"
                  text={text}
                />
                {can("view_compensation") && (
                  <PlatformCard className="p-5">
                    <PlatformWidgetHeader title={text.revenue} />
                    <div className="mt-5 text-3xl font-black text-emerald-600">
                      {money(report?.summary.placement_revenue)}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-500">
                      {text.compensation}: {money(report?.summary.allocated_compensation)}
                    </div>
                  </PlatformCard>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PlatformPageShell>
  )
}

function FilterField({ label, value, onChange, type, options, all }) {
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

function MetricBars({ title, rows, labelKey, valueKey, suffix }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0))
  return (
    <PlatformCard className="p-5">
      <PlatformWidgetHeader title={title} />
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row[labelKey]}>
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
              <span>{row[labelKey]}</span>
              <span>
                {row[valueKey]}
                {suffix}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                style={{ width: `${Math.max(2, (Number(row[valueKey]) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </PlatformCard>
  )
}

function PerformanceTable({ title, rows, nameKey, text }) {
  return (
    <PlatformCard className="overflow-hidden">
      <div className="p-5">
        <PlatformWidgetHeader title={title} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="p-3 text-start">{text.name}</th>
              <th>{text.applications}</th>
              <th>{text.placements}</th>
              <th>{text.conversion}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row[nameKey]}-${index}`} className="border-t border-slate-100">
                <td className="p-3 font-bold text-slate-700">{row[nameKey]}</td>
                <td className="text-center">{row.applications}</td>
                <td className="text-center">{row.placements}</td>
                <td className="text-center font-bold text-violet-600">{row.conversion_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformCard>
  )
}
