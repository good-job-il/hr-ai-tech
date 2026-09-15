import assert from "node:assert/strict"
import test from "node:test"
import { buildJobsListQuery, isJobsPageForbidden, JOBS_PAGE_SIZE } from "./jobListQuery.js"

test("sends pagination and search to the server", () => {
  assert.deepEqual(
    buildJobsListQuery({ page: 3, routeState: "open", showClosed: false, search: "Haifa" }),
    {
      page: 3,
      state: "open",
      is_closed: undefined,
      search: "Haifa",
      sort: "created_date",
      order: "DESC",
      limit: JOBS_PAGE_SIZE,
    },
  )
})

test("uses the server-side open boundary on the all-jobs route", () => {
  assert.equal(
    buildJobsListQuery({ page: 1, routeState: null, showClosed: false, search: "" }).is_closed,
    false,
  )
  assert.equal(
    buildJobsListQuery({ page: 1, routeState: null, showClosed: true, search: "" }).is_closed,
    undefined,
  )
})

test("blocks an agency jobs page when view permission is revoked", () => {
  assert.equal(
    isJobsPageForbidden({ permissionsLoading: false, agencyWorkspace: "/agency", canView: false }),
    true,
  )
  assert.equal(
    isJobsPageForbidden({ permissionsLoading: false, agencyWorkspace: "/agency", canView: true }),
    false,
  )
})
