export const JOB_IMPORT_FEATURE_FLAGS = Object.freeze({
  ENABLED: "job_imports_enabled",
  AUTO_APPLY_ENABLED: "job_imports_auto_apply_enabled",
  HTML_BETA_ENABLED: "job_imports_html_beta_enabled",
})

export const DEFAULT_JOB_IMPORT_FEATURE_FLAGS = Object.freeze({
  [JOB_IMPORT_FEATURE_FLAGS.ENABLED]: false,
  [JOB_IMPORT_FEATURE_FLAGS.AUTO_APPLY_ENABLED]: false,
  [JOB_IMPORT_FEATURE_FLAGS.HTML_BETA_ENABLED]: false,
})

function asRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value : null
}

export function resolveJobImportFeatureFlags(organization) {
  const featureFlags = asRecord(asRecord(organization?.settings)?.feature_flags)

  return Object.fromEntries(
    Object.entries(DEFAULT_JOB_IMPORT_FEATURE_FLAGS).map(([flag, defaultValue]) => [
      flag,
      typeof featureFlags?.[flag] === "boolean" ? featureFlags[flag] : defaultValue,
    ]),
  )
}

export function isJobImportFeatureEnabled(organization, flag) {
  return resolveJobImportFeatureFlags(organization)[flag]
}
