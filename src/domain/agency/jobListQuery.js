export const JOBS_PAGE_SIZE = 25

export function isJobsPageForbidden({ permissionsLoading, agencyWorkspace, canView }) {
  return !permissionsLoading && !!agencyWorkspace && !canView
}

export function buildJobsListQuery({ page, routeState, showClosed, search }) {
  return {
    page,
    state: routeState || undefined,
    is_closed: !routeState && !showClosed ? false : undefined,
    search: search || undefined,
    sort: "created_date",
    order: "DESC",
    limit: JOBS_PAGE_SIZE,
  }
}
