export const REASSIGN_INVALIDATION_KEYS = Object.freeze([
  "recruitment-manager-dashboard",
  "team-manager-dashboard",
  "team-interviews",
  "agency-teams",
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
