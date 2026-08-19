import assert from "node:assert/strict"
import test from "node:test"
import { agencyWorkspaceBase } from "./workspace.js"
import {
  ORGANIZATION_ONLY_ROUTES,
  TEAM_CABINET_ROUTES,
  canOpenOrganizationRoute,
  isolateTeamRecords,
  otherTeamRecordBlocked,
  teamImportHirePaths,
} from "./tmAcceptance.js"

const alpha = {
  id: 41,
  organization_id: 12,
  org_type: "staffing_agency",
  role: "team_manager",
  team_id: 4,
}

const beta = {
  ...alpha,
  id: 42,
  team_id: 5,
}

const records = [
  { id: 1, organization_id: 12, team_id: 4, team_manager_id: 99 },
  { id: 2, organization_id: 12, team_id: 5, team_manager_id: 41 },
  { id: 3, organization_id: 99, team_id: 4, team_manager_id: 41 },
]

test("TM-4 keeps two managers of one tenant inside separate team cabinets", () => {
  assert.equal(agencyWorkspaceBase("/agency/jobs", "team_manager"), "/agency/team")
  assert.equal(agencyWorkspaceBase("/agency/team/reports", "team_manager"), "/agency/team")
  TEAM_CABINET_ROUTES.forEach((route) => {
    assert.equal(agencyWorkspaceBase(route, "team_manager"), "/agency/team")
    assert.ok(route.startsWith("/agency/team"))
  })
})

test("TM-4 blocks organization-only URLs for Team Manager", () => {
  ORGANIZATION_ONLY_ROUTES.forEach((route) => {
    assert.equal(canOpenOrganizationRoute("team_manager", route), false)
    assert.equal(canOpenOrganizationRoute("recruitment_manager", route), true)
  })
  assert.equal(canOpenOrganizationRoute("team_manager", "/agency/team/dashboard"), true)
  assert.equal(canOpenOrganizationRoute("team_manager", "/agency/clients/9"), false)
})

test("TM-4 import → pipeline deep links stay in the team namespace", () => {
  const paths = teamImportHirePaths("/agency/team/import", "team_manager")

  assert.equal(paths.import, "/agency/team/import")
  assert.equal(paths.candidate, "/agency/team/crm/candidate?id=")
  assert.equal(paths.pipeline, "/agency/team/pipeline?applicationId=")
  assert.equal(paths.reports, "/agency/team/reports")
  assert.equal(paths.activity, "/agency/team/activity")
})

test("TM-4 client filters isolate two teams of the same tenant", () => {
  assert.deepEqual(
    isolateTeamRecords(alpha, records).map((row) => row.id),
    [1],
  )
  assert.deepEqual(
    isolateTeamRecords(beta, records).map((row) => row.id),
    [2],
  )
  assert.equal(otherTeamRecordBlocked(alpha, records[1]), true)
  assert.equal(otherTeamRecordBlocked(alpha, records[0]), false)
})
