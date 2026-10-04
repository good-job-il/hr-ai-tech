import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8")

test("operations has matching EN/HE translations for all alerts and product events", () => {
  const en = JSON.parse(read("../../locales/en/translation.json")).jobImports.operations

  const he = JSON.parse(read("../../locales/he/translation.json")).jobImports.operations

  const keys = (value, prefix = "") =>
    Object.entries(value).flatMap(([key, child]) =>
      typeof child === "object" ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
    )

  assert.deepEqual(keys(en).sort(), keys(he).sort())
  assert.equal(Object.keys(en.codes).length, 7)
  assert.equal(Object.keys(en.events).length, 13)
})
test("operations UI uses dedicated metadata APIs with bounded alert pages and refresh", () => {
  const service = read("../../api/services/importSourceService.ts")

  const ui = read("../../pages/platform/JobImportOperationsSummary.jsx")

  for (const path of ["metrics", "alerts", "analytics"]) {
    assert.ok(service.includes(`/platform-support/job-imports/${path}`))
  }

  assert.match(ui, /refetchInterval: 60_000/)
  assert.match(ui, /monitor\.stale/)
  assert.match(ui, /pagination\.total/)
  assert.match(ui, /disabled=\{page === 1\}/)
  assert.ok(!ui.includes("source_payload"))
  assert.ok(!ui.includes("credential_reference"))
})
