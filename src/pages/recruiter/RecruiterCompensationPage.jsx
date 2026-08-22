import { useQuery } from "@tanstack/react-query"
import { BadgeDollarSign, BriefcaseBusiness, LockKeyhole } from "lucide-react"
import { compensationPlanService } from "@/api/services/compensationPlanService"
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix"
import { useTranslation } from "react-i18next"

const COPY = {
  en: {
    title: "My compensation",
    subtitle: "Read-only personal terms for jobs assigned to you",
    unavailable: "You do not have permission to view compensation.",
    empty: "No personal compensation plans are available.",
    rate: "Personal rate",
    amount: "Calculated amount",
    fixed: "fixed",
    percent: "percent",
    loadError: "Unable to load personal compensation.",
    retry: "Retry",
  },
  he: {
    title: "התגמול שלי",
    subtitle: "תנאים אישיים לקריאה בלבד עבור המשרות שהוקצו לך",
    unavailable: "אין לך הרשאה לצפות בתגמולים.",
    empty: "אין תוכניות תגמול אישיות זמינות.",
    rate: "שיעור אישי",
    amount: "סכום מחושב",
    fixed: "קבוע",
    percent: "אחוזים",
    loadError: "לא ניתן לטעון את התגמול האישי.",
    retry: "נסה שוב",
  },
}

const money = (value, locale) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "ILS" }).format(Number(value || 0))

export default function RecruiterCompensationPage() {
  const { i18n } = useTranslation()

  const { can, loading: permissionsLoading } = usePermissionMatrix()

  const language = i18n.language?.startsWith("en") ? "en" : "he"

  const text = COPY[language]

  const locale = language === "he" ? "he-IL" : "en-IL"

  const canView = can("view_compensation")

  const {
    data: plans = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recruiter-own-compensation"],
    queryFn: () =>
      compensationPlanService.list({ sort: "created_date", order: "DESC", limit: 100 }),
    enabled: canView && !permissionsLoading,
    staleTime: 5 * 60 * 1000,
  })

  if (permissionsLoading || isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-white" />
  }

  if (!canView) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-center">
        <div>
          <LockKeyhole className="mx-auto mb-3 h-10 w-10 text-slate-300" />

          <p className="font-bold text-slate-500">{text.unavailable}</p>
        </div>
      </div>
    )
  }

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
      <header>
        <h1 className="text-3xl font-black text-slate-900">{text.title}</h1>

        <p className="mt-1 font-semibold text-slate-500">{text.subtitle}</p>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center font-semibold text-slate-400">
          {text.empty}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-violet-500">
                    {plan.client_name}
                  </div>

                  <h2 className="mt-1 flex items-center gap-2 font-black text-slate-900">
                    <BriefcaseBusiness className="h-4 w-4" />

                    {plan.job_id ? `Job #${plan.job_id}` : text.title}
                  </h2>
                </div>

                <BadgeDollarSign className="h-8 w-8 text-emerald-500" />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-violet-50 p-3">
                  <dt className="text-xs font-bold text-slate-500">{text.rate}</dt>

                  <dd className="mt-1 text-lg font-black text-violet-700">
                    {plan.recruiter_compensation_type === "percent"
                      ? `${plan.recruiter_compensation ?? 0}%`
                      : money(plan.recruiter_compensation, locale)}
                  </dd>

                  <div className="text-xs text-violet-500">
                    {text[plan.recruiter_compensation_type]}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3">
                  <dt className="text-xs font-bold text-slate-500">{text.amount}</dt>

                  <dd className="mt-1 text-lg font-black text-emerald-700">
                    {plan.own_compensation_amount == null
                      ? "—"
                      : money(plan.own_compensation_amount, locale)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
