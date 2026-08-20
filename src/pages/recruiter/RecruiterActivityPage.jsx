import { useQuery } from "@tanstack/react-query"
import { Activity, CalendarCheck2, CheckCircle2, Trophy } from "lucide-react"
import { applicationService } from "@/api/services/applicationService"
import { auditService } from "@/api/services/auditService"
import { interviewService } from "@/api/services/interviewService"
import { useTranslation } from "react-i18next"

const COPY = {
  en: {
    title: "My performance",
    subtitle: "Personal recruitment outcomes and your recent activity",
    applications: "Applications",
    interviews: "Completed interviews",
    hires: "Hires",
    conversion: "Hire conversion",
    recent: "Recent activity",
    empty: "No personal activity has been recorded yet.",
    loadError: "Unable to load personal performance.",
    retry: "Retry",
  },
  he: {
    title: "הביצועים שלי",
    subtitle: "תוצאות גיוס אישיות והפעילות האחרונה שלך",
    applications: "תהליכים",
    interviews: "ראיונות שהושלמו",
    hires: "גיוסים",
    conversion: "יחס גיוס",
    recent: "פעילות אחרונה",
    empty: "עדיין לא נרשמה פעילות אישית.",
    loadError: "לא ניתן לטעון את הביצועים האישיים.",
    retry: "נסה שוב",
  },
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className={`h-6 w-6 ${tone}`} />

      <div className="mt-3 text-2xl font-black text-slate-900">{value}</div>

      <div className="text-sm font-semibold text-slate-500">{label}</div>
    </div>
  )
}

export default function RecruiterActivityPage() {
  const { i18n } = useTranslation()

  const language = i18n.language?.startsWith("en") ? "en" : "he"

  const text = COPY[language]

  const locale = language === "he" ? "he-IL" : "en-IL"

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["recruiter-personal-performance"],
    queryFn: async () => {
      const [applications, interviews, activityPage] = await Promise.all([
        applicationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
        interviewService.list({ sort: "date", order: "DESC", limit: 500 }),
        auditService.listPage({ sort: "created_date", order: "DESC", limit: 50 }),
      ])

      return { applications, interviews, activity: activityPage.data }
    },
    staleTime: 2 * 60 * 1000,
  })

  const applications = data?.applications || []

  const interviews = data?.interviews || []

  const hires = applications.filter((item) =>
    ["hired", "probation", "completed"].includes(item.status),
  )

  const completedInterviews = interviews.filter((item) => item.status === "completed")

  const conversion = applications.length
    ? Math.round((hires.length / applications.length) * 100)
    : 0

  if (isError) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-center">
        <div>
          <p className="font-bold text-red-600">{text.loadError}</p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 font-bold text-white"
          >
            {text.retry}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div dir={language === "he" ? "rtl" : "ltr"} className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">{text.title}</h1>

          <p className="mt-1 font-semibold text-slate-500">{text.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-bold text-violet-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />

          {text.recent}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Activity}
          label={text.applications}
          value={applications.length}
          tone="text-violet-500"
        />

        <Metric
          icon={CalendarCheck2}
          label={text.interviews}
          value={completedInterviews.length}
          tone="text-blue-500"
        />

        <Metric icon={Trophy} label={text.hires} value={hires.length} tone="text-amber-500" />

        <Metric
          icon={CheckCircle2}
          label={text.conversion}
          value={`${conversion}%`}
          tone="text-emerald-500"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">{text.recent}</h2>

        {isLoading ? (
          <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-50" />
        ) : data?.activity?.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {data.activity.map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="font-bold text-slate-800">
                    {event.entity_label || event.entity_type}
                  </div>

                  <div className="text-sm text-slate-500">{event.action}</div>
                </div>

                <time className="whitespace-nowrap text-xs font-semibold text-slate-400">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(event.created_date))}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center font-semibold text-slate-400">{text.empty}</p>
        )}
      </section>
    </div>
  )
}
