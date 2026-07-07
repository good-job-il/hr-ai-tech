import { UserRole } from '../enums/user-role.enum';

/**
 * RLS (Row-Level Security) utilities — ported from frontend's rls-utils.js.
 *
 * Used in NestJS services to build organization-scoped WHERE clauses.
 * Every sensitive query MUST call getRlsWhere() and merge the result
 * into the TypeORM find options.
 */

export interface UserContext {
  id: number;
  role: UserRole;
  organization_id: number | null;
  employer_company_id?: number | null;
  email: string;
  org_type?: string | null;
}

/** Sentinel value that indicates the query should return no results */
export const BLOCKED_FILTER = { id: '__BLOCKED__' };

/** Entities supporting soft delete — adds is_deleted: false automatically */
const SOFT_DELETE_ENTITIES = ['Candidate', 'Application', 'Job', 'Company'];

/** Entities scoped to the whole org */
const ORG_WIDE_ENTITIES = [
  'Job',
  'Application',
  'Candidate',
  'CandidateDocument',
  'CandidateTimeline',
  'ApplicationTimeline',
  'CommunicationLog',
  'Interview',
  'Notification',
  'CandidateImportBatch',
  'CandidateNote',
  'CandidateTag',
  'Message',
  'ApplicationPipeline',
  'Position',
];

/**
 * Returns a TypeORM-compatible WHERE filter object based on user role.
 * Returns BLOCKED_FILTER if the user has no access.
 */
export function getRlsWhere(
  entityName: string,
  user: UserContext,
  extraFilters: Record<string, any> = {},
): Record<string, any> {
  const { role, id: userId, organization_id, employer_company_id, email } = user;

  // ─── Admin — unrestricted ─────────────────────────────────────────────
  if (role === UserRole.ADMIN) {
    return buildFinal(entityName, {}, extraFilters);
  }


  // ─── Org-based roles ──────────────────────────────────────────────────
  switch (role) {
    case UserRole.ORG_ADMIN:
    case UserRole.RECRUITMENT_MANAGER:
    case UserRole.HR_MANAGER: {
      if (!organization_id) return BLOCKED_FILTER;
      return buildFinal(entityName, { organization_id }, extraFilters);
    }

    case UserRole.TEAM_MANAGER: {
      if (!organization_id) return BLOCKED_FILTER;
      const base = getOrgFilter(entityName, organization_id, null, userId);
      return base === BLOCKED_FILTER
        ? BLOCKED_FILTER
        : buildFinal(entityName, base, extraFilters);
    }

    case UserRole.RECRUITER:
    case UserRole.INTERNAL_RECRUITER: {
      if (!organization_id) return BLOCKED_FILTER;
      const base = getOrgFilter(entityName, organization_id, userId, null);
      return base === BLOCKED_FILTER
        ? BLOCKED_FILTER
        : buildFinal(entityName, base, extraFilters);
    }

    case UserRole.EMPLOYER: {
      if (!employer_company_id) return BLOCKED_FILTER;
      const employerEntityFilter: Record<string, Record<string, any>> = {
        Job:         { employer_company_id },
        Application: { employer_company_id },
        Candidate:   { employer_company_id },
        Interview:   { employer_company_id },
      };
      const filter = employerEntityFilter[entityName];
      return filter ? buildFinal(entityName, filter, extraFilters) : BLOCKED_FILTER;
    }

    case UserRole.CANDIDATE: {
      const candidateFilters: Record<string, Record<string, any>> = {
        Job:             { is_closed: false },
        Application:     { candidate_email: email },
        SavedJob:        { user_email: email },
        CandidateProfile: { user_email: email },
        Interview:       { candidate_email: email },
        JobAlert:        { user_email: email },
      };
      const filter = candidateFilters[entityName];
      return filter ? buildFinal(entityName, filter, extraFilters) : BLOCKED_FILTER;
    }

    default:
      return BLOCKED_FILTER;
  }
}

function getOrgFilter(
  entityName: string,
  orgId: number,
  recruiterId: number | null,
  teamManagerId: number | null,
): Record<string, any> {
  if (entityName === 'CompensationPlan') {
    return { organization_id: orgId };
  }

  if (!ORG_WIDE_ENTITIES.includes(entityName)) {
    return BLOCKED_FILTER;
  }

  const base: Record<string, any> = { organization_id: orgId };

  if (SOFT_DELETE_ENTITIES.includes(entityName)) {
    base.is_deleted = false;
  }

  if (recruiterId) {
    return { ...base, recruiter_id: recruiterId };
  }
  if (teamManagerId) {
    return { ...base, team_manager_id: teamManagerId };
  }

  return base;
}

function buildFinal(
  entityName: string,
  rlsFilter: Record<string, any>,
  extraFilters: Record<string, any>,
): Record<string, any> {
  const softDelete =
    SOFT_DELETE_ENTITIES.includes(entityName) &&
    !('is_deleted' in rlsFilter) &&
    !('is_deleted' in extraFilters)
      ? { is_deleted: false }
      : {};

  return { ...softDelete, ...extraFilters, ...rlsFilter };
}

export function isBlocked(filter: Record<string, any>): boolean {
  return filter?.id === '__BLOCKED__';
}

