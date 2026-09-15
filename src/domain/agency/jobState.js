export const JOB_STATES = ["draft", "open", "on_hold", "filled", "closed"]

export function getEffectiveJobState(job) {
  const state = JOB_STATES.includes(job?.state) ? job.state : null

  if (job?.is_closed && (!state || state === "open")) {
    return "closed"
  }

  return state || "open"
}

export function getJobKpis(stats = {}) {
  const total = Number(stats.total || 0)

  const open = Number(stats.open || 0)

  const notRecruiting =
    Number(stats.on_hold || 0) + Number(stats.filled || 0) + Number(stats.closed || 0)

  return { total, open, notRecruiting }
}

export function getJobsEmptyState({ routeState, search }) {
  if (search) {
    return {
      titleKey: "matchingTitle",
      descriptionKey: "matchingDescription",
      descriptionValues: { search },
      action: "clear_search",
    }
  }

  if (routeState === "filled") {
    return {
      titleKey: "filledTitle",
      descriptionKey: "filledDescription",
      action: null,
    }
  }

  if (routeState === "on_hold") {
    return {
      titleKey: "holdTitle",
      descriptionKey: "holdDescription",
      action: null,
    }
  }

  if (routeState === "open") {
    return {
      titleKey: "openTitle",
      descriptionKey: "openDescription",
      action: "create",
    }
  }

  return {
    titleKey: "allTitle",
    descriptionKey: "allDescription",
    action: "create",
  }
}

export function updateJobStats(stats, previousState, nextState) {
  if (previousState === nextState) {
    return stats
  }

  return {
    ...stats,
    [previousState]: Math.max(0, Number(stats[previousState] || 0) - 1),
    [nextState]: Number(stats[nextState] || 0) + 1,
  }
}

export function isJobVisibleForList(state, { routeState, showClosed }) {
  if (routeState) {
    return state === routeState
  }

  return showClosed || !["filled", "closed"].includes(state)
}

export function withJobState(job, state) {
  return {
    ...job,
    state,
    is_closed: ["filled", "closed"].includes(state),
  }
}
