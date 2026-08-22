import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Briefcase, Kanban, Mail, ShieldCheck, Users } from "lucide-react"
import { agencyTeamsService } from "@/api/services/agencyTeamsService"
import { recruitmentManagementService } from "@/api/services/recruitmentManagementService"
import {
  PlatformCard,
  PlatformEmptyState,
  PlatformPageHeader,
  PlatformPageShell,
} from "@/components/platform/PlatformUI"
import { Button } from "@/components/ui/button"
import { useAgencyWorkspace } from "@/hooks/useAgencyWorkspace"

export default function TeamRosterPage() {
  const { i18n } = useTranslation()

  const { paths } = useAgencyWorkspace()

  const isRtl = !i18n.language?.startsWith("en")

  const text = isRtl
    ? {
        title: "חברי הצוות",
        subtitle: "רשימה לקריאה בלבד של מנהל הצוות והמגייסים הפעילים",
        empty: "אין חברים בצוות",
        error: "לא ניתן לטעון את חברי הצוות",
        retry: "נסה שוב",
        active: "פעיל",
        inactive: "לא פעיל",
        dashboard: "לוח הצוות",
        apps: "מועמדויות",
        jobs: "משרות",
      }
    : {
        title: "Team roster",
        subtitle: "Read-only roster of the Team Manager and team recruiters",
        empty: "No team members",
        error: "Unable to load the team roster",
        retry: "Try again",
        active: "Active",
        inactive: "Inactive",
        dashboard: "Team dashboard",
        apps: "applications",
        jobs: "jobs",
      }

  const roster = useQuery({
    queryKey: ["agency-teams"],
    queryFn: agencyTeamsService.overview,
  })

  const workloadQuery = useQuery({
    queryKey: ["team-manager-dashboard", {}],
    queryFn: () => recruitmentManagementService.dashboard({}),
  })

  const team = roster.data?.teams?.[0]

  const members = roster.data?.members || []

  const workloadByRecruiter = Object.fromEntries(
    (workloadQuery.data?.workload || []).map((item) => [item.recruiter_id, item]),
  )

  return (
    <PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
      <div className="space-y-6">
        <PlatformPageHeader
          title={text.title}
          subtitle={team ? `${team.name} · ${text.subtitle}` : text.subtitle}
          icon={Users}
          actions={
            <Link to={paths.dashboard}>
              <Button variant="outline" type="button">
                {text.dashboard}
              </Button>
            </Link>
          }
        />

        {roster.isError ? (
          <PlatformCard className="p-6">
            <PlatformEmptyState icon={Users}>
              <p>{text.error}</p>

              <Button className="mt-4" variant="outline" onClick={() => roster.refetch()}>
                {text.retry}
              </Button>
            </PlatformEmptyState>
          </PlatformCard>
        ) : (
          <PlatformCard className="overflow-hidden">
            {roster.isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : members.length ? (
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const workload = workloadByRecruiter[member.id]

                  return (
                    <div key={member.id} className="flex flex-wrap items-center gap-4 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        {member.role === "team_manager" ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-800">
                          {member.full_name || member.email}
                        </p>

                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />

                          {member.email}
                        </p>
                      </div>

                      {workload ? (
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Kanban className="h-3.5 w-3.5" />
                            {workload.active_applications} {text.apps}
                          </span>

                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {workload.open_jobs} {text.jobs}
                          </span>
                        </div>
                      ) : null}

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {member.role.replaceAll("_", " ")}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          member.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.is_active ? text.active : text.inactive}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <PlatformEmptyState icon={Users} className="m-6">
                {text.empty}
              </PlatformEmptyState>
            )}
          </PlatformCard>
        )}
      </div>
    </PlatformPageShell>
  )
}
