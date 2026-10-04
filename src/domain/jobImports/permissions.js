export const JOB_IMPORT_ACTIONS = [
  "view",
  "create",
  "update",
  "run",
  "review",
  "manage_credentials",
  "archive",
]

export function effectiveRoleKey(user) {
  return user?.role === "admin" && user?.impersonating ? "org_admin" : user?.role
}

export function canConfigureJobImportAction(role, action) {
  if (role === "org_admin") {
    return true
  }

  if (role === "recruitment_manager") {
    return ["view", "run", "review"].includes(action)
  }

  if (role === "team_manager") {
    return ["view", "review"].includes(action)
  }

  return false
}

export function resolvePermissionRecord(records, organizationId, orgType, role) {
  const newest = (matches) =>
    matches.sort(
      (left, right) =>
        (Date.parse(right.updated_date || "") || 0) - (Date.parse(left.updated_date || "") || 0) ||
        right.id - left.id,
    )[0]

  return (
    newest(
      records.filter(
        (record) =>
          !record.is_template &&
          organizationId != null &&
          record.organization_id === organizationId &&
          record.role_key === role,
      ),
    ) ||
    newest(
      records.filter(
        (record) =>
          record.is_template &&
          record.organization_id == null &&
          record.org_type === orgType &&
          record.role_key === role,
      ),
    )
  )
}

export function jobImportAccessState({ user, loading, enabled, canView }) {
  if (loading) {
    return "loading"
  }

  if (user?.role === "admin" && !user.impersonating) {
    return "organizationRequired"
  }

  if (!enabled) {
    return "disabled"
  }

  return canView ? "allowed" : "denied"
}

export function normalizeMatrixPermissions(permissions = {}) {
  return {
    ...permissions,
    resources: {
      ...permissions.resources,
      job_imports: Object.fromEntries(
        JOB_IMPORT_ACTIONS.map((action) => [
          action,
          Boolean(permissions.resources?.job_imports?.[action]),
        ]),
      ),
    },
  }
}
