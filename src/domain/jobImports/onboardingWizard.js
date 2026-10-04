export const JOB_IMPORT_WIZARD_STEPS = Object.freeze([
  "source",
  "client",
  "connection",
  "sample",
  "mapping",
  "dryRun",
  "confirmation",
])

export function isValidImportUrl(value) {
  try {
    const url = new URL(value)

    return ["http:", "https:"].includes(url.protocol)
  } catch {
    return false
  }
}

export function sourceNameFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function vendorConnectorForUrl(value) {
  try {
    const url = new URL(value)

    if (!["http:", "https:"].includes(url.protocol)) {
      return null
    }

    if (["www.comeet.com", "comeet.com", "www.comeet.co", "comeet.co"].includes(url.hostname)) {
      return "comeet"
    }

    if (
      ["boards.greenhouse.io", "job-boards.greenhouse.io", "boards-api.greenhouse.io"].includes(
        url.hostname,
      )
    ) {
      return "greenhouse"
    }

    if (
      ["jobs.lever.co", "jobs.eu.lever.co", "api.lever.co", "api.eu.lever.co"].includes(
        url.hostname,
      )
    ) {
      return "lever"
    }
  } catch {
    /* not a recognized URL */
  }

  return null
}

export function summarizeImportRun(run) {
  if (!run) {
    return { total: 0, destructive: 0, reviewRequired: 0 }
  }

  return {
    total: Number(run.items_fetched || 0),
    destructive: Number(run.close_count || 0),
    reviewRequired: Number(run.review_count || 0) + Number(run.error_count || 0),
  }
}

export function previewReadiness(run) {
  if (!run) {
    return { ready: false, reason: "missing" }
  }

  if (["pending", "running"].includes(run.status)) {
    return { ready: false, reason: "running" }
  }

  if (["failed", "dead_letter", "cancelled"].includes(run.status)) {
    return { ready: false, reason: "failed" }
  }

  if (run.status === "partial" || run.snapshot_completeness === "partial") {
    return { ready: false, reason: "partial" }
  }

  if (!run.items_fetched) {
    return { ready: false, reason: "empty" }
  }

  if (Number(run.error_count || 0) > 0) {
    return { ready: false, reason: "errors" }
  }

  if (Number(run.review_count || 0) > 0) {
    return { ready: false, reason: "review" }
  }

  return { ready: true, reason: null }
}

export function importErrorAction(code) {
  const actions = {
    AUTH_REQUIRED: "credentials",
    SOURCE_FORBIDDEN: "checkAccess",
    ROBOTS_DENIED: "chooseAnotherSource",
    RATE_LIMITED: "retryLater",
    UNSUPPORTED_FORMAT: "changeConnector",
    CONNECTOR_MISMATCH: "changeConnector",
    PARSER_CHANGED: "reviewMapping",
    MAPPING_INVALID: "reviewMapping",
    PARTIAL_SNAPSHOT: "retryPreview",
    CLIENT_UNAVAILABLE: "chooseClient",
    DUPLICATE_CONFLICT: "openReview",
    SECURITY_REJECTED: "chooseAnotherSource",
  }

  return actions[code] || "retry"
}

export function mergeOnboardingState(current, patch) {
  return { ...(current || {}), ...patch }
}
