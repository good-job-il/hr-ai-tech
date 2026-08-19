import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Briefcase, CreditCard, Receipt, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { billingService } from "@/api/services/billingService"

const PLAN_NAMES = {
  trial: "Trial",
  starter: "Starter",
  pro: "Professional",
  enterprise: "Enterprise",
}

const money = (minor, currency) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: currency || "ILS" }).format(
    (minor || 0) / 100,
  )

export default function BillingSettings() {
  const { i18n } = useTranslation()

  const isRTL = !i18n.language?.startsWith("en")

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: billingService.overview,
    staleTime: 60_000,
  })

  const text = isRTL
    ? {
        title: "חיוב ותמחור",
        subtitle: "תוכנית, מגבלות, שימוש, חשבוניות וסטטוס תשלום",
        plan: "תוכנית נוכחית",
        jobs: "משרות פעילות",
        candidates: "מועמדים",
        seats: "משתמשים",
        payment: "סטטוס תשלום",
        invoices: "חשבוניות",
        noInvoices: "אין חשבוניות מסונכרנות",
        unavailable: "ניהול תוכנית ואמצעי תשלום אינו מופעל בסביבה זו",
        error: "לא ניתן לטעון נתוני חיוב",
        retry: "נסה שוב",
        unlimited: "ללא הגבלה",
        ai: "AI Matching",
      }
    : {
        title: "Billing & Plans",
        subtitle: "Plan, limits, usage, invoices and payment status",
        plan: "Current plan",
        jobs: "Active jobs",
        candidates: "Candidates",
        seats: "Seats",
        payment: "Payment status",
        invoices: "Invoices",
        noInvoices: "No synchronized invoices",
        unavailable: "Plan and payment method management is not enabled in this environment",
        error: "Unable to load billing data",
        retry: "Try again",
        unlimited: "Unlimited",
        ai: "AI Matching",
      }

  if (error) {
    return (
      <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={AlertCircle} className="min-h-72">
            <p role="alert" className="font-bold text-slate-700">
              {text.error}
            </p>
            <button
              type="button"
              disabled={isRefetching}
              onClick={() => refetch()}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-violet-700 transition hover:border-violet-200 hover:bg-violet-50 disabled:opacity-60"
            >
              {text.retry}
            </button>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <PlatformPageHeader title={text.title} subtitle={text.subtitle} icon={CreditCard} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PlatformCard className="min-h-[132px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-semibold text-slate-500">{text.plan}</p>
                <p className="mt-2 text-[28px] font-black text-slate-900">
                  {isLoading ? "…" : data ? PLAN_NAMES[data.plan] : "—"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </PlatformCard>
          <PlatformStatCard
            icon={Briefcase}
            label={text.jobs}
            value={data?.usage.active_jobs}
            loading={isLoading}
            tone="blue"
            meta={limitText(data?.limits.active_jobs, text)}
          />
          <PlatformStatCard
            icon={Users}
            label={text.candidates}
            value={data?.usage.candidates}
            loading={isLoading}
            tone="emerald"
            meta={limitText(data?.limits.candidates, text)}
          />
          <PlatformStatCard
            icon={Users}
            label={text.seats}
            value={data?.usage.seats}
            loading={isLoading}
            tone="fuchsia"
            meta={limitText(data?.limits.seats, text)}
          />
        </div>
        {data && (
          <div className="grid gap-5 lg:grid-cols-2">
            <PlatformCard className="p-5">
              <PlatformWidgetHeader title={text.plan} subtitle={PLAN_NAMES[data.plan]} />
              <div className="mt-5 space-y-4">
                <Usage
                  label={text.jobs}
                  value={data.usage.active_jobs}
                  limit={data.limits.active_jobs}
                />
                <Usage
                  label={text.candidates}
                  value={data.usage.candidates}
                  limit={data.limits.candidates}
                />
                <Usage label={text.seats} value={data.usage.seats} limit={data.limits.seats} />
                <div className="flex items-center justify-between rounded-xl bg-violet-50 p-3 text-sm font-bold text-violet-700">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {text.ai}
                  </span>
                  <span>{data.limits.ai_matching ? "✓" : "—"}</span>
                </div>
              </div>
            </PlatformCard>
            <PlatformCard className="p-5">
              <PlatformWidgetHeader
                title={text.payment}
                subtitle={data.subscription.provider || "—"}
              />
              <div className="mt-5 space-y-3 text-sm">
                <StatusRow label="Subscription" value={data.subscription.status} />
                <StatusRow label={text.payment} value={data.subscription.payment_status} />
                <StatusRow
                  label="Period end"
                  value={
                    data.subscription.current_period_end
                      ? new Date(data.subscription.current_period_end).toLocaleDateString()
                      : "—"
                  }
                />
              </div>
              {!data.capabilities.plan_changes && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                  {text.unavailable}
                </div>
              )}
            </PlatformCard>
          </div>
        )}
        <PlatformCard className="overflow-hidden">
          <div className="p-5">
            <PlatformWidgetHeader
              title={text.invoices}
              subtitle={`${data?.invoices.length || 0}`}
            />
          </div>
          {!data?.invoices.length ? (
            <PlatformEmptyState icon={Receipt} className="m-5">
              {text.noInvoices}
            </PlatformEmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>
                    <th className="p-3 text-start">#</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100">
                      <td className="p-3 font-bold">
                        {invoice.invoice_number || invoice.provider_invoice_id}
                      </td>
                      <td className="text-center">
                        {new Date(invoice.issued_at).toLocaleDateString()}
                      </td>
                      <td className="text-center font-bold">
                        {money(invoice.amount_minor, invoice.currency)}
                      </td>
                      <td className="text-center">{invoice.status}</td>
                      <td className="p-3 text-end">
                        {(invoice.invoice_pdf_url || invoice.hosted_invoice_url) && (
                          <a
                            href={invoice.invoice_pdf_url || invoice.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-violet-600"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}

function limitText(limit, text) {
  return limit == null ? text.unlimited : `Limit: ${limit}`
}
function Usage({ label, value, limit }) {
  const percent = limit ? Math.min(100, (value / limit) * 100) : 0

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>
          {value} / {limit ?? "∞"}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
          style={{ width: limit ? `${percent}%` : "12%" }}
        />
      </div>
    </div>
  )
}
function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-800">{value}</span>
    </div>
  )
}
