import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { organizationService } from "@/api/services/organizationService"
import { CheckCircle, Clock, DollarSign, Receipt, XCircle } from "lucide-react"

const PLAN_PRICES = { trial: 0, starter: 499, pro: 1499, enterprise: 2999 }

// Generate mock invoices from real orgs
function generateInvoices(orgs, locale = "he-IL") {
  const result = []

  let num = 1

  const now = new Date()

  orgs
    .filter((o) => o.status === "active" && (o.plan || "trial") !== "trial")
    .forEach((org) => {
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)

        const isPast = i > 0

        result.push({
          id: `INV-${String(num++).padStart(4, "0")}`,
          org_name: org.name,
          org_id: org.id,
          plan: org.plan,
          amount: PLAN_PRICES[org.plan] || 0,
          date: d.toLocaleDateString(locale, { month: "long", year: "numeric" }),
          date_raw: d,
          status: isPast ? "paid" : i === 0 ? "pending" : "paid",
        })
      }
    })

  return result.sort((a, b) => b.date_raw - a.date_raw)
}

const STATUS = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  overdue: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
}

export default function InvoicesPage() {
  const { t, i18n } = useTranslation()

  const [search, setSearch] = useState("")

  const [statusFilter, setStatusFilter] = useState("all")

  const currentLang = i18n.language?.startsWith("en") ? "en" : "he"

  const dir = currentLang === "he" ? "rtl" : "ltr"

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
    staleTime: 2 * 60 * 1000,
  })

  const locale = currentLang === "he" ? "he-IL" : "en-US"

  const invoices = useMemo(() => generateInvoices(orgs, locale), [orgs, locale])

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.org_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.includes(search)

    const matchStatus = statusFilter === "all" || inv.status === statusFilter

    return matchSearch && matchStatus
  })

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    revenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
  }

  return (
    <PlatformPageShell dir={dir}>
      <div className="space-y-5">
        <PlatformPageHeader
          title={t("platform.invoices.title")}
          subtitle={t("platform.invoices.subtitle")}
          icon={Receipt}
          actions={
            <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_25px_rgba(66,81,130,0.07)]">
              <TrendingUp className="h-5 w-5 text-violet-500" />

              <div>
                <p className="text-xs font-bold text-slate-700">
                  {t("platform.invoices.stats.revenue")}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                  {t("platform.invoices.stats.paid")}: {stats.paid}
                </p>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Receipt}
            label={t("platform.invoices.stats.totalInvoices")}
            value={stats.total}
            tone="violet"
            loading={isLoading}
            meta={t("platform.invoices.filters.invoicesCount")}
          />

          <PlatformStatCard
            icon={CheckCircle}
            label={t("platform.invoices.stats.paid")}
            value={stats.paid}
            tone="emerald"
            loading={isLoading}
            meta={t("platform.invoices.status.paid")}
          />

          <PlatformStatCard
            icon={Clock}
            label={t("platform.invoices.stats.pending")}
            value={stats.pending}
            tone="fuchsia"
            loading={isLoading}
            meta={t("platform.invoices.status.pending")}
          />

          <PlatformStatCard
            icon={DollarSign}
            label={t("platform.invoices.stats.revenue")}
            value={stats.revenue}
            prefix="₪"
            tone="blue"
            loading={isLoading}
            meta={t("platform.invoices.stats.paid")}
          />
        </div>

        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title={t("platform.invoices.filters.allStatuses")}
            subtitle={`${filtered.length} ${t("platform.invoices.filters.invoicesCount")}`}
            action={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr)_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("platform.invoices.filters.searchPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pe-4 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
            >
              <option value="all">{t("platform.invoices.filters.allStatuses")}</option>

              <option value="paid">{t("platform.invoices.status.paid")}</option>

              <option value="pending">{t("platform.invoices.status.pending")}</option>

              <option value="overdue">{t("platform.invoices.status.overdue")}</option>
            </select>
          </div>
        </PlatformCard>

        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader
              title={t("platform.invoices.title")}
              subtitle={t("platform.invoices.subtitle")}
              action={
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-700">
                  {filtered.length} {t("platform.invoices.filters.invoicesCount")}
                </span>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    t("platform.invoices.table.invoiceNumber"),
                    t("platform.invoices.table.organization"),
                    t("platform.invoices.table.plan"),
                    t("platform.invoices.table.period"),
                    t("platform.invoices.table.amount"),
                    t("platform.invoices.table.status"),
                    t("platform.invoices.table.download"),
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        {Array(7)
                          .fill(0)
                          .map((_, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className="h-5 animate-pulse rounded-lg bg-slate-100" />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-5">
                      <PlatformEmptyState icon={Receipt}>
                        {t("platform.invoices.noInvoices")}
                      </PlatformEmptyState>
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv, index) => {
                    const st = STATUS[inv.status] || STATUS.pending

                    const StIcon = st.icon

                    const statusLabel = t(`platform.invoices.status.${inv.status}`)

                    return (
                      <tr key={inv.id} className="group transition-colors hover:bg-violet-50/35">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                                index % 3 === 0
                                  ? "from-violet-100 to-fuchsia-50 text-violet-600"
                                  : index % 3 === 1
                                    ? "from-blue-100 to-cyan-50 text-blue-600"
                                    : "from-cyan-100 to-emerald-50 text-cyan-600"
                              }`}
                            >
                              <Receipt className="h-4 w-4" strokeWidth={1.8} />
                            </div>

                            <span className="font-mono text-xs font-extrabold text-slate-700">
                              {inv.id}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-slate-800 transition group-hover:text-violet-700">
                            {inv.org_name}
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            {String(inv.org_id).slice(0, 8)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">
                            {inv.plan}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">
                          {inv.date}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-black text-slate-900">
                            ₪{inv.amount.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.bg} ${st.text}`}
                          >
                            <StIcon className="h-3 w-3" />

                            {statusLabel}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}
import { Download, Search, SlidersHorizontal, TrendingUp } from "lucide-react"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from "@/components/platform/PlatformUI"
