import assert from "node:assert/strict"
import test from "node:test"
import {
  latestRunChanges,
  meaningfulSourceAttention,
  sourceFreshness,
  trendLabel,
} from "./sourceOperations.js"

test("source freshness respects schedule and inactive lifecycle", () => {
  const now = Date.parse("2026-09-29T12:00:00Z")
  assert.equal(sourceFreshness({ state: "paused" }, now), "paused")
  assert.equal(sourceFreshness({ state: "draft", interval_hours: 24 }, now), "not_started")
  assert.equal(sourceFreshness({ state: "active", interval_hours: 0 }, now), "manual")
  assert.equal(
    sourceFreshness(
      { state: "active", interval_hours: 6, last_success_at: "2026-09-29T10:00:00Z" },
      now,
    ),
    "fresh",
  )
  assert.equal(
    sourceFreshness(
      { state: "active", interval_hours: 6, last_success_at: "2026-09-28T12:00:00Z" },
      now,
    ),
    "stale",
  )
})

test("run counts and trends are operationally explainable", () => {
  assert.equal(
    latestRunChanges({ create_count: 2, update_count: 3, close_count: 1, reopen_count: 1 }),
    7,
  )
  assert.equal(trendLabel(3, true), "up")
  assert.equal(trendLabel(-1, true), "down")
  assert.equal(trendLabel(0, true), "flat")
  assert.equal(trendLabel(0, false), "new")
})

test("only actionable source health produces attention", () => {
  assert.equal(meaningfulSourceAttention({ operational_status: "healthy" }), false)
  assert.equal(meaningfulSourceAttention({ operational_status: "running" }), false)
  assert.equal(meaningfulSourceAttention({ operational_status: "auth_required" }), true)
})
