import { MoreVertical, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { useAuth } from "@/lib/AuthContext"
import { useToast } from "@/components/ui/use-toast"

import { Building2, Clock3, Mail, ShieldCheck, Users, XCircle } from "lucide-react"

const dialogClassName =
  "max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-[24px] border-white/80 bg-white p-6 shadow-2xl sm:rounded-[24px] [&>button]:start-auto [&>button]:end-4 [&>button]:rounded-xl [&>button]:p-2"

const tabClassName =
  "gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-violet-50 hover:text-violet-700 data-[state=active]:bg-[image:var(--gradient-brand)] data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_rgba(103,78,218,0.25)]"

const activeBadgeClassName = "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"

const inactiveBadgeClassName = "border-slate-100 bg-slate-100 text-slate-500 hover:bg-slate-100"

const ROLES = ["org_admin", "recruitment_manager", "team_manager", "recruiter"]

const ROLE_COLORS = {
  org_admin: "bg-purple-50 text-purple-700 border-purple-200",
  recruitment_manager: "bg-blue-50 text-blue-700 border-blue-200",
  team_manager: "bg-cyan-50 text-cyan-700 border-cyan-200",
  recruiter: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const EMPTY_INVITE = { full_name: "", email: "", phone: "", role: "recruiter", team_id: "none" }

function InviteDialog({ open, setOpen, teams, roles, onSubmit, pending, t, isRtl }) {
  const [form, setForm] = useState(EMPTY_INVITE)

  const submit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, team_id: form.team_id === "none" ? null : Number(form.team_id) }, () => {
      setForm(EMPTY_INVITE)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className={dialogClassName}
        overlayClassName="bg-slate-950/40 backdrop-blur-sm"
      >
        <DialogHeader className="mb-1 pe-8 text-start sm:text-start">
          <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-900">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600">
              <Mail className="h-5 w-5" />
            </span>
            {t("agencyTeams.invite.title")}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="invite-full-name">{t("agencyTeams.fields.fullName")}</Label>

            <Input
              id="invite-full-name"
              className={`${platformFieldClassName} mt-1 h-auto`}
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="invite-email">{t("agencyTeams.fields.email")}</Label>

            <Input
              id="invite-email"
              className={`${platformFieldClassName} mt-1 h-auto`}
              type="email"
              dir="ltr"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="invite-phone">{t("agencyTeams.fields.phone")}</Label>

            <Input
              id="invite-phone"
              className={`${platformFieldClassName} mt-1 h-auto`}
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label id="invite-role-label">{t("agencyTeams.fields.role")}</Label>

              <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                <SelectTrigger
                  className={`${platformFieldClassName} mt-1 h-auto`}
                  aria-labelledby="invite-role-label"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`agencyTeams.roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label id="invite-team-label">{t("agencyTeams.fields.team")}</Label>

              <Select
                value={form.team_id}
                onValueChange={(team_id) => setForm({ ...form, team_id })}
              >
                <SelectTrigger
                  className={`${platformFieldClassName} mt-1 h-auto`}
                  aria-labelledby="invite-team-label"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">{t("agencyTeams.noTeam")}</SelectItem>

                  {teams
                    .filter((x) => x.is_active)
                    .map((team) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert className="rounded-2xl border-violet-100 bg-violet-50/60 text-violet-700">
            <Mail className="h-4 w-4" />

            <AlertDescription>{t("agencyTeams.invite.hint")}</AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>

            <Button disabled={pending}>
              {pending ? t("common.loading") : t("agencyTeams.invite.send")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TeamDialog({ open, setOpen, team, managers, onSubmit, pending, t, isRtl }) {
  const [form, setForm] = useState({
    name: team?.name || "",
    description: team?.description || "",
    manager_id: team?.manager_id ? String(team.manager_id) : "none",
  })

  const submit = (e) => {
    e.preventDefault()
    onSubmit(
      { ...form, manager_id: form.manager_id === "none" ? null : Number(form.manager_id) },
      () => {
        setOpen(false)
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className={dialogClassName}
        overlayClassName="bg-slate-950/40 backdrop-blur-sm"
      >
        <DialogHeader className="mb-1 pe-8 text-start sm:text-start">
          <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-900">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
            {t(team ? "agencyTeams.teamModal.editTitle" : "agencyTeams.teamModal.title")}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="team-name">{t("agencyTeams.teamModal.name")}</Label>

            <Input
              id="team-name"
              className={`${platformFieldClassName} mt-1 h-auto`}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="team-description">{t("agencyTeams.teamModal.description")}</Label>

            <Input
              id="team-description"
              className={`${platformFieldClassName} mt-1 h-auto`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <Label id="team-manager-label">{t("agencyTeams.teamModal.manager")}</Label>

            <Select
              value={form.manager_id}
              onValueChange={(manager_id) => setForm({ ...form, manager_id })}
            >
              <SelectTrigger
                className={`${platformFieldClassName} mt-1 h-auto`}
                aria-labelledby="team-manager-label"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">{t("agencyTeams.unassigned")}</SelectItem>

                {managers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>

            <Button disabled={pending}>
              {pending ? t("common.loading") : t(team ? "common.save" : "common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MemberDialog({ member, setMember, teams, roles, onSubmit, pending, t, isRtl }) {
  const [role, setRole] = useState(member?.role || "recruiter")

  const [teamId, setTeamId] = useState(member?.team_id ? String(member.team_id) : "none")

  if (!member) {
    return null
  }

  return (
    <Dialog open onOpenChange={(open) => !open && setMember(null)}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className={dialogClassName}
        overlayClassName="bg-slate-950/40 backdrop-blur-sm"
      >
        <DialogHeader className="mb-1 pe-8 text-start sm:text-start">
          <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-900">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600">
              <UserCog className="h-5 w-5" />
            </span>
            {t("agencyTeams.memberModal.title", { name: member.full_name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label id="member-role-label">{t("agencyTeams.fields.role")}</Label>

            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                className={`${platformFieldClassName} mt-1 h-auto`}
                aria-labelledby="member-role-label"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {roles.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`agencyTeams.roles.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label id="member-team-label">{t("agencyTeams.fields.team")}</Label>

            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger
                className={`${platformFieldClassName} mt-1 h-auto`}
                aria-labelledby="member-team-label"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="none">{t("agencyTeams.noTeam")}</SelectItem>

                {teams
                  .filter((x) => x.is_active)
                  .map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMember(null)}>
              {t("common.cancel")}
            </Button>

            <Button
              disabled={pending}
              onClick={() =>
                onSubmit(member.id, { role, team_id: teamId === "none" ? null : Number(teamId) })
              }
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AgencyTeamsPage() {
  const { t, i18n } = useTranslation()

  const isRtl = !i18n.language?.startsWith("en")

  const { user } = useAuth()

  const canManageTeams = ["org_admin", "recruitment_manager", "admin"].includes(user?.role)

  const canManageMembers = ["org_admin", "recruitment_manager", "team_manager", "admin"].includes(
    user?.role,
  )

  const visibleRoles =
    user?.role === "team_manager"
      ? ["recruiter"]
      : user?.role === "recruitment_manager"
        ? ["team_manager", "recruiter"]
        : ROLES

  const { toast } = useToast()

  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")

  const [roleFilter, setRoleFilter] = useState("all")

  const [inviteOpen, setInviteOpen] = useState(false)

  const [teamOpen, setTeamOpen] = useState(false)

  const [editingTeam, setEditingTeam] = useState(null)

  const [deletingTeam, setDeletingTeam] = useState(null)

  const [editingMember, setEditingMember] = useState(null)

  const [deletingMember, setDeletingMember] = useState(null)

  const [lastLink, setLastLink] = useState("")

  const query = useQuery({ queryKey: ["agency-teams"], queryFn: agencyTeamsService.overview })

  const data = query.data || { members: [], teams: [], invitations: [] }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["agency-teams"] })

  const fail = (error) =>
    toast({ title: error?.message || t("common.error"), variant: "destructive" })

  const invite = useMutation({ mutationFn: agencyTeamsService.invite, onError: fail })

  const removeMember = useMutation({
    mutationFn: agencyTeamsService.removeMember,
    onSuccess: () => {
      invalidate()
      setDeletingMember(null)
      toast({ title: t("agencyTeams.memberActions.deleted") })
    },
    onError: fail,
  })

  const createTeam = useMutation({ mutationFn: agencyTeamsService.createTeam, onError: fail })

  const updateTeam = useMutation({
    mutationFn: ({ id, payload }) => agencyTeamsService.updateTeam(id, payload),
    onSuccess: () => {
      invalidate()
      setEditingTeam(null)
      toast({ title: t("agencyTeams.teamModal.saved") })
    },
    onError: fail,
  })

  const removeTeam = useMutation({
    mutationFn: agencyTeamsService.removeTeam,
    onSuccess: () => {
      invalidate()
      setDeletingTeam(null)
      toast({ title: t("agencyTeams.teamModal.deleted") })
    },
    onError: fail,
  })

  const updateMember = useMutation({
    mutationFn: ({ id, payload }) => agencyTeamsService.updateMember(id, payload),
    onSuccess: invalidate,
    onError: fail,
  })

  const resend = useMutation({
    mutationFn: agencyTeamsService.resend,
    onSuccess: (result) => {
      invalidate()
      showInviteLink(result.invite_token)
    },
    onError: fail,
  })

  const cancel = useMutation({
    mutationFn: agencyTeamsService.cancel,
    onSuccess: invalidate,
    onError: fail,
  })

  const teamById = useMemo(() => Object.fromEntries(data.teams.map((x) => [x.id, x])), [data.teams])

  const members = useMemo(
    () =>
      data.members.filter(
        (m) =>
          (roleFilter === "all" || m.role === roleFilter) &&
          (!search.trim() ||
            `${m.full_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [data.members, roleFilter, search],
  )

  const pendingInvites = data.invitations.filter((x) => x.status === "pending")

  const showInviteLink = (token) => {
    const link = `${window.location.origin}/register?invite=${encodeURIComponent(token)}`

    setLastLink(link)
    navigator.clipboard?.writeText(link)
    toast({ title: t("agencyTeams.invite.copied") })
  }

  const submitInvite = (payload, done) =>
    invite.mutate(payload, {
      onSuccess: (result) => {
        invalidate()
        showInviteLink(result.invite_token)
        done()
      },
    })

  const submitTeam = (payload, done) =>
    createTeam.mutate(payload, {
      onSuccess: () => {
        invalidate()
        toast({ title: t("agencyTeams.teamModal.created") })
        done()
      },
    })

  const submitTeamEdit = (payload, done) =>
    updateTeam.mutate(
      { id: editingTeam.id, payload },
      {
        onSuccess: () => done(),
      },
    )

  const toggleMember = (member) =>
    updateMember.mutate({ id: member.id, payload: { is_active: !member.is_active } })

  const saveMember = (id, payload) =>
    updateMember.mutate(
      { id, payload },
      {
        onSuccess: () => {
          setEditingMember(null)
          toast({ title: t("agencyTeams.memberModal.saved") })
        },
      },
    )

  if (query.isError) {
    return (
      <PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
        <PlatformCard className="p-5">
          <PlatformEmptyState icon={XCircle} className="min-h-72">
            <p role="alert" className="font-bold text-slate-700">
              {t("agencyTeams.errorTitle")}
            </p>

            <Button className="mt-3" variant="outline" onClick={() => query.refetch()}>
              {t("common.retry")}
            </Button>
          </PlatformEmptyState>
        </PlatformCard>
      </PlatformPageShell>
    )
  }

  return (
    <PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
      <div className="space-y-5">
        <PlatformPageHeader
          title={t("agencyTeams.title")}
          subtitle={t("agencyTeams.subtitle")}
          icon={Users}
          actions={
            canManageMembers && (
              <Button
                variant="primary"
                size="sm"
                className="shadow-[0_12px_28px_rgba(99,72,210,0.25)]"
                onClick={() => setInviteOpen(true)}
              >
                <Plus className="me-2 h-4 w-4" />

                {t("agencyTeams.inviteMember")}
              </Button>
            )
          }
        />

        {lastLink && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <Check className="h-4 w-4 text-emerald-600" />

            <AlertTitle>{t("agencyTeams.invite.linkReady")}</AlertTitle>

            <AlertDescription className="flex flex-wrap gap-2 items-center">
              <code dir="ltr" className="max-w-full truncate">
                {lastLink}
              </code>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard?.writeText(lastLink)}
              >
                <Copy className="w-3.5 h-3.5 me-1" />

                {t("common.copy")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlatformStatCard
            icon={Users}
            label={t("agencyTeams.stats.total")}
            value={data.members.length}
            tone="violet"
            loading={query.isLoading}
          />

          <PlatformStatCard
            icon={ShieldCheck}
            label={t("agencyTeams.stats.active")}
            value={data.members.filter((x) => x.is_active).length}
            tone="emerald"
            loading={query.isLoading}
          />

          <PlatformStatCard
            icon={Building2}
            label={t("agencyTeams.stats.teams")}
            value={data.teams.filter((x) => x.is_active).length}
            tone="blue"
            loading={query.isLoading}
          />

          <PlatformStatCard
            icon={Clock3}
            label={t("agencyTeams.stats.pending")}
            value={pendingInvites.length}
            tone="amber"
            loading={query.isLoading}
          />
        </div>

        <Tabs defaultValue="members" dir={isRtl ? "rtl" : "ltr"} className="space-y-5">
          <TabsList className="h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-[22px] border border-white/80 bg-white/90 p-1.5 shadow-[0_12px_38px_rgba(54,74,138,0.08)]">
            <TabsTrigger value="members" className={tabClassName}>
              <Users className="h-4 w-4" />
              {t("agencyTeams.tabs.members")}
            </TabsTrigger>

            <TabsTrigger value="teams" className={tabClassName}>
              <Building2 className="h-4 w-4" />
              {t("agencyTeams.tabs.teams")}
            </TabsTrigger>

            <TabsTrigger value="invitations" className={tabClassName}>
              <Mail className="h-4 w-4" />
              {t("agencyTeams.tabs.invitations")}{" "}
              {pendingInvites.length > 0 && (
                <Badge className="ms-1 border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                  {pendingInvites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <PlatformCard className="flex flex-wrap gap-3 p-5">
              <div className="relative w-full min-w-0 sm:min-w-56 sm:flex-1">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <Input
                  aria-label={t("agencyTeams.search")}
                  className={`${platformFieldClassName} h-auto bg-slate-50/70 py-2.5 ps-10`}
                  placeholder={t("agencyTeams.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger
                  aria-label={t("agencyTeams.allRoles")}
                  className={`${platformFieldClassName} h-auto w-full py-2.5 sm:w-56`}
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">{t("agencyTeams.allRoles")}</SelectItem>

                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`agencyTeams.roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PlatformCard>

            <PlatformCard className="overflow-hidden">
              {query.isLoading ? (
                <div className="p-12 text-center text-slate-500" role="status">
                  {t("common.loading")}
                </div>
              ) : members.length === 0 ? (
                <PlatformEmptyState icon={Users} className="m-5">
                  {t("agencyTeams.emptyMembers")}
                </PlatformEmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-start text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="p-5 text-start">{t("agencyTeams.fields.fullName")}</th>
                        <th className="p-5 text-start">{t("agencyTeams.fields.role")}</th>
                        <th className="p-5 text-start">{t("agencyTeams.fields.team")}</th>
                        <th className="p-5 text-start">{t("agencyTeams.memberActions.status")}</th>
                        {canManageMembers && (
                          <th className="p-5 text-center">
                            {t("agencyTeams.memberActions.actions")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member) => (
                        <tr key={member.id} className="transition-colors hover:bg-violet-50/30">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 text-sm font-black text-violet-700">
                                {(member.full_name || member.email).slice(0, 2).toUpperCase()}
                              </div>

                              <div className="min-w-0 basis-40 flex-1">
                                <div className="break-words text-sm font-extrabold text-slate-800">
                                  {member.full_name}
                                </div>

                                <div
                                  className="mt-0.5 break-all text-xs font-medium text-slate-400"
                                  dir="ltr"
                                >
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <Badge
                              variant="outline"
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[member.role]}`}
                            >
                              {t(`agencyTeams.roles.${member.role}`)}
                            </Badge>
                          </td>
                          <td className="p-5">
                            <div className="min-w-28 text-sm text-slate-500">
                              {teamById[member.team_id]?.name || t("agencyTeams.noTeam")}
                            </div>
                          </td>
                          <td className="p-5">
                            <Badge
                              className={`rounded-lg ${member.is_active ? activeBadgeClassName : inactiveBadgeClassName}`}
                            >
                              {t(member.is_active ? "agencyTeams.active" : "agencyTeams.inactive")}
                            </Badge>
                          </td>
                          {canManageMembers && (
                            <td className="p-5 text-center">
                              {(["org_admin", "admin"].includes(user?.role) ||
                                String(member.id) !== String(user.id)) && (
                                <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={t("agencyTeams.memberActions.actionsFor", {
                                        name: member.full_name || member.email,
                                      })}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                                    >
                                      <MoreVertical className="h-5 w-5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-52 rounded-2xl border-slate-100 bg-white p-2 shadow-xl"
                                  >
                                    <DropdownMenuItem
                                      className="gap-3 rounded-xl p-3"
                                      onSelect={() => setEditingMember(member)}
                                    >
                                      <UserCog className="h-4 w-4 text-blue-500" />
                                      {t("common.edit")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-3 rounded-xl p-3"
                                      disabled={
                                        String(member.id) === String(user.id) ||
                                        updateMember.isPending
                                      }
                                      onSelect={() => toggleMember(member)}
                                    >
                                      <UserX className="h-4 w-4" />
                                      {t(
                                        member.is_active
                                          ? "agencyTeams.deactivate"
                                          : "agencyTeams.activate",
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="gap-3 rounded-xl p-3 text-red-600 focus:bg-red-50 focus:text-red-700"
                                      disabled={
                                        String(member.id) === String(user.id) ||
                                        removeMember.isPending
                                      }
                                      onSelect={() => setDeletingMember(member)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t("agencyTeams.memberActions.delete")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PlatformCard>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            {canManageTeams && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="shadow-[0_12px_28px_rgba(99,72,210,0.25)]"
                  onClick={() => setTeamOpen(true)}
                >
                  <Plus className="me-2 h-4 w-4" />

                  {t("agencyTeams.createTeam")}
                </Button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.teams.length === 0 ? (
                <PlatformCard className="col-span-full p-5">
                  <PlatformEmptyState icon={Building2}>
                    {t("agencyTeams.emptyTeams")}
                  </PlatformEmptyState>
                </PlatformCard>
              ) : (
                data.teams.map((team) => {
                  const manager = data.members.find((m) => m.id === team.manager_id)

                  const count = data.members.filter((m) => m.team_id === team.id).length

                  return (
                    <PlatformCard
                      key={team.id}
                      className="p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(77,70,170,0.13)]"
                    >
                      <div className="flex justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600">
                          <Users className="h-5 w-5" />
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={`rounded-lg ${team.is_active ? activeBadgeClassName : inactiveBadgeClassName}`}
                          >
                            {t(team.is_active ? "agencyTeams.active" : "agencyTeams.inactive")}
                          </Badge>

                          {canManageTeams && (
                            <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={t("agencyTeams.teamModal.actionsFor", {
                                    name: team.name,
                                  })}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-2xl border-slate-100 bg-white p-2 shadow-xl"
                              >
                                <DropdownMenuItem
                                  className="gap-3 rounded-xl p-3"
                                  onSelect={() => setEditingTeam(team)}
                                >
                                  <UserCog className="h-4 w-4 text-blue-500" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-3 rounded-xl p-3 text-red-600 focus:bg-red-50 focus:text-red-700"
                                  onSelect={() => setDeletingTeam(team)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t("agencyTeams.memberActions.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      <h3 className="mt-4 break-words text-lg font-black text-slate-900">
                        {team.name}
                      </h3>

                      <p className="mt-1 min-h-10 break-words text-sm text-slate-500">
                        {team.description || "—"}
                      </p>

                      <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                        <div>
                          {t("agencyTeams.teamManager")}:{" "}
                          <strong>{manager?.full_name || t("agencyTeams.unassigned")}</strong>
                        </div>

                        <div className="mt-1 text-slate-500">
                          {t("agencyTeams.memberCount", { count })}
                        </div>
                      </div>
                    </PlatformCard>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="invitations">
            <PlatformCard className="divide-y divide-slate-100 overflow-hidden">
              {data.invitations.length === 0 ? (
                <PlatformEmptyState icon={Mail} className="m-5">
                  {t("agencyTeams.emptyInvites")}
                </PlatformEmptyState>
              ) : (
                data.invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-violet-50/30"
                  >
                    <Mail className="h-5 w-5 text-slate-400" />

                    <div className="min-w-0 basis-40 flex-1">
                      <div className="break-words text-sm font-extrabold text-slate-800">
                        {inv.full_name}
                      </div>

                      <div
                        className="mt-0.5 break-all text-xs font-medium text-slate-400"
                        dir="ltr"
                      >
                        {inv.email}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[inv.role]}`}
                    >
                      {t(`agencyTeams.roles.${inv.role}`)}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 ${inv.status === "pending" ? "border-amber-100 bg-amber-50 text-amber-700" : inactiveBadgeClassName}`}
                    >
                      {t(`agencyTeams.inviteStatus.${inv.status}`)}
                    </Badge>

                    {canManageMembers && inv.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => resend.mutate(inv.id)}>
                          <RefreshCw className="me-1 h-3.5 w-3.5" />

                          {t("agencyTeams.resend")}
                        </Button>

                        <Button size="sm" variant="ghost" onClick={() => cancel.mutate(inv.id)}>
                          <XCircle className="me-1 h-3.5 w-3.5" />

                          {t("agencyTeams.cancelInvite")}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </PlatformCard>
          </TabsContent>
        </Tabs>

        <Dialog
          open={!!deletingMember}
          onOpenChange={(open) => !open && !removeMember.isPending && setDeletingMember(null)}
        >
          <DialogContent
            className={dialogClassName}
            dir={isRtl ? "rtl" : "ltr"}
            overlayClassName="bg-slate-950/40 backdrop-blur-sm"
          >
            <DialogHeader>
              <DialogTitle>{t("agencyTeams.memberActions.deleteTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-slate-500">
              {t("agencyTeams.memberActions.confirm", {
                name: deletingMember?.full_name || deletingMember?.email,
              })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={removeMember.isPending}
                onClick={() => setDeletingMember(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                disabled={removeMember.isPending}
                onClick={() => removeMember.mutate(deletingMember.id)}
              >
                {t(removeMember.isPending ? "common.loading" : "agencyTeams.memberActions.delete")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <InviteDialog
          open={inviteOpen}
          setOpen={setInviteOpen}
          teams={data.teams}
          onSubmit={submitInvite}
          pending={invite.isPending}
          t={t}
          isRtl={isRtl}
        />

        <TeamDialog
          open={teamOpen}
          setOpen={setTeamOpen}
          managers={data.members.filter((x) => x.role === "team_manager" && x.is_active)}
          onSubmit={submitTeam}
          pending={createTeam.isPending}
          t={t}
          isRtl={isRtl}
        />

        <MemberDialog
          key={editingMember?.id || "none"}
          member={editingMember}
          setMember={setEditingMember}
          teams={data.teams}
          onSubmit={saveMember}
          pending={updateMember.isPending}
          t={t}
          isRtl={isRtl}
        />
      </div>
    </PlatformPageShell>
  )
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  platformFieldClassName,
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
  PlatformStatCard,
} from "@/components/platform/PlatformUI"
import { Check, Copy, Plus, RefreshCw, Search, UserCog, UserX } from "lucide-react"
