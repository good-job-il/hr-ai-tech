export const SOURCE_OPERATIONAL_STATUSES = Object.freeze([
  "healthy",
  "running",
  "needs_review",
  "degraded",
  "auth_required",
  "paused",
])

export function latestRunChanges(run) {
  if (!run) {
    return 0
  }

  return ["create_count", "update_count", "close_count", "reopen_count"].reduce(
    (total, field) => total + Number(run[field] || 0),
    0,
  )
}

export function sourceFreshness(source, now = Date.now()) {
  if (source.state === "paused") {
    return "paused"
  }

  if (!source.last_success_at) {
    if (source.state === "draft") {
      return "not_started"
    }

    if (Number(source.interval_hours || 0) <= 0) {
      return "manual"
    }

    return "never"
  }

  if (Number(source.interval_hours || 0) <= 0) {
    return "manual"
  }

  const elapsedHours = (now - new Date(source.last_success_at).getTime()) / 3_600_000

  const expectedHours = Math.max(Number(source.interval_hours), 1)

  if (elapsedHours > expectedHours * 2) {
    return "stale"
  }

  if (elapsedHours > expectedHours * 1.25) {
    return "due"
  }

  return "fresh"
}

export function trendLabel(value, comparisonAvailable) {
  if (!comparisonAvailable) {
    return "new"
  }

  if (value > 0) {
    return "up"
  }

  if (value < 0) {
    return "down"
  }

  return "flat"
}

export function meaningfulSourceAttention(source) {
  return ["needs_review", "degraded", "auth_required"].includes(source.operational_status)
}
