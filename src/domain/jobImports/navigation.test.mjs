import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const root = new URL("../../", import.meta.url)

test("job sources navigation is hidden until both feature and permission gate allow it", () => {
  const source = readFileSync(new URL("config/navigation/agencyNav.js", root), "utf8")
  assert.match(source, /requiresJobImports: true/)
  assert.match(source, /jobImportsVisible/)

  const layout = readFileSync(
    new URL("components\/layouts\/StaffingAgencyLayout.jsx", root),
    "utf8",
  )
  assert.match(layout, /JOB_IMPORT_FEATURE_FLAGS\.ENABLED/)
  assert.match(layout, /canResource\("job_imports", "view"\)/)
})

test("agency and platform routes use the canonical job-import information architecture", () => {
  const app = readFileSync(new URL("App.jsx", root), "utf8")
  for (const route of [
    "/agency/import/jobs",
    "/agency/import/jobs/new",
    "/agency/import/jobs/:sourceId",
    "/agency/import/jobs/runs/:runId",
    "/platform/operations/job-imports",
  ]) {
    assert.ok(app.includes(route), `missing ${route}`)
  }

  assert.doesNotMatch(
    app,
    /pages\/(admin\/ImportJobs|employer\/ImportSources|admin\/ImportMonitoring)/,
  )
})
