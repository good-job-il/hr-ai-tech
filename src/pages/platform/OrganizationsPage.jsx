import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { organizationService } from "@/api/services/organizationService"
import { useAuth } from "@/lib/AuthContext"
import { Building2, Search, CheckCircle, XCircle, Clock, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { platformFieldClassName } from "@/components/platform/PlatformUI"

const TABS = [
  {
    id: "staffing",
    route: "/platform/organizations/staffing",
    orgType: "staffing_agency",
    labelKey: "platform.orgs.staffing",
  },
  {
    id: "companies",
    route: "/platform/organizations/companies",
    orgType: "organization",
    labelKey: "platform.orgs.companies",
  },
]

export default function OrganizationsPage() {
  const { t } = useTranslation()

  const location = useLocation()

  const navigate = useNavigate()

  const { enterOrganization } = useAuth()

  const [enteringOrgId, setEnteringOrgId] = useState(null)

  const activeTab = TABS.find((tab) => location.pathname.startsWith(tab.route)) ?? TABS[0]

  const [search, setSearch] = useState("")

  const [showModal, setShowModal] = useState(false)

  const [newOrg, setNewOrg] = useState({ name: "", contact_email: "" })

  const [creating, setCreating] = useState(false)

  const [editOrg, setEditOrg] = useState(null)

  const [saving, setSaving] = useState(false)

  const [deleteOrg, setDeleteOrg] = useState(null)

  const [deleting, setDeleting] = useState(false)

  const qc = useQueryClient()

  const STATUS_CONFIG = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      label: t("platform.orgs.statusActive"),
      icon: CheckCircle,
    },
    suspended: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: t("platform.orgs.statusSuspended"),
      icon: XCircle,
    },
    inactive: {
      bg: "bg-gray-50",
      text: "text-gray-500",
      label: t("platform.orgs.statusInactive"),
      icon: Clock,
    },
  }

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ sort: "created_date", order: "DESC", limit: 500 }),
    staleTime: 2 * 60 * 1000,
  })

  const tabOrgs = orgs.filter((o) => o.org_type === activeTab.orgType)

  const filtered = tabOrgs.filter((o) => {
    const matchSearch =
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.contact_email?.toLowerCase().includes(search.toLowerCase())

    return matchSearch
  })

  const handleCreate = async () => {
    if (!newOrg.name.trim()) {
      return
    }

    setCreating(true)
    await organizationService.create({
      ...newOrg,
      org_type: activeTab.orgType,
      status: "active",
      plan: "trial",
    })
    await qc.invalidateQueries(["platform-orgs"])
    setNewOrg({ name: "", contact_email: "" })
    setShowModal(false)
    setCreating(false)
  }

  const handleEdit = (org) => {
    setEditOrg({
      id: org.id,
      name: org.name,
      contact_email: org.contact_email || "",
      plan: org.plan || "trial",
      status: org.status || "active",
    })
  }

  const handleSaveEdit = async () => {
    if (!editOrg.name.trim()) {
      return
    }

    setSaving(true)

    const payload = { name: editOrg.name, plan: editOrg.plan, status: editOrg.status }

    if (editOrg.contact_email.trim()) {
      payload.contact_email = editOrg.contact_email.trim()
    }

    await organizationService.update(editOrg.id, payload)
    await qc.invalidateQueries(["platform-orgs"])
    setEditOrg(null)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteOrg) {
      return
    }

    setDeleting(true)
    await organizationService.remove(deleteOrg.id)
    await qc.invalidateQueries(["platform-orgs"])
    setDeleteOrg(null)
    setDeleting(false)
  }

  // Admin: enter this organization's workspace and see it exactly as its
  // own users do (org_admin / recruitment_manager / hr_manager view).
  const handleEnterWorkspace = async (org) => {
    if (enteringOrgId) {
      return
    }

    setEnteringOrgId(org.id)

    try {
      await enterOrganization(org.id)
      navigate(org.org_type === "staffing_agency" ? "/agency/dashboard" : "/company/dashboard")
    } catch (e) {
      console.error("Failed to enter organization workspace:", e)
    } finally {
      setEnteringOrgId(null)
    }
  }

  const stats = {
    total: tabOrgs.length,
    active: tabOrgs.filter((o) => o.status === "active").length,
    suspended: tabOrgs.filter((o) => o.status === "suspended").length,
    inactive: tabOrgs.filter((o) => o.status !== "active" && o.status !== "suspended").length,
  }

  return (
    <PlatformPageShell>
      <div className="space-y-5">
        <PlatformPageHeader
          title={t("platform.orgs.title")}
          subtitle={t("platform.orgs.subtitle")}
          icon={Building2}
          actions={
            <Button
              variant="primary"
              size="sm"
              className="shadow-[0_12px_28px_rgba(99,72,210,0.25)]"
              onClick={() => {
                setNewOrg({ name: "", contact_email: "" })
                setShowModal(true)
              }}
            >
              <Plus className="h-4 w-4" />

              {t("platform.orgs.newOrg")}
            </Button>
          }
        />

        <PlatformCard className="inline-flex max-w-full items-center gap-1 overflow-x-auto p-1.5">
          {TABS.map((tab) => {
            const active = location.pathname.startsWith(tab.route)

            return (
              <Link
                key={tab.id}
                to={tab.route}
                className={`flex min-w-max items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${
                  active
                    ? "gradient-brand text-white shadow-[0_8px_20px_rgba(103,78,218,0.25)]"
                    : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <Building2 className="h-4 w-4" />

                {t(tab.labelKey)}
              </Link>
            )
          })}
        </PlatformCard>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Building2}
            label={t("platform.orgs.total")}
            value={stats.total}
            tone="violet"
            loading={isLoading}
            meta={t(activeTab.labelKey)}
          />

          <PlatformStatCard
            icon={CheckCircle}
            label={t("platform.orgs.active")}
            value={stats.active}
            tone="emerald"
            loading={isLoading}
            meta={t("platform.orgs.statusActive")}
          />

          <PlatformStatCard
            icon={XCircle}
            label={t("platform.orgs.suspended")}
            value={stats.suspended}
            tone="rose"
            loading={isLoading}
            meta={t("platform.orgs.statusSuspended")}
          />

          <PlatformStatCard
            icon={Clock}
            label={t("platform.orgs.inactive")}
            value={stats.inactive}
            tone="slate"
            loading={isLoading}
            meta={t("platform.orgs.statusInactive")}
          />
        </div>

        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader
              title={t(activeTab.labelKey)}
              subtitle={t("platform.orgs.orgCount", { count: filtered.length })}
              action={
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("platform.orgs.searchPlaceholder")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pe-4 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  />
                </div>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.colName")}
                  </th>

                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.colType")}
                  </th>

                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.colEmail")}
                  </th>

                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.plan")}
                  </th>

                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.status")}
                  </th>

                  <th className="px-5 py-3.5 text-start text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
                    {t("platform.orgs.actions")}
                  </th>
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
                        {t("platform.orgs.noResults")}
                      </PlatformEmptyState>
                    </td>
                  </tr>
                ) : (
                  filtered.map((org, index) => {
                    const st = STATUS_CONFIG[org.status] || STATUS_CONFIG.inactive

                    const StIcon = st.icon

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
                                ID: {String(org.id).slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-slate-600">
                            {org.org_type === "staffing_agency"
                              ? t("platform.orgs.typeStaffing")
                              : t("platform.orgs.typeInternalHR")}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {org.contact_email || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">
                            {org.plan || "trial"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.bg} ${st.text}`}
                          >
                            <StIcon className="h-3 w-3" />

                            {st.label}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-violet-600 hover:shadow-sm">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="min-w-[170px] rounded-xl border-slate-100 p-1.5 shadow-xl"
                            >
                              <DropdownMenuItem
                                onClick={() => handleEnterWorkspace(org)}
                                disabled={enteringOrgId === org.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg focus:bg-violet-50 focus:text-violet-700"
                              >
                                <ExternalLink className="h-4 w-4 text-violet-500" />

                                <span>
                                  {enteringOrgId === org.id
                                    ? t("platform.orgs.btnOpening", "Opening…")
                                    : t("platform.orgs.btnOpen")}
                                </span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleEdit(org)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg focus:bg-blue-50 focus:text-blue-700"
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />

                                <span>{t("platform.orgs.btnEdit")}</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setDeleteOrg(org)}
                                className="flex cursor-pointer items-center gap-2 rounded-lg text-red-600 focus:bg-red-50 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />

                                <span>{t("platform.orgs.delete")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {showModal && (
        <PlatformModal
          title={t("platform.orgs.modalTitle")}
          subtitle={t(activeTab.labelKey)}
          icon={Building2}
          onClose={() => setShowModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.labelOrgName")}
              </label>

              <input
                type="text"
                value={newOrg.name}
                onChange={(e) => setNewOrg((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("platform.orgs.placeholderOrgName")}
                className={platformFieldClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.labelType")}
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-sm font-bold text-violet-700">
                <Building2 className="h-4 w-4" />

                {t(activeTab.labelKey)}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.labelEmail")}
              </label>

              <input
                type="email"
                value={newOrg.contact_email}
                onChange={(e) => setNewOrg((p) => ({ ...p, contact_email: e.target.value }))}
                placeholder={t("platform.orgs.placeholderEmail")}
                className={platformFieldClassName}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                {t("platform.orgs.btnCancel")}
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleCreate}
                disabled={creating || !newOrg.name.trim()}
              >
                {creating ? t("platform.orgs.btnCreating") : t("platform.orgs.btnCreate")}
              </Button>
            </div>
          </div>
        </PlatformModal>
      )}

      {editOrg && (
        <PlatformModal
          title={t("platform.orgs.editModalTitle")}
          subtitle={editOrg.name}
          icon={Pencil}
          tone="blue"
          onClose={() => setEditOrg(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.labelOrgName")}
              </label>

              <input
                type="text"
                value={editOrg.name}
                onChange={(e) => setEditOrg((p) => ({ ...p, name: e.target.value }))}
                className={platformFieldClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.labelEmail")}
              </label>

              <input
                type="email"
                value={editOrg.contact_email}
                onChange={(e) => setEditOrg((p) => ({ ...p, contact_email: e.target.value }))}
                placeholder={t("platform.orgs.placeholderEmail")}
                className={platformFieldClassName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.plan")}
              </label>

              <select
                value={editOrg.plan}
                onChange={(e) => setEditOrg((p) => ({ ...p, plan: e.target.value }))}
                className={platformFieldClassName}
              >
                {["trial", "starter", "pro", "enterprise"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                {t("platform.orgs.status")}
              </label>

              <div className="grid grid-cols-3 gap-2">
                {["active", "suspended", "inactive"].map((s) => {
                  const cfg = STATUS_CONFIG[s]

                  const isSelected = editOrg.status === s

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditOrg((p) => ({ ...p, status: s }))}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2.5 text-[11px] font-bold transition-colors ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} border-current`
                          : "border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <cfg.icon className="h-3.5 w-3.5" />

                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setEditOrg(null)}
                disabled={saving}
              >
                {t("platform.orgs.btnCancel")}
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={saving || !editOrg.name.trim()}
              >
                {saving ? t("platform.orgs.btnSaving") : t("platform.orgs.btnSave")}
              </Button>
            </div>
          </div>
        </PlatformModal>
      )}

      {deleteOrg && (
        <PlatformModal
          title={t("platform.orgs.confirmDeleteTitle")}
          subtitle={deleteOrg.name}
          icon={Trash2}
          tone="rose"
          maxWidth="max-w-sm"
          onClose={() => setDeleteOrg(null)}
        >
          <p className="mb-6 text-sm leading-6 text-slate-600">
            {t("platform.orgs.confirmDeleteMsg", { name: deleteOrg.name })}
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setDeleteOrg(null)}
              disabled={deleting}
            >
              {t("platform.orgs.btnCancel")}
            </Button>

            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("platform.orgs.btnDeleting") : t("platform.orgs.btnConfirmDelete")}
            </Button>
          </div>
        </PlatformModal>
      )}
    </PlatformPageShell>
  )
}
