import assert from "node:assert/strict"
import test from "node:test"
import { canAccessAgencyRecord, getAgencyScopeFilter } from "./access.js"

const teamManager = {
  id: 41,
  organization_id: 12,
  org_type: "staffing_agency",
  role: "team_manager",
  team_id: 4,
}

test("TM-2 client filters use canonical team_id, not team_manager_id", () => {
  assert.deepEqual(getAgencyScopeFilter(teamManager), {
    organization_id: 12,
    team_id: 4,
  })
})

test("TM-2 client access allows own-team records even if team_manager_id snapshot differs", () => {
  assert.equal(
    canAccessAgencyRecord(teamManager, {
      organization_id: 12,
      team_id: 4,
      team_manager_id: 99,
    }),
    true,
  )
  assert.equal(
    canAccessAgencyRecord(teamManager, {
      organization_id: 12,
      team_id: 5,
      team_manager_id: 41,
    }),
    false,
  )
})

test("TM-2 blocks Team Manager records when membership is missing", () => {
  const unassigned = { ...teamManager, team_id: null }

  assert.deepEqual(getAgencyScopeFilter(unassigned), { organization_id: 12, id: -1 })
  assert.equal(canAccessAgencyRecord(unassigned, { organization_id: 12, team_id: 4 }), false)
})
