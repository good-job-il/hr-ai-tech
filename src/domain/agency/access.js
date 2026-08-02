import {
  AGENCY_ORG_TYPE,
  AGENCY_ROLE_SCOPES,
  AGENCY_ROLES,
  AGENCY_DATA_SCOPES,
} from './contracts.js';

export function isAgencyUser(user) {
  return Boolean(
    user?.id &&
    user?.organization_id &&
    user?.org_type === AGENCY_ORG_TYPE &&
    AGENCY_ROLES.includes(user?.role)
  );
}

export function getAgencyDataScope(user) {
  if (!isAgencyUser(user)) return null;
  return AGENCY_ROLE_SCOPES[user.role] || null;
}

/**
 * Query filters reduce payload size. Backend RLS remains the security boundary.
 */
export function getAgencyScopeFilter(user) {
  const scope = getAgencyDataScope(user);
  if (!scope) return null;

  const filter = { organization_id: user.organization_id };
  if (scope === AGENCY_DATA_SCOPES.TEAM) filter.team_manager_id = user.id;
  if (scope === AGENCY_DATA_SCOPES.OWN) filter.recruiter_id = user.id;
  return filter;
}

export function canAccessAgencyRecord(user, record) {
  const scope = getAgencyDataScope(user);
  if (!scope || !record) return false;
  if (!record.organization_id || record.organization_id !== user.organization_id) return false;

  if (scope === AGENCY_DATA_SCOPES.ORGANIZATION) return true;
  if (scope === AGENCY_DATA_SCOPES.TEAM) return record.team_manager_id === user.id;
  if (scope === AGENCY_DATA_SCOPES.OWN) {
    return record.recruiter_id === user.id || record.assigned_to === user.id;
  }
  return false;
}

export function filterAgencyRecordsByScope(user, records = []) {
  return records.filter(record => canAccessAgencyRecord(user, record));
}

