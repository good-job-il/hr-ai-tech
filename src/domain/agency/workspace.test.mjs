import assert from "node:assert/strict"
import test from "node:test"
import { agencyWorkspaceBase, agencyWorkspacePaths, isTeamWorkspace } from "./workspace.js"

test("TM-2 keeps Team Manager inside /agency/team after deep links", () => {
  assert.equal(agencyWorkspaceBase("/agency/team/crm/candidate", "team_manager"), "/agency/team")
  assert.equal(agencyWorkspaceBase("/agency/jobs", "team_manager"), "/agency/team")
  assert.equal(isTeamWorkspace("/agency/team/pipeline", "org_admin"), true)
  assert.equal(isTeamWorkspace("/agency/dashboard", "recruitment_manager"), false)
})

test("TM-2 does not pull company or employer routes into the agency cabinet", () => {
  assert.equal(agencyWorkspaceBase("/company/crm", "recruiter"), null)
  assert.equal(agencyWorkspaceBase("/employer/pipeline", "team_manager"), null)
})

test("TM-2 workspace paths stay in the team namespace", () => {
  const paths = agencyWorkspacePaths("/agency/team")

  assert.equal(paths.dashboard, "/agency/team/dashboard")
  assert.equal(paths.jobs, "/agency/team/jobs")
  assert.equal(paths.jobsOpen, "/agency/team/jobs/open")
  assert.equal(paths.candidate, "/agency/team/crm/candidate")
  assert.equal(paths.pipeline, "/agency/team/pipeline")
  assert.equal(paths.compensation, "/agency/team/compensation")
  assert.equal(paths.aiMatching, "/agency/team/ai-matching")
  assert.equal(paths.import, "/agency/team/import")
  assert.equal(paths.reports, "/agency/team/reports")
  assert.equal(paths.activity, "/agency/team/activity")
  assert.equal(paths.roster, "/agency/team/roster")
})

test("TM-2 treats /agency/team as the team cabinet root", () => {
  assert.equal(agencyWorkspaceBase("/agency/team", "team_manager"), "/agency/team")
  assert.equal(agencyWorkspacePaths("/agency/team").dashboard, "/agency/team/dashboard")
})
