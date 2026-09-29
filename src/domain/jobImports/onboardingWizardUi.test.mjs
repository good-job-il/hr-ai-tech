import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")
const page = read("pages/jobImports/JobImportNewPage.jsx")
const service = read("api/services/importSourceService.ts")
const en = JSON.parse(read("locales/en/translation.json"))
const he = JSON.parse(read("locales/he/translation.json"))

test("wizard persists recoverable progress on the backend without localStorage", () => {
  assert.match(service, /createOnboardingDraft/)
  assert.match(page, /onboarding_step: nextStep/)
  assert.match(page, /preview_run_id/)
  assert.match(page, /sourceId: String\(draft\.id\)/)
  assert.doesNotMatch(page, /localStorage|sessionStorage/)
})

test("wizard exposes keyboard controls, raw comparison and recoverable cancel", () => {
  assert.match(page, /aria-current=\{current \? "step"/)
  assert.match(page, /autoFocus/)
  assert.match(page, /source_payload/)
  assert.match(page, /archiveDraft/)
  assert.match(page, /keepDraft/)
})

test("wizard translations are complete in English and Hebrew", () => {
  for (const translation of [en, he]) {
    assert.equal(Object.keys(translation.jobImports.wizard.steps).length, 7)
    assert.ok(translation.jobImports.wizard.errorActions.credentials)
    assert.ok(translation.jobImports.wizard.previewStates.partial)
    assert.ok(translation.jobImports.wizard.confirmation.apply)
  }
  assert.match(page, /i18n\.dir\(\) === "rtl"/)
})
