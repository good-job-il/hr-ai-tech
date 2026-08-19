export function agencyWorkspaceBase(pathname = "", role = "") {
  const path = String(pathname)

  if (path.startsWith("/agency/team")) {
    return "/agency/team"
  }

  if (path.startsWith("/agency/recruiter")) {
    return "/agency/recruiter"
  }

  const agencyContext = path.startsWith("/agency") || path === ""

  if (agencyContext && role === "team_manager") {
    return "/agency/team"
  }

  if (agencyContext && role === "recruiter") {
    return "/agency/recruiter"
  }

  if (agencyContext) {
    return "/agency"
  }

  return null
}

export function agencyWorkspacePaths(base = "/agency") {
  const root = base || "/agency"

  const crmRoot = `${root}/crm`

  return {
    base: root,
    dashboard: `${root}/dashboard`,
    jobs: `${root}/jobs`,
    jobsOpen: `${root}/jobs/open`,
    jobsFilled: `${root}/jobs/filled`,
    jobsHold: `${root}/jobs/hold`,
    crm: crmRoot,
    candidate: `${crmRoot}/candidate`,
    pipeline: `${root}/pipeline`,
    compensation: `${root}/compensation`,
    aiMatching: `${root}/ai-matching`,
    import: `${root}/import`,
    reports: `${root}/reports`,
    activity: `${root}/activity`,
    roster: `${root}/roster`,
  }
}

export function isTeamWorkspace(pathname = "", role = "") {
  return agencyWorkspaceBase(pathname, role) === "/agency/team"
}
