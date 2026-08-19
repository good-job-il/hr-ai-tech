/**
 * Canonical Staffing Agency domain contracts.
 *
 * Keep this module free of UI and transport dependencies. Frontend screens,
 * fixtures and API adapters should import these values instead of defining
 * role, scope or Application status strings locally.
 */

export const AGENCY_ORG_TYPE = "staffing_agency"

export const AGENCY_ROLES = Object.freeze([
  "org_admin",
  "recruitment_manager",
  "team_manager",
  "recruiter",
])

export const AGENCY_DATA_SCOPES = Object.freeze({
  ORGANIZATION: "organization",
  TEAM: "team",
  OWN: "own",
})

export const AGENCY_ROLE_SCOPES = Object.freeze({
  org_admin: AGENCY_DATA_SCOPES.ORGANIZATION,
  recruitment_manager: AGENCY_DATA_SCOPES.ORGANIZATION,
  team_manager: AGENCY_DATA_SCOPES.TEAM,
  recruiter: AGENCY_DATA_SCOPES.OWN,
})

export const APPLICATION_STATUS_VALUES = Object.freeze([
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
])

export const APPLICATION_PIPELINE_STAGES = Object.freeze([
  { id: "new", color: "#64748B", slaHours: 24 },
  { id: "reviewed", color: "#F59E0B", slaHours: 48 },
  { id: "phone_interview", color: "#3B82F6", slaHours: 72 },
  { id: "recommended", color: "#8B5CF6", slaHours: 96 },
  { id: "employer_interview", color: "#EC4899", slaHours: 120 },
  { id: "offer", color: "#0EA5E9", slaHours: 72 },
  { id: "hired", color: "#10B981", slaHours: null },
  { id: "probation", color: "#14B8A6", slaHours: null },
  { id: "completed", color: "#059669", slaHours: null },
  { id: "rejected", color: "#EF4444", slaHours: null },
])

export const APPLICATION_TERMINAL_STATUSES = Object.freeze(["completed", "rejected"])

export const AGENCY_CLIENT_STATUS_VALUES = Object.freeze([
  "prospect",
  "active",
  "inactive",
  "archived",
])

export const ACTIVE_RECRUITMENT_APPLICATION_STATUSES = Object.freeze([
  "new",
  "reviewed",
  "phone_interview",
  "recommended",
  "employer_interview",
  "offer",
  "probation",
])

export const PLACEMENT_APPLICATION_STATUSES = Object.freeze(["hired", "completed"])

export function isActiveAgencyClient(client, organizationId) {
  return Boolean(
    client &&
    client.status === "active" &&
    String(client.organization_id) === String(organizationId),
  )
}

export function canArchiveAgencyClient({ openJobs = 0, activeApplications = 0 } = {}) {
  return Number(openJobs) === 0 && Number(activeApplications) === 0
}

/**
 * Read/migration compatibility only. New writes must use canonical values.
 */
export const LEGACY_APPLICATION_STATUS_MAP = Object.freeze({
  screening: "reviewed",
  professional_interview: "recommended",
  client_stage: "employer_interview",
  interview_scheduled: "employer_interview",
  offer_made: "offer",
})

export function isApplicationStatus(value) {
  return APPLICATION_STATUS_VALUES.includes(value)
}

export function normalizeApplicationStatus(value) {
  if (isApplicationStatus(value)) return value
  return LEGACY_APPLICATION_STATUS_MAP[value] || null
}

/**
 * Identifier semantics used across agency DTOs.
 * `*_id` relationship fields contain entity/user IDs, never email addresses.
 */
export const AGENCY_IDENTIFIER_CONTRACT = Object.freeze({
  uuid: Object.freeze([
    "id",
    "organization_id",
    "company_id",
    "agency_client_id",
    "job_id",
    "candidate_id",
    "employer_company_id",
    "recruiter_id",
    "assigned_to",
    "team_manager_id",
    "recruitment_manager_id",
    "created_by_user_id",
    "deleted_by",
  ]),
  email: Object.freeze(["email", "candidate_email", "contact_email", "recipient_email"]),
  displayOnly: Object.freeze([
    "full_name",
    "candidate_name",
    "company",
    "job_title",
    "display_role_name",
  ]),
})
