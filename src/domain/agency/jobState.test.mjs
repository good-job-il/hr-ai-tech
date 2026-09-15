import assert from "node:assert/strict"
import test from "node:test"
import {
  getEffectiveJobState,
  getJobKpis,
  getJobsEmptyState,
  isJobVisibleForList,
  updateJobStats,
  withJobState,
} from "./jobState.js"

test("uses one effective state for canonical and legacy jobs", () => {
  assert.equal(getEffectiveJobState({ state: "on_hold", is_closed: false }), "on_hold")
  assert.equal(getEffectiveJobState({ state: null, is_closed: true }), "closed")
  assert.equal(getEffectiveJobState({ state: "open", is_closed: true }), "closed")
  assert.equal(getEffectiveJobState({ state: null, is_closed: false }), "open")
})

test("defines stable global KPI semantics", () => {
  assert.deepEqual(getJobKpis({ total: 610, open: 500, on_hold: 20, filled: 30, closed: 50 }), {
    total: 610,
    open: 500,
    notRecruiting: 100,
  })
})

test("uses contextual empty states", () => {
  assert.equal(getJobsEmptyState({ routeState: "filled", search: "" }).action, null)
  assert.equal(getJobsEmptyState({ routeState: "on_hold", search: "" }).action, null)
  assert.equal(getJobsEmptyState({ routeState: "open", search: "" }).action, "create")
  assert.equal(getJobsEmptyState({ routeState: "open", search: "engineer" }).action, "clear_search")
})

test("supports optimistic status changes without losing list semantics", () => {
  assert.deepEqual(updateJobStats({ total: 5, open: 3, filled: 2 }, "open", "filled"), {
    total: 5,
    open: 2,
    filled: 3,
  })
  assert.equal(isJobVisibleForList("filled", { routeState: "open", showClosed: false }), false)
  assert.equal(isJobVisibleForList("on_hold", { routeState: null, showClosed: false }), true)
  assert.deepEqual(withJobState({ id: 7, state: "open", is_closed: false }, "closed"), {
    id: 7,
    state: "closed",
    is_closed: true,
  })
})
