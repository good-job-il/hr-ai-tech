import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const dashboard = readFileSync(
  new URL("../../pages/jobImports/JobImportSourcesPage.jsx", import.meta.url),
  "utf8",
)

const detail = readFileSync(
  new URL("../../pages/jobImports/JobImportSourceDetailPage.jsx", import.meta.url),
  "utf8",
)

const api = readFileSync(
  new URL("../../api/services/importSourceService.ts", import.meta.url),
  "utf8",
)

const en = JSON.parse(
  readFileSync(new URL("../../locales/en/translation.json", import.meta.url), "utf8"),
)

const he = JSON.parse(
  readFileSync(new URL("../../locales/he/translation.json", import.meta.url), "utf8"),
)

test("dashboard uses server pagination, search and operational health projection", () => {
  assert.match(api, /\/import-sources\/dashboard/)
  assert.match(dashboard, /operational_status/)
  assert.match(dashboard, /setDebouncedSearch/)
  assert.match(dashboard, /pagination\.hasNextPage/)
  assert.match(dashboard, /latest_run/)
  assert.match(dashboard, /sourceFreshness/)
})

test("source operations remain permission-aware and archive is recoverable", () => {
  for (const action of ["run", "update", "review", "archive"]) {
    assert.match(dashboard, new RegExp(`canResource\\(\"job_imports\", \"${action}\"\\)`))
  }

  assert.match(dashboard, /AlertDialog/)
  assert.match(dashboard, /keepJobs/)
  assert.match(detail, /reconnectCredentials/)
  assert.match(detail, /replayRun/)
  assert.match(detail, /togglePause/)
})

test("source detail exposes configuration, timeline, changes, assignments and audit", () => {
  for (const marker of [
    "configurationDescription",
    "healthTimeline",
    "latestChanges",
    "assignments",
    "auditActions",
  ]) {
    assert.match(detail, new RegExp(marker))
  }
})

test("operational UI strings exist in English and Hebrew", () => {
  for (const locale of [en, he]) {
    assert.equal(typeof locale.jobImports.sources.health.auth_required, "string")
    assert.equal(typeof locale.jobImports.sources.actions.preview, "string")
    assert.equal(typeof locale.jobImports.detail.healthTimeline, "string")
    assert.equal(typeof locale.jobImports.detail.archive.keepJobs, "string")
  }
})
