import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { userService } from "@/api/services/userService"
import { organizationService } from "@/api/services/organizationService"
import {
  BriefcaseBusiness,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  Users,
} from "lucide-react"
import { platformFieldClassName } from "@/components/platform/PlatformUI"

const ROLE_CONFIG = {
  admin: { bg: "bg-red-100", text: "text-red-800" },
  org_admin: { bg: "bg-purple-50", text: "text-purple-700" },
  recruitment_manager: { bg: "bg-blue-50", text: "text-blue-700" },
  team_manager: { bg: "bg-indigo-50", text: "text-indigo-700" },
  recruiter: { bg: "bg-cyan-50", text: "text-cyan-700" },
  hr_manager: { bg: "bg-teal-50", text: "text-teal-700" },
  internal_recruiter: { bg: "bg-sky-50", text: "text-sky-700" },
  candidate: { bg: "bg-gray-50", text: "text-gray-600" },
}

const ALL_ROLES = [
  "admin",
  "org_admin",
  "recruitment_manager",
  "team_manager",
  "recruiter",
  "hr_manager",
  "internal_recruiter",
  "candidate",
]

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  role: "candidate",
  organization_id: "",
  is_active: true,
}

// ─── User Form Modal ─────────────────────────────────────────────────────────
function UserModal({ open, onClose, user, orgs, onSave, isSaving, t, isRTL }) {
  const isEdit = !!user?.id

  const [form, setForm] = useState(
    isEdit
      ? {
          full_name: user.full_name || "",
          email: user.email || "",
          password: "",
          phone: user.phone || "",
          role: user.role || "candidate",
          organization_id: user.organization_id || "",
          is_active: user.is_active ?? true,
        }
      : { ...EMPTY_FORM },
  )

  const [errors, setErrors] = useState({})

  // Sync form when user prop changes
  React.useEffect(() => {
    if (open) {
      setErrors({})
      setForm(
        isEdit
          ? {
              full_name: user.full_name || "",
              email: user.email || "",
              password: "",
              phone: user.phone || "",
              role: user.role || "candidate",
              organization_id: user.organization_id || "",
              is_active: user.is_active ?? true,
            }
          : { ...EMPTY_FORM },
      )
    }
  }, [open, user?.id])

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))

    if (errors[k]) {
      setErrors((e) => ({ ...e, [k]: null }))
    }
  }

  const validate = () => {
    const e = {}

    if (!form.full_name?.trim()) {
      e.full_name = t("platform.usersManagement.modal.required", "Required")
    }

    if (!form.email?.trim()) {
      e.email = t("platform.usersManagement.modal.required", "Required")
    }

    if (!isEdit && (!form.password || form.password.length < 8)) {
      e.password = t("platform.usersManagement.modal.passwordHint")
    }

    return e
  }

  const handleSubmit = () => {
    const e = validate()

    if (Object.keys(e).length > 0) {
      setErrors(e)

      return
    }

    onSave(form)
  }

  if (!open) {
    return null
  }

  return (
    <PlatformModal
      dir={isRTL ? "rtl" : "ltr"}
      title={
        isEdit
          ? t("platform.usersManagement.modal.editTitle")
          : t("platform.usersManagement.modal.createTitle")
      }
      subtitle={isEdit ? form.email : t("platform.usersManagement.subtitle")}
      icon={isEdit ? Pencil : UserRound}
      tone={isEdit ? "blue" : "violet"}
      maxWidth="max-w-lg"
      onClose={onClose}
    >
      <div className="max-h-[68vh] space-y-4 overflow-y-auto pe-1">
        {/* Full Name */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.fullName")} *
          </label>

          <input
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            className={`${platformFieldClassName} ${errors.full_name ? "!border-red-400 !bg-red-50 !ring-red-50" : ""}`}
          />

          {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.email")} *
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={isEdit}
            className={`${platformFieldClassName} disabled:bg-slate-50 disabled:text-slate-400 ${errors.email ? "!border-red-400 !bg-red-50 !ring-red-50" : ""}`}
          />

          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Password (create only) */}
        {!isEdit && (
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {t("platform.usersManagement.modal.password")} *
            </label>

            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`${platformFieldClassName} ${errors.password ? "!border-red-400 !bg-red-50 !ring-red-50" : ""}`}
            />

            <p
              className={`mt-1 text-xs ${errors.password ? "font-semibold text-red-500" : "text-slate-400"}`}
            >
              {errors.password || t("platform.usersManagement.modal.passwordHint")}
            </p>
          </div>
        )}

        {/* Phone */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.phone")}
          </label>

          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={platformFieldClassName}
          />
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.role")}
          </label>

          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className={platformFieldClassName}
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`platform.usersManagement.roles.${r}`, r)}
              </option>
            ))}
          </select>
        </div>

        {/* Organization */}
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.organization")}
          </label>

          <select
            value={form.organization_id}
            onChange={(e) => set("organization_id", e.target.value)}
            className={platformFieldClassName}
          >
            <option value="">—</option>

            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <label className="text-sm font-bold text-slate-700">
            {t("platform.usersManagement.modal.status")}
          </label>

          <button
            type="button"
            onClick={() => set("is_active", !form.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${form.is_active ? "border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-500" : "border-slate-200 bg-slate-200"}`}
          >
            <span
              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform ${form.is_active ? (isRTL ? "-translate-x-1" : "translate-x-[20px]") : isRTL ? "-translate-x-[20px]" : "translate-x-0.5"}`}
            />
          </button>

          <span className="text-sm font-medium text-slate-500">
            {form.is_active
              ? t("platform.usersManagement.modal.active")
              : t("platform.usersManagement.modal.inactive")}
          </span>
        </div>

        {/* Footer */}
        <div
          className={`flex gap-3 border-t border-slate-100 pt-4 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving
              ? isEdit
                ? t("platform.usersManagement.modal.saving")
                : t("platform.usersManagement.modal.creating")
              : t("platform.usersManagement.modal.save")}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onClose}
            disabled={isSaving}
          >
            {t("platform.usersManagement.modal.cancel")}
          </Button>
        </div>
      </div>
    </PlatformModal>
  )
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteConfirm({ open, onClose, user, onConfirm, isDeleting, t, isRTL }) {
  if (!open || !user) {
    return null
  }

  return (
    <PlatformModal
      dir={isRTL ? "rtl" : "ltr"}
      title={t("platform.usersManagement.deleteConfirm.title")}
      subtitle={user.full_name || user.email}
      icon={Trash2}
      tone="rose"
      maxWidth="max-w-sm"
      onClose={onClose}
    >
      <p className="mb-6 text-sm leading-6 text-slate-600">
        {t("platform.usersManagement.deleteConfirm.message", {
          name: user.full_name || user.email,
        })}
      </p>

      <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <Button
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting
            ? t("platform.usersManagement.deleteConfirm.deleting")
            : t("platform.usersManagement.deleteConfirm.confirm")}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onClose}
          disabled={isDeleting}
        >
          {t("platform.usersManagement.deleteConfirm.cancel")}
        </Button>
      </div>
    </PlatformModal>
  )
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3500)

    return () => clearTimeout(timer)
  }, [message])

  if (!message) {
    return null
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(30,41,59,0.2)] transition-all ${type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}
    >
      {message}

      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UsersManagementPage() {
  const { t, i18n } = useTranslation()

  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")

  const [roleFilter, setRoleFilter] = useState("all")

  const [modalOpen, setModalOpen] = useState(false)

  const [editUser, setEditUser] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const [toast, setToast] = useState(null)

  const isRTL = i18n.language?.startsWith("he")

  const showToast = (message, type = "success") => setToast({ message, type })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: () =>
      userService.list({ sort: "created_date", order: "DESC", limit: 500 }).catch(() => []),
    staleTime: 2 * 60 * 1000,
  })

  const { data: orgs = [] } = useQuery({
    queryKey: ["platform-orgs"],
    queryFn: () => organizationService.list({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })

  const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]))

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
      setModalOpen(false)
      showToast(t("platform.usersManagement.toast.created"))
    },
    onError: () => showToast(t("platform.usersManagement.toast.error"), "error"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
      setModalOpen(false)
      setEditUser(null)
      showToast(t("platform.usersManagement.toast.updated"))
    },
    onError: () => showToast(t("platform.usersManagement.toast.error"), "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-users"] })
      setDeleteTarget(null)
      showToast(t("platform.usersManagement.toast.deleted"))
    },
    onError: () => showToast(t("platform.usersManagement.toast.error"), "error"),
  })

  const handleSave = (form) => {
    // Sanitize: empty string → null for UUID fields, trim strings
    const sanitized = {
      ...form,
      full_name: form.full_name?.trim(),
      email: form.email?.trim(),
      phone: form.phone?.trim() || undefined,
      organization_id: form.organization_id || null,
    }

    if (editUser?.id) {
      const { email: _email, password: _password, ...rest } = sanitized

      updateMutation.mutate({ id: editUser.id, data: rest })
    } else {
      if (!sanitized.password || sanitized.password.length < 8) {
        showToast(t("platform.usersManagement.modal.passwordHint"), "error")

        return
      }

      if (!sanitized.full_name) {
        showToast(t("platform.usersManagement.modal.fullName") + " — required", "error")

        return
      }

      createMutation.mutate(sanitized)
    }
  }

  const openCreate = () => {
    setEditUser(null)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setModalOpen(true)
  }

  const openDelete = (u) => setDeleteTarget(u)

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())

    const matchRole = roleFilter === "all" || u.role === roleFilter

    return matchSearch && matchRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => ["admin", "org_admin"].includes(u.role)).length,
    recruiters: users.filter((u) =>
      ["recruiter", "team_manager", "recruitment_manager", "internal_recruiter"].includes(u.role),
    ).length,
    candidates: users.filter((u) => u.role === "candidate").length,
  }

  const getRoleLabel = (role) => t(`platform.usersManagement.roles.${role}`, role)

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <PlatformPageShell dir={isRTL ? "rtl" : "ltr"}>
      {/* Modals */}
      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditUser(null)
        }}
        user={editUser}
        orgs={orgs}
        onSave={handleSave}
        isSaving={isSaving}
        t={t}
        isRTL={isRTL}
      />

      <DeleteConfirm
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        user={deleteTarget}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isDeleting={deleteMutation.isPending}
        t={t}
        isRTL={isRTL}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-5">
        <PlatformPageHeader
          title={t("platform.usersManagement.title")}
          subtitle={t("platform.usersManagement.subtitle")}
          icon={UserCog}
          actions={
            <Button
              variant="primary"
              size="sm"
              className="shadow-[0_12px_28px_rgba(99,72,210,0.25)]"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />

              {t("platform.usersManagement.addUser")}
            </Button>
          }
        />

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Users}
            label={t("platform.usersManagement.stats.totalUsers")}
            value={stats.total}
            tone="violet"
            loading={isLoading}
            meta={t("platform.usersManagement.usersCount")}
          />

          <PlatformStatCard
            icon={ShieldCheck}
            label={t("platform.usersManagement.stats.admins")}
            value={stats.admins}
            tone="rose"
            loading={isLoading}
            meta={t("platform.usersManagement.roles.admin", "Admin")}
          />

          <PlatformStatCard
            icon={BriefcaseBusiness}
            label={t("platform.usersManagement.stats.recruiters")}
            value={stats.recruiters}
            tone="blue"
            loading={isLoading}
            meta={t("platform.usersManagement.roles.recruiter", "Recruiter")}
          />

          <PlatformStatCard
            icon={UserRound}
            label={t("platform.usersManagement.stats.candidates")}
            value={stats.candidates}
            tone="slate"
            loading={isLoading}
            meta={t("platform.usersManagement.roles.candidate", "Candidate")}
          />
        </div>

        {/* Filters */}
        <PlatformCard className="p-5">
          <PlatformWidgetHeader
            title={t("platform.usersManagement.filters.allRoles")}
            subtitle={`${filtered.length} ${t("platform.usersManagement.usersCount")}`}
            action={
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
            }
          />

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(260px,1fr)_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("platform.usersManagement.search")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pe-4 ps-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
            >
              <option value="all">{t("platform.usersManagement.filters.allRoles")}</option>

              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {getRoleLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </PlatformCard>

        {/* Table */}
        <PlatformCard className="overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <PlatformWidgetHeader
              title={t("platform.usersManagement.title")}
              subtitle={t("platform.usersManagement.subtitle")}
              action={
                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-700">
                  {filtered.length} {t("platform.usersManagement.usersCount")}
                </span>
              }
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    t("platform.usersManagement.table.user"),
                    t("platform.usersManagement.table.role"),
                    t("platform.usersManagement.table.organization"),
                    t("platform.usersManagement.table.created"),
                    t("platform.usersManagement.table.actions"),
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
                        {Array(5)
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
                    <td colSpan={5} className="p-5">
                      <PlatformEmptyState icon={Search}>
                        {t("platform.usersManagement.noUsers")}
                      </PlatformEmptyState>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, index) => {
                    const role = ROLE_CONFIG[u.role] || { bg: "bg-gray-50", text: "text-gray-600" }

                    const roleLabel = getRoleLabel(u.role)

                    const orgName = orgMap[u.organization_id] || u.organization_id || "—"

                    const locale = isRTL ? "he-IL" : "en-US"

                    return (
                      <tr key={u.id} className="group transition-colors hover:bg-violet-50/35">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xs font-black ${
                                index % 3 === 0
                                  ? "from-violet-100 to-fuchsia-50 text-violet-700"
                                  : index % 3 === 1
                                    ? "from-blue-100 to-cyan-50 text-blue-700"
                                    : "from-cyan-100 to-emerald-50 text-cyan-700"
                              }`}
                            >
                              {(u.full_name || u.email || "?")[0].toUpperCase()}

                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${u.is_active === false ? "bg-slate-300" : "bg-emerald-500"}`}
                              />
                            </div>

                            <div>
                              <p className="font-extrabold text-slate-800 transition group-hover:text-violet-700">
                                {u.full_name || "—"}
                              </p>

                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${role.bg} ${role.text}`}
                          >
                            {roleLabel}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                          {orgName}
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-slate-400">
                          {u.created_date
                            ? new Date(u.created_date).toLocaleDateString(locale)
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDelete(u)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 transition hover:border-rose-200 hover:bg-rose-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </PlatformCard>
      </div>
    </PlatformPageShell>
  )
}
import { Plus, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/Button"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformModal,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
  PlatformWidgetHeader,
} from "@/components/platform/PlatformUI"
