export const RECRUITER_WORKSPACE_ROUTES = Object.freeze([
  "/agency/recruiter/dashboard",
  "/agency/recruiter/candidates/all",
  "/agency/recruiter/candidates/active",
  "/agency/recruiter/candidates/pipeline",
  "/agency/recruiter/jobs",
  "/agency/recruiter/crm",
  "/agency/recruiter/crm/candidate",
  "/agency/recruiter/pipeline",
  "/agency/recruiter/interviews",
  "/agency/recruiter/ai-matching",
  "/agency/recruiter/compensation",
  "/agency/recruiter/activity",
])

export const RECRUITER_IMPORT_POLICY = Object.freeze({
  enabled: false,
  reason:
    "Recruiter import is excluded; managers import and assign or Recruiter claims pool records.",
})

export const RECRUITER_PIPELINE_TRANSITIONS = Object.freeze({
  new: ["reviewed", "rejected"],
  reviewed: ["phone_interview", "recommended", "rejected"],
  phone_interview: ["recommended", "rejected"],
  recommended: ["employer_interview", "rejected"],
  employer_interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: ["probation"],
  probation: ["completed", "rejected"],
})

export function recruiterCandidateRouteFilter(pathname = "") {
  if (pathname.endsWith("/active")) {
    return { active: true }
  }

  if (pathname.endsWith("/pipeline")) {
    return { in_pipeline: true }
  }

  return {}
}

export function canRecruiterTransition(previous, next) {
  return previous === next || Boolean(RECRUITER_PIPELINE_TRANSITIONS[previous]?.includes(next))
}

export function recruiterDeepLinks({ candidateId, applicationId, jobId } = {}) {
  return {
    candidate: candidateId ? `/agency/recruiter/crm/candidate?id=${candidateId}` : null,
    application: applicationId ? `/agency/recruiter/pipeline?applicationId=${applicationId}` : null,
    job: jobId ? `/agency/recruiter/jobs?jobId=${jobId}` : null,
  }
}

export function canOpenRecruiterRoute(pathname = "") {
  const path = String(pathname).split("?")[0]

  return RECRUITER_WORKSPACE_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

export function recruiterViewState({ loading, permissionDenied, error, itemCount = 0 } = {}) {
  if (loading) {
    return "loading"
  }

  if (permissionDenied) {
    return "permission_denied"
  }

  if (error) {
    return "error"
  }

  if (itemCount === 0) {
    return "empty"
  }

  return "ready"
}

export function recruiterDirection(language = "he") {
  return String(language).toLowerCase().startsWith("he") ? "rtl" : "ltr"
}

export function recruiterLayoutMode(width = 0) {
  return Number(width) < 768 ? "mobile" : "desktop"
}
