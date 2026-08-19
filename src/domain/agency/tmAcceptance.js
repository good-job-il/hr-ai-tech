import { agencyWorkspaceBase, agencyWorkspacePaths } from "./workspace.js"
import { canAccessAgencyRecord, filterAgencyRecordsByScope } from "./access.js"

export const TEAM_CABINET_ROUTES = Object.freeze([
  "/agency/team/dashboard",
  "/agency/team/roster",
  "/agency/team/jobs",
  "/agency/team/crm",
  "/agency/team/pipeline",
  "/agency/team/compensation",
  "/agency/team/ai-matching",
  "/agency/team/import",
  "/agency/team/reports",
  "/agency/team/activity",
])

export const ORGANIZATION_ONLY_ROUTES = Object.freeze([
  "/agency/dashboard",
  "/agency/clients",
  "/agency/teams",
  "/agency/settings/permissions",
  "/agency/settings/roles",
  "/agency/settings/billing",
  "/agency/settings/integrations",
])

export function canOpenOrganizationRoute(role, pathname) {
  if (role !== "team_manager") {
    return true
  }

  return !ORGANIZATION_ONLY_ROUTES.some(
    (route) => pathname === route || String(pathname).startsWith(`${route}/`),
  )
}

export function teamImportHirePaths(pathname = "/agency/team/import", role = "team_manager") {
  const paths = agencyWorkspacePaths(agencyWorkspaceBase(pathname, role) || "/agency/team")

  return {
    import: paths.import,
    candidate: `${paths.candidate}?id=`,
    pipeline: `${paths.pipeline}?applicationId=`,
    reports: paths.reports,
    activity: paths.activity,
  }
}

export function isolateTeamRecords(user, records) {
  return filterAgencyRecordsByScope(user, records)
}

export function otherTeamRecordBlocked(user, record) {
  return canAccessAgencyRecord(user, record) === false
}
