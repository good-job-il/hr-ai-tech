import assert from "node:assert/strict"
import test from "node:test"
import { directionForLanguage, REASSIGN_INVALIDATION_KEYS } from "./rmAcceptance.js"

test("RM-4 language direction supports locale variants", () => {
  assert.equal(directionForLanguage("en"), "ltr")
  assert.equal(directionForLanguage("en-US"), "ltr")
  assert.equal(directionForLanguage("he"), "rtl")
  assert.equal(directionForLanguage("he-IL"), "rtl")
})

test("RM-4 reassignment invalidates every affected management surface", () => {
  ;[
    "recruitment-manager-dashboard",
    "management-report",
    "audit-logs",
    "agency-jobs",
    "agency-candidates",
    "agency-applications",
    "agency-clients",
    "client-applications",
  ].forEach((key) => assert.ok(REASSIGN_INVALIDATION_KEYS.includes(key), `missing ${key}`))
})
