import assert from "node:assert/strict"
import test from "node:test"
import {
  effectiveRoleKey,
  canConfigureJobImportAction,
  normalizeMatrixPermissions,
  resolvePermissionRecord,
  jobImportAccessState,
} from "./permissions.js"

test("impersonation uses the tenant org-admin permission identity", () => {
  assert.equal(effectiveRoleKey({ role: "admin", impersonating: true }), "org_admin")
  assert.equal(effectiveRoleKey({ role: "admin", impersonating: false }), "admin")
  assert.equal(effectiveRoleKey({ role: "recruiter" }), "recruiter")
})

test("matrix selects the latest tenant override or correct org-type template", () => {
  const records = [
    {
      id: 1,
      role_key: "org_admin",
      organization_id: null,
      is_template: true,
      org_type: "organization",
    },
    {
      id: 2,
      role_key: "org_admin",
      organization_id: null,
      is_template: true,
      org_type: "staffing_agency",
    },
    { id: 3, role_key: "org_admin", organization_id: 7, is_template: false },
    { id: 4, role_key: "org_admin", organization_id: 8, is_template: false },
    { id: 5, role_key: "org_admin", organization_id: 7, is_template: false },
  ]

  assert.equal(resolvePermissionRecord(records, 7, "staffing_agency", "org_admin").id, 5)
  assert.equal(resolvePermissionRecord(records, null, "staffing_agency", "org_admin").id, 2)
  assert.equal(resolvePermissionRecord(records, 9, "organization", "org_admin").id, 1)
})

test("editing resource permissions preserves unrelated permissions and shows role ceilings", () => {
  const normalized = normalizeMatrixPermissions({
    manage_users: true,
    resources: { job_imports: { view: true } },
  })

  assert.equal(normalized.manage_users, true)
  assert.equal(normalized.resources.job_imports.view, true)
  assert.equal(normalized.resources.job_imports.create, false)
  assert.equal(canConfigureJobImportAction("recruitment_manager", "run"), true)
  assert.equal(canConfigureJobImportAction("recruitment_manager", "manage_credentials"), false)
  assert.equal(canConfigureJobImportAction("recruiter", "view"), false)
})

test("access distinguishes context, feature disabled and permission denied", () => {
  const context = {
    user: { role: "admin", impersonating: true },
    loading: false,
    enabled: true,
    canView: true,
  }

  assert.equal(jobImportAccessState(context), "allowed")
  assert.equal(jobImportAccessState({ ...context, canView: false }), "denied")
  assert.equal(jobImportAccessState({ ...context, enabled: false }), "disabled")
  assert.equal(
    jobImportAccessState({ ...context, user: { role: "admin" } }),
    "organizationRequired",
  )
  assert.equal(jobImportAccessState({ ...context, loading: true }), "loading")
})
