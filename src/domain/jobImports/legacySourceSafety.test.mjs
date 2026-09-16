import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const readSource = (relativePath) =>
  readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8")

const appSource = readSource("App.jsx")

const adminLegacySource = readSource("pages/admin/ImportJobs.jsx")

const employerLegacySource = readSource("pages/employer/ImportSources.jsx")

test("orphaned legacy source pages are not routed in production", () => {
  for (const componentName of ["ImportJobs", "ImportSources", "ImportMonitoring"]) {
    assert.equal(appSource.includes(componentName), false)
  }
})

test("legacy source execution controls are guarded and visibly disabled", () => {
  for (const source of [adminLegacySource, employerLegacySource]) {
    assert.match(source, /const LEGACY_SOURCE_EXECUTION_DISABLED = true/)
    assert.match(source, /disabled=\{LEGACY_SOURCE_EXECUTION_DISABLED \|\|/)
    assert.match(source, /preview\/sync\s+מושבתות/)
  }
})

test("legacy UI does not promise unsupported preview or provider capabilities", () => {
  const combined = `${adminLegacySource}\n${employerLegacySource}`

  for (const misleadingCopy of [
    "בלי להוסיף מקור",
    "ללא שמירה",
    "עוברת בין עמודים",
    "מגלה את כל המשרות",
  ]) {
    assert.equal(combined.includes(misleadingCopy), false, misleadingCopy)
  }

  for (const unsupportedProvider of ["paginated", "load_more", "org_system", "custom"]) {
    assert.equal(adminLegacySource.includes(`value: "${unsupportedProvider}"`), false)
  }
})
