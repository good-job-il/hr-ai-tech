import assert from "node:assert/strict"
import test from "node:test"
import {
  importErrorAction,
  isValidImportUrl,
  previewReadiness,
  sourceNameFromUrl,
  summarizeImportRun,
} from "./onboardingWizard.js"

test("source URL accepts only absolute HTTP(S) URLs", () => {
  assert.equal(isValidImportUrl("https://jobs.example.com/feed.json"), true)
  assert.equal(isValidImportUrl("javascript:alert(1)"), false)
  assert.equal(isValidImportUrl("jobs.example.com"), false)
  assert.equal(sourceNameFromUrl("https://www.jobs.example.com/feed"), "jobs.example.com")
})

test("partial, empty and review previews cannot reach apply", () => {
  assert.deepEqual(previewReadiness({ status: "partial", items_fetched: 3 }), {
    ready: false,
    reason: "partial",
  })
  assert.equal(previewReadiness({ status: "completed", items_fetched: 0 }).reason, "empty")
  assert.equal(
    previewReadiness({ status: "completed", items_fetched: 3, review_count: 1 }).reason,
    "review",
  )
  assert.equal(
    previewReadiness({
      status: "completed",
      snapshot_completeness: "full",
      items_fetched: 3,
      error_count: 0,
      review_count: 0,
    }).ready,
    true,
  )
})

test("destructive changes and typed errors produce explicit UX decisions", () => {
  assert.deepEqual(summarizeImportRun({ items_fetched: 10, close_count: 3, review_count: 1 }), {
    total: 10,
    destructive: 3,
    reviewRequired: 1,
  })
  assert.equal(importErrorAction("AUTH_REQUIRED"), "credentials")
  assert.equal(importErrorAction("CLIENT_UNAVAILABLE"), "chooseClient")
  assert.equal(importErrorAction("UNSUPPORTED_FORMAT"), "changeConnector")
  assert.equal(importErrorAction("ROBOTS_DENIED"), "chooseAnotherSource")
  assert.equal(importErrorAction("PARTIAL_SNAPSHOT"), "retryPreview")
})
