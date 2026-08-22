/**
 * Marketplace Overview — Super Admin only.
 * Shows platform-wide stats on cross-org candidate access:
 *   - Total access grants by type (owner / shared / purchased)
 *   - Active vs expired grants
 *   - Organizations participating in the marketplace
 *   - Recent access grants (activity feed)
 */
import { useQuery } from "@tanstack/react-query"
import { candidateAccessService } from "@/api/services/candidateAccessService"
import { organizationService } from "@/api/services/organizationService"
import { ShoppingCart, Share2, CreditCard, Building2, CheckCircle } from "lucide-react"

function KpiCard({ icon: Icon, label, value, sub, color = "purple", loading, to }) {
  const colorMap = {
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50   text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50  text-amber-600",
    red: "bg-red-50    text-red-600",
  }

  const inner = (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-shadow ${to ? "hover:shadow-md cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>

        <span className="text-sm font-semibold text-gray-500">{label}</span>
      </div>

      {loading ? (
        <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-3xl font-black text-gray-900">{value ?? "—"}</p>

          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </>
      )}
    </div>
  )

  return to ? <Link to={to}>{inner}</Link> : inner
}

function AccessTypeBadge({ type }) {
  const cfg = {
    owner: { bg: "bg-purple-50", text: "text-purple-700", label: "Owner" },
    shared: { bg: "bg-blue-50", text: "text-blue-700", label: "Shared" },
    purchased: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Purchased" },
  }

  const { bg, text, label } = cfg[type] || cfg.owner

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${bg} ${text}`}>
      {label}
    </span>
  )
}

export default function MarketplacePage() {
  const { data: accesses = [], isLoading: loadingAccesses } = useQuery({
    queryKey: ["marketplace-accesses"],
    queryFn: () =>
      candidateAccessService.list({ sort: "created_date", order: "DESC", limit: 1000 }),
    staleTime: 2 * 60 * 1000,
  })

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })

  const loading = loadingAccesses || loadingOrgs

  const now = new Date()

  const active = accesses.filter(
    (a) => a.is_active && (!a.expires_at || new Date(a.expires_at) > now),
  )

  const expired = accesses.filter(
    (a) => !a.is_active || (a.expires_at && new Date(a.expires_at) <= now),
  )

  const purchased = accesses.filter((a) => a.access_type === "purchased")

  const shared = accesses.filter((a) => a.access_type === "shared")

  // Orgs that have exposed at least one candidate (have non-owner access granted from them)
  const exposedOrgIds = new Set(
    accesses.filter((a) => a.access_type !== "owner").map((a) => a.owner_organization_id),
  )

  const exposedOrgs = orgs.filter((o) => exposedOrgIds.has(o.id))

  // Orgs that purchased / received access
  const buyerOrgIds = new Set(
    accesses.filter((a) => a.accessor_organization_id).map((a) => a.accessor_organization_id),
  )

  const buyerOrgs = orgs.filter((o) => buyerOrgIds.has(o.id))

  // Recent activity (last 10 non-owner accesses)
  const recent = accesses.filter((a) => a.access_type !== "owner").slice(0, 10)

  // Per-org exposure breakdown
  const orgExposure = orgs
    .map((org) => {
      const orgAccesses = accesses.filter(
        (a) => a.owner_organization_id === org.id && a.access_type !== "owner",
      )

      return {
        ...org,
        sharedCount: orgAccesses.filter((a) => a.access_type === "shared").length,
        purchasedCount: orgAccesses.filter((a) => a.access_type === "purchased").length,
        total: orgAccesses.length,
      }
    })
    .filter((o) => o.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  return (
    <div dir="ltr" className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Candidate Marketplace</h1>

          <p className="text-slate-500 mt-1 font-semibold">
            Cross-organization candidate access and pool management
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/platform/marketplace/candidates"
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            <Users className="w-4 h-4" /> Candidate Pool
          </Link>

          <Link
            to="/platform/marketplace/exposure"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" /> Exposure Settings
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={ShoppingCart}
          label="Total Access Grants"
          value={accesses.filter((a) => a.access_type !== "owner").length}
          color="purple"
          loading={loading}
          to="/platform/marketplace/candidates"
        />

        <KpiCard
          icon={CheckCircle}
          label="Active Grants"
          value={active.filter((a) => a.access_type !== "owner").length}
          color="green"
          loading={loading}
        />

        <KpiCard
          icon={Share2}
          label="Shared Accesses"
          value={shared.length}
          color="blue"
          loading={loading}
        />

        <KpiCard
          icon={CreditCard}
          label="Purchased Accesses"
          value={purchased.length}
          color="amber"
          loading={loading}
        />

        <KpiCard
          icon={Building2}
          label="Orgs Exposing Pool"
          value={exposedOrgs.length}
          color="purple"
          loading={loading}
          to="/platform/marketplace/exposure"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access breakdown by type */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-5">Access Types Breakdown</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>

                  <div>
                    <p className="font-bold text-purple-900">Shared Access</p>

                    <p className="text-xs text-purple-600">Between partner organizations</p>
                  </div>
                </div>

                <span className="text-2xl font-black text-purple-900">{shared.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div>
                    <p className="font-bold text-emerald-900">Purchased Access</p>

                    <p className="text-xs text-emerald-600">Commercial marketplace transactions</p>
                  </div>
                </div>

                <span className="text-2xl font-black text-emerald-900">{purchased.length}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-gray-400" />
                  </div>

                  <div>
                    <p className="font-bold text-gray-700">Expired Grants</p>

                    <p className="text-xs text-gray-400">Inactive or past expiry</p>
                  </div>
                </div>

                <span className="text-2xl font-black text-gray-600">
                  {expired.filter((a) => a.access_type !== "owner").length}
                </span>
              </div>
            </div>
          )}

          <Link
            to="/platform/marketplace/candidates"
            className="flex items-center gap-1 mt-4 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            View all access grants <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent marketplace activity */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-5">Recent Access Grants</h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="w-10 h-10 text-gray-200 mb-3" />

              <p className="text-gray-400 font-semibold">No marketplace activity yet</p>

              <p className="text-xs text-gray-300 mt-1">Access grants will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        Candidate {acc.candidate_id?.slice(0, 8)}…
                      </p>

                      <p className="text-xs text-gray-400 truncate">
                        {acc.granted_at
                          ? new Date(acc.granted_at).toLocaleDateString("en-GB")
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <AccessTypeBadge type={acc.access_type} />
                </div>
              ))}
            </div>
          )}

          <Link
            to="/platform/marketplace/candidates"
            className="flex items-center gap-1 mt-4 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Exposing Organizations */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Top Exposing Organizations</h2>

          <Link
            to="/platform/marketplace/exposure"
            className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700"
          >
            Manage exposure <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orgExposure.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />

            <p className="text-gray-400 font-semibold">No organizations exposing pools yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {orgExposure.map((org) => (
              <div
                key={org.id}
                className="p-4 border border-gray-100 rounded-xl hover:border-purple-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{org.name}</p>

                    <p className="text-xs text-gray-400">
                      {org.org_type === "staffing_agency" ? "Staffing Agency" : "Internal HR"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-black text-blue-700">{org.sharedCount}</p>

                    <p className="text-xs text-blue-500 font-semibold">Shared</p>
                  </div>

                  <div className="flex-1 text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-black text-emerald-700">{org.purchasedCount}</p>

                    <p className="text-xs text-emerald-500 font-semibold">Purchased</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marketplace Health */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-black text-gray-900 mb-4">Marketplace Status</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Exposing Orgs", value: exposedOrgs.length, sub: "sellers", color: "purple" },
            { label: "Accessing Orgs", value: buyerOrgs.length, sub: "buyers", color: "blue" },
            {
              label: "Active Grants",
              value: active.filter((a) => a.access_type !== "owner").length,
              sub: "live now",
              color: "green",
            },
            { label: "Revenue Events", value: purchased.length, sub: "purchases", color: "amber" },
          ].map((item) => (
            <div
              key={item.label}
              className={`p-4 rounded-xl ${
                item.color === "purple"
                  ? "bg-purple-50"
                  : item.color === "blue"
                    ? "bg-blue-50"
                    : item.color === "green"
                      ? "bg-emerald-50"
                      : "bg-amber-50"
              }`}
            >
              <p
                className={`text-2xl font-black ${
                  item.color === "purple"
                    ? "text-purple-900"
                    : item.color === "blue"
                      ? "text-blue-900"
                      : item.color === "green"
                        ? "text-emerald-900"
                        : "text-amber-900"
                }`}
              >
                {loading ? "..." : item.value}
              </p>

              <p
                className={`text-sm font-bold mt-0.5 ${
                  item.color === "purple"
                    ? "text-purple-700"
                    : item.color === "blue"
                      ? "text-blue-700"
                      : item.color === "green"
                        ? "text-emerald-700"
                        : "text-amber-700"
                }`}
              >
                {item.label}
              </p>

              <p
                className={`text-xs mt-0.5 opacity-70 ${
                  item.color === "purple"
                    ? "text-purple-600"
                    : item.color === "blue"
                      ? "text-blue-600"
                      : item.color === "green"
                        ? "text-emerald-600"
                        : "text-amber-600"
                }`}
              >
                {item.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
import { Link } from "react-router-dom"
import { Users, TrendingUp, Clock, XCircle, ArrowRight } from "lucide-react"
