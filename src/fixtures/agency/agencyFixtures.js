import { AGENCY_ORG_TYPE, APPLICATION_STATUS_VALUES } from "../../domain/agency/contracts.js"

/**
 * Deterministic fixtures for agency access and integration tests.
 * They are intentionally not imported by production routes.
 */

export const AGENCY_FIXTURE_IDS = Object.freeze({
  organization: "10000000-0000-4000-8000-000000000001",
  otherOrganization: "20000000-0000-4000-8000-000000000001",
  recruitmentManager: "10000000-0000-4000-8000-000000000011",
  teamManager: "10000000-0000-4000-8000-000000000012",
  recruiter: "10000000-0000-4000-8000-000000000013",
  otherRecruiter: "10000000-0000-4000-8000-000000000014",
  orgAdmin: "10000000-0000-4000-8000-000000000010",
})

const commonUser = {
  organization_id: AGENCY_FIXTURE_IDS.organization,
  org_type: AGENCY_ORG_TYPE,
}

export const agencyRoleFixtures = Object.freeze({
  orgAdmin: Object.freeze({
    ...commonUser,
    id: AGENCY_FIXTURE_IDS.orgAdmin,
    email: "org-admin@agency.fixture.test",
    full_name: "Agency Org Admin",
    role: "org_admin",
  }),
  recruitmentManager: Object.freeze({
    ...commonUser,
    id: AGENCY_FIXTURE_IDS.recruitmentManager,
    email: "recruitment-manager@agency.fixture.test",
    full_name: "Recruitment Manager",
    role: "recruitment_manager",
  }),
  teamManager: Object.freeze({
    ...commonUser,
    id: AGENCY_FIXTURE_IDS.teamManager,
    email: "team-manager@agency.fixture.test",
    full_name: "Team Manager",
    role: "team_manager",
    recruitment_manager_id: AGENCY_FIXTURE_IDS.recruitmentManager,
  }),
  recruiter: Object.freeze({
    ...commonUser,
    id: AGENCY_FIXTURE_IDS.recruiter,
    email: "recruiter@agency.fixture.test",
    full_name: "Agency Recruiter",
    role: "recruiter",
    recruitment_manager_id: AGENCY_FIXTURE_IDS.recruitmentManager,
    team_manager_id: AGENCY_FIXTURE_IDS.teamManager,
  }),
})

export const agencyApplicationStatusFixtures = Object.freeze(
  APPLICATION_STATUS_VALUES.map((status, index) =>
    Object.freeze({
      id: `10000000-0000-4000-9000-${String(index + 1).padStart(12, "0")}`,
      organization_id: AGENCY_FIXTURE_IDS.organization,
      job_id: "10000000-0000-4000-8000-000000000030",
      candidate_id: `10000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
      recruiter_id: AGENCY_FIXTURE_IDS.recruiter,
      assigned_to: AGENCY_FIXTURE_IDS.recruiter,
      team_manager_id: AGENCY_FIXTURE_IDS.teamManager,
      recruitment_manager_id: AGENCY_FIXTURE_IDS.recruitmentManager,
      candidate_name: `Fixture Candidate ${index + 1}`,
      candidate_email: `candidate-${index + 1}@agency.fixture.test`,
      status,
    }),
  ),
)
