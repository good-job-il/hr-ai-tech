import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { organizationService } from "@/api/services/organizationService"
import {
  Building2,
  CheckCircle,
  CircleDollarSign,
  Clock,
  CreditCard,
  Crown,
  Search,
  XCircle,
} from "lucide-react"

const PLAN_COLORS = {
  trial: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Trial" },
  starter: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Starter" },
  pro: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Pro" },
  enterprise: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Enterprise",
  },
}

const STATUS_COLORS = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  suspended: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
  inactive: { bg: "bg-gray-50", text: "text-gray-500", icon: Clock },
}

const PLAN_PRICES = { trial: 0, starter: 499, pro: 1499, enterprise: 2999 }

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("")

  const [planFilter, setPlanFilter] = useState("all")

  const [statusFilter, setStatusFilter] = useState("all")

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
    staleTime: 2 * 60 * 1000,
  })

  const filtered = orgs.filter((o) => {
    const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase())

    const matchPlan = planFilter === "all" || o.plan === planFilter

    const matchStatus = statusFilter === "all" || o.status === statusFilter

    return matchSearch && matchPlan && matchStatus
  })

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => o.status === "active").length,
    enterprise: orgs.filter((o) => o.plan === "enterprise").length,
    mrr: orgs
      .filter((o) => o.status === "active")
      .reduce((s, o) => s + (PLAN_PRICES[o.plan] || 0), 0),
  }

  const handleChangePlan = async (org, newPlan) => {
    await organizationService.update(org.id, { plan: newPlan })
  }

  const handleChangeStatus = async (org, newStatus) => {
    await organizationService.update(org.id, { status: newStatus })
  }

  return (
    <PlatformPageShell dir="ltr">
      <div className="space-y-5">
        <PlatformPageHeader
          title="Subscription Management"
          subtitle="All organizations and their subscription plans"
          icon={CreditCard}
          actions={
            <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-[0_8px_25px_rgba(66,81,130,0.07)]">
              <CircleDollarSign className="h-5 w-5 text-violet-500" />
              <div>
                <p className="text-xs font-bold text-slate-700">Monthly recurring revenue</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                  Based on active subscriptions
                </p>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Building2}
            label="Total organizations"
            value={stats.total}
            tone="violet"
            loading={isLoading}
            meta="Across every plan"
          />
          <PlatformStatCard
            icon={CheckCircle}
            label="Active subscriptions"
            value={stats.active}
            tone="emerald"
            loading={isLoading}
            meta="Currently billable"
          />
          <PlatformStatCard
            icon={Crown}
            label="Enterprise plans"
            value={stats.enterprise}
            tone="blue"
            loading={isLoading}
            meta="Highest tier"
          />
          <PlatformStatCard
            icon={CircleDollarSign}
            label="Monthly recurring revenue"
            value={stats.mrr}
            prefix="₪"
            tone="fuchsia"
            loading={isLoading}
            meta="Estimated MRR"
          />
        </div>

        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title="Subscription filters"
            subtitle={`${filtered.length} organizations shown`}
            action={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            }
          />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1fr)_190px_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </PlatformCard>

        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader
              title="Organization subscriptions"
              subtitle="Manage plans, billing status and monthly value"
              action={
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-700">
                  {filtered.length} total
                </span>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Organization", "Type", "Plan", "Status", "MRR", "Actions"].map((label) => (
                    <th
                      key={label}
                      className="px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        {Array(6)
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
                    <td colSpan={6} className="p-5">
                      <PlatformEmptyState icon={Search}>
                        No matching organizations
                      </PlatformEmptyState>
                    </td>
                  </tr>
                ) : (
                  filtered.map((org, index) => {
                    const plan = PLAN_COLORS[org.plan] || PLAN_COLORS.trial

                    const status = STATUS_COLORS[org.status] || STATUS_COLORS.inactive

                    const StatusIcon = status.icon

                    return (
                      <tr key={org.id} className="group transition-colors hover:bg-violet-50/35">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
                                index % 3 === 0
                                  ? "from-violet-100 to-fuchsia-50 text-violet-600"
                                  : index % 3 === 1
                                    ? "from-blue-100 to-cyan-50 text-blue-600"
                                    : "from-cyan-100 to-emerald-50 text-cyan-600"
                              }`}
                            >
                              <Building2 className="h-5 w-5" strokeWidth={1.8} />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 transition group-hover:text-violet-700">
                                {org.name}
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {org.contact_email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {org.org_type === "staffing_agency" ? "Staffing Agency" : "Internal HR"}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            defaultValue={org.plan || "trial"}
                            onChange={(e) => handleChangePlan(org, e.target.value)}
                            className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide outline-none ${plan.bg} ${plan.text} ${plan.border}`}
                          >
                            <option value="trial">Trial</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.bg} ${status.text}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {org.status === "active"
                              ? "Active"
                              : org.status === "suspended"
                                ? "Suspended"
                                : "Inactive"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-extrabold text-slate-800">
                            {org.status === "active"
                              ? `₪${(PLAN_PRICES[org.plan] || 0).toLocaleString()}`
                              : "—"}
                          </span>
                          {org.status === "active" && (
                            <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                              per month
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {org.status === "active" ? (
                            <button
                              onClick={() => handleChangeStatus(org, "suspended")}
                              className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-600 transition hover:border-rose-200 hover:bg-rose-100"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeStatus(org, "active")}
                              className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-600 transition hover:border-emerald-200 hover:bg-emerald-100"
                            >
                              Activate
                            </button>
                          )}
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
