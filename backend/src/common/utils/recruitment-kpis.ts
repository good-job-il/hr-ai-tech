export const APPLICATION_PIPELINE_STATUSES = [
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "offer",
  "hired",
  "probation",
  "completed",
  "rejected",
] as const

export const ACTIVE_APPLICATION_STATUSES = new Set<string>([
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "offer",
  "probation",
])

// A placement is counted once it is hired and remains a placement after completion.
// Probation is still an active pipeline stage and must not inflate placement totals.
export const PLACEMENT_APPLICATION_STATUSES = new Set<string>(["hired", "completed"])

export const APPLICATION_SLA_HOURS: Record<string, number> = {
  new: 24,
  reviewed: 48,
  phone_interview: 72,
  recommended: 96,
  employer_interview: 120,
  offer: 72,
}

export const APPLICATION_OVERLOAD = 20

export const JOB_OVERLOAD = 5
