/**
 * Marketplace Candidates — Super Admin only.
 * Lists all cross-org CandidateAccess records (shared + purchased).
 * Allows granting new access and revoking existing ones.
 */
import React, { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { candidateAccessService } from "@/api/services/candidateAccessService"
import { organizationService } from "@/api/services/organizationService"
import {
  Users,
  Search,
  Plus,
  Share2,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Filter,
  RefreshCw,
} from "lucide-react"

const ACCESS_TYPE_CFG = {
  owner: { bg: "bg-purple-50", text: "text-purple-700", label: "Owner", icon: Users },
  shared: { bg: "bg-blue-50", text: "text-blue-700", label: "Shared", icon: Share2 },
  purchased: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: "Purchased",
    icon: CreditCard,
  },
}

function AccessBadge({ type }) {
  const cfg = ACCESS_TYPE_CFG[type] || ACCESS_TYPE_CFG.owner
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ access }) {
  const now = new Date()
  const expired = access.expires_at && new Date(access.expires_at) <= now
  if (!access.is_active || expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">
        <XCircle className="w-3 h-3" />
        {expired ? "Expired" : "Inactive"}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
      <CheckCircle className="w-3 h-3" />
      Active
    </span>
  )
}

function GrantModal({ orgs, onClose, onGrant }) {
  const [form, setForm] = useState({
    candidate_id: "",
    owner_organization_id: "",
    accessor_organization_id: "",
    access_type: "shared",
    expires_at: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.candidate_id.trim() || !form.owner_organization_id) return
    setSaving(true)
    await onGrant({
      ...form,
      granted_at: new Date().toISOString(),
      is_active: true,
      expires_at: form.expires_at || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-black text-gray-900 mb-5">Grant Marketplace Access</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Candidate ID *</label>
            <input
              type="text"
              value={form.candidate_id}
              onChange={(e) => setForm((p) => ({ ...p, candidate_id: e.target.value }))}
              placeholder="Paste candidate ID"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Owner Organization *
            </label>
            <select
              value={form.owner_organization_id}
              onChange={(e) => setForm((p) => ({ ...p, owner_organization_id: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            >
              <option value="">Select owner org…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Accessor Organization
            </label>
            <select
              value={form.accessor_organization_id}
              onChange={(e) => setForm((p) => ({ ...p, accessor_organization_id: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            >
              <option value="">None (pool-level exposure)</option>
              {orgs
                .filter((o) => o.id !== form.owner_organization_id)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Access Type</label>
            <select
              value={form.access_type}
              onChange={(e) => setForm((p) => ({ ...p, access_type: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            >
              <option value="shared">Shared</option>
              <option value="purchased">Purchased</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Expires At (optional)
            </label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-purple-400 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.candidate_id.trim() || !form.owner_organization_id}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 text-sm transition-colors"
            >
              {saving ? "Granting…" : "Grant Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplaceCandidatesPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showGrant, setShowGrant] = useState(false)
  const qc = useQueryClient()

  const { data: accesses = [], isLoading } = useQuery({
    queryKey: ["marketplace-accesses"],
    queryFn: () =>
      candidateAccessService.list({ sort: "created_date", order: "DESC", limit: 1000 }),
    staleTime: 2 * 60 * 1000,
  })

  const { data: orgs = [] } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })

  const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o]))
  const now = new Date()

  // Only show cross-org accesses (not internal owner records)
  const crossOrg = accesses.filter((a) => a.access_type !== "owner")

  const filtered = crossOrg.filter((a) => {
    const ownerName = orgMap[a.owner_organization_id]?.name ?? ""
    const accessorName = orgMap[a.accessor_organization_id]?.name ?? ""
    const matchSearch =
      !search ||
      a.candidate_id?.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase()) ||
      accessorName.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || a.access_type === typeFilter
    const expired = a.expires_at && new Date(a.expires_at) <= now
    const isActive = a.is_active && !expired
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? isActive
          : statusFilter === "expired"
            ? !isActive
            : true
    return matchSearch && matchType && matchStatus
  })

  const stats = {
    total: crossOrg.length,
    active: crossOrg.filter((a) => a.is_active && (!a.expires_at || new Date(a.expires_at) > now))
      .length,
    shared: crossOrg.filter((a) => a.access_type === "shared").length,
    purchased: crossOrg.filter((a) => a.access_type === "purchased").length,
  }

  const handleGrant = async (data) => {
    await candidateAccessService.create(data)
    qc.invalidateQueries(["marketplace-accesses"])
    setShowGrant(false)
  }

  const handleRevoke = async (acc) => {
    await candidateAccessService.update(acc.id, { is_active: false })
    qc.invalidateQueries(["marketplace-accesses"])
  }

  const handleDelete = async (acc) => {
    if (!window.confirm("Delete this access grant permanently?")) return
    await candidateAccessService.remove(acc.id)
    qc.invalidateQueries(["marketplace-accesses"])
  }

  return (
    <div dir="ltr" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Candidate Pool</h1>
          <p className="text-slate-500 mt-1 font-semibold">
            All cross-organization access grants in the marketplace
          </p>
        </div>
        <button
          onClick={() => setShowGrant(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Grant Access
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Grants", value: stats.total, color: "bg-purple-50 text-purple-700" },
          { label: "Active", value: stats.active, color: "bg-emerald-50 text-emerald-700" },
          { label: "Shared", value: stats.shared, color: "bg-blue-50 text-blue-700" },
          { label: "Purchased", value: stats.purchased, color: "bg-amber-50 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <p className="text-3xl font-black">{isLoading ? "..." : s.value}</p>
            <p className="text-sm font-semibold mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate ID or organization…"
            className="outline-none text-sm w-full bg-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
        >
          <option value="all">All Types</option>
          <option value="shared">Shared</option>
          <option value="purchased">Purchased</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired / Inactive</option>
        </select>
        <button
          onClick={() => qc.invalidateQueries(["marketplace-accesses"])}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm text-gray-400 font-semibold">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left font-black text-gray-600 px-5 py-3">Candidate</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Owner Org</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Accessor Org</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Type</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Status</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Granted</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Expires</th>
                <th className="text-left font-black text-gray-600 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array(8)
                        .fill(0)
                        .map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                    </tr>
                  ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-200" />
                      <p className="text-gray-400 font-semibold">No access grants found</p>
                      <button
                        onClick={() => setShowGrant(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4" /> Grant First Access
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const ownerOrg = orgMap[acc.owner_organization_id]
                  const accessorOrg = orgMap[acc.accessor_organization_id]
                  const expired = acc.expires_at && new Date(acc.expires_at) <= now
                  return (
                    <tr
                      key={acc.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 font-mono text-xs">
                              {acc.candidate_id?.slice(0, 12)}…
                            </p>
                            {acc.notes && (
                              <p className="text-xs text-gray-400 truncate max-w-32">{acc.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {ownerOrg ? (
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{ownerOrg.name}</p>
                            <p className="text-xs text-gray-400">
                              {ownerOrg.org_type === "staffing_agency" ? "Staffing" : "HR"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">
                            {acc.owner_organization_id?.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {accessorOrg ? (
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{accessorOrg.name}</p>
                            <p className="text-xs text-gray-400">
                              {accessorOrg.org_type === "staffing_agency" ? "Staffing" : "HR"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <AccessBadge type={acc.access_type} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge access={acc} />
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {acc.granted_at
                          ? new Date(acc.granted_at).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {acc.expires_at ? (
                          <span className={expired ? "text-red-500 font-bold" : "text-gray-500"}>
                            {new Date(acc.expires_at).toLocaleDateString("en-GB")}
                          </span>
                        ) : (
                          <span className="text-gray-300">∞ Permanent</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {acc.is_active && !expired && (
                            <button
                              onClick={() => handleRevoke(acc)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                            >
                              <Clock className="w-3 h-3" /> Revoke
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(acc)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grant Modal */}
      {showGrant && (
        <GrantModal orgs={orgs} onClose={() => setShowGrant(false)} onGrant={handleGrant} />
      )}
    </div>
  )
}
