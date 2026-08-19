export const REASSIGN_INVALIDATION_KEYS = Object.freeze([
  "recruitment-manager-dashboard",
  "management-report",
  "audit-logs",
  "agency-jobs",
  "agency-candidates",
  "agency-applications",
  "agency-clients",
  "client-applications",
])

export function directionForLanguage(language) {
  return language?.startsWith("en") ? "ltr" : "rtl"
}
