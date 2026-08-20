import assert from "node:assert/strict"
import test from "node:test"
import {
  RECRUITER_WORKSPACE_ROUTES,
  RECRUITER_IMPORT_POLICY,
  canRecruiterTransition,
  canOpenRecruiterRoute,
  recruiterCandidateRouteFilter,
  recruiterDeepLinks,
  recruiterDirection,
  recruiterLayoutMode,
  recruiterViewState,
} from "./recruiterWorkspace.js"

test("R-2 keeps daily recruiter routes inside the personal namespace", () => {
  assert.equal(
    RECRUITER_WORKSPACE_ROUTES.every((route) => route.startsWith("/agency/recruiter/")),
    true,
  )
})

test("R-2 route modes produce stable server filters", () => {
  assert.deepEqual(recruiterCandidateRouteFilter("/agency/recruiter/candidates/all"), {})
  assert.deepEqual(recruiterCandidateRouteFilter("/agency/recruiter/candidates/active"), {
    active: true,
  })
  assert.deepEqual(recruiterCandidateRouteFilter("/agency/recruiter/candidates/pipeline"), {
    in_pipeline: true,
  })
})

test("R-2 deep links survive refresh and stay role-aware", () => {
  assert.deepEqual(recruiterDeepLinks({ candidateId: 2, applicationId: 3, jobId: 4 }), {
    candidate: "/agency/recruiter/crm/candidate?id=2",
    application: "/agency/recruiter/pipeline?applicationId=3",
    job: "/agency/recruiter/jobs?jobId=4",
  })
})

test("R-2 UI transition policy mirrors the R-1 backend ceiling", () => {
  assert.equal(canRecruiterTransition("reviewed", "phone_interview"), true)
  assert.equal(canRecruiterTransition("new", "hired"), false)
  assert.equal(canRecruiterTransition("rejected", "reviewed"), false)
})

test("R-3 explicitly excludes direct Recruiter import-to-own", () => {
  assert.equal(RECRUITER_IMPORT_POLICY.enabled, false)
  assert.equal(RECRUITER_WORKSPACE_ROUTES.includes("/agency/recruiter/import"), false)
})

test("R-4 blocks non-Recruiter cabinets and public routes", () => {
  assert.equal(canOpenRecruiterRoute("/agency/recruiter/dashboard"), true)
  assert.equal(canOpenRecruiterRoute("/agency/recruiter/crm/candidate?id=20"), true)
  assert.equal(canOpenRecruiterRoute("/agency/team/dashboard"), false)
  assert.equal(canOpenRecruiterRoute("/agency/settings/permissions"), false)
  assert.equal(canOpenRecruiterRoute("/company/jobs"), false)
  assert.equal(canOpenRecruiterRoute("/jobs"), false)
})

test("R-4 distinguishes permission, error, loading, empty and ready states", () => {
  assert.equal(recruiterViewState({ loading: true }), "loading")
  assert.equal(recruiterViewState({ permissionDenied: true }), "permission_denied")
  assert.equal(recruiterViewState({ error: new Error("network") }), "error")
  assert.equal(recruiterViewState({ itemCount: 0 }), "empty")
  assert.equal(recruiterViewState({ itemCount: 2 }), "ready")
})

test("R-4 locale direction and mobile breakpoint are deterministic", () => {
  assert.equal(recruiterDirection("he"), "rtl")
  assert.equal(recruiterDirection("he-IL"), "rtl")
  assert.equal(recruiterDirection("en"), "ltr")
  assert.equal(recruiterDirection("en-US"), "ltr")
  assert.equal(recruiterLayoutMode(390), "mobile")
  assert.equal(recruiterLayoutMode(767), "mobile")
  assert.equal(recruiterLayoutMode(768), "desktop")
  assert.equal(recruiterLayoutMode(1440), "desktop")
})
