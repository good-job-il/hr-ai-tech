/**
 * RLS Filter Utilities — Multi-Tenant + Platform Isolation
 * ─────────────────────────────────────────────────────────────
 * כל record מבודד לפי organization_id.
 *
 * היררכיה בתוך ארגון (staffing_agency):
 *   org_admin           → כל הארגון
 *   recruitment_manager → כל הארגון (agency-wide)
 *   team_manager        → כל הצוות שלו (team_manager_id = userId)
 *   recruiter           → רק שלו (recruiter_id = userId)
 *
 * employer → entity חיצוני (employer_company_id בלבד)
 * admin    → גלובלי, ללא סינון (platform operator)
 *
 * FALLBACK_ORG_ID = ID של "תעסוקה טובה" — מולא לאחר יצירת הארגון.
 * משמש migration זמני לרשומות ישנות ללא organization_id.
 * ─────────────────────────────────────────────────────────────
 */

// Migration fallback removed — all records now have organization_id stamped at creation.

/**
 * @param {string} role        - user.role
 * @param {string} entityName  - שם ה-entity
 * @param {string} userId      - user.id
 * @param {object} userMeta    - { organizationId, employerCompanyId, email, orgType }
 */
export const getRLSFilter = (role, entityName, userId, userMeta = {}) => {
  const { organizationId, employerCompanyId, email, orgType } = userMeta;

  // ─── Admin (platform operator) — גלובלי ────────────────────
  if (role === 'admin') return {};


  switch (role) {

    // ─── Org Admin — כל הארגון ────────────────────────────────
    case 'org_admin': {
      if (!organizationId) return { id: '__BLOCKED__' };
      return getOrgFilter(entityName, organizationId, null, null, null, employerCompanyId, email);
    }

    // ─── Recruitment Manager — כל הארגון ─────────────────────
    case 'recruitment_manager': {
      if (!organizationId) return { id: '__BLOCKED__' };
      return getOrgFilter(entityName, organizationId, null, null, null, null, email);
    }

    // ─── Team Manager — הצוות שלו בתוך הארגון ────────────────
    case 'team_manager': {
      if (!organizationId) return { id: '__BLOCKED__' };
      return getOrgFilter(entityName, organizationId, null, userId, null, null, email);
    }

    // ─── Recruiter — רק שלו בתוך הארגון ──────────────────────
    case 'recruiter': {
      if (!organizationId) return { id: '__BLOCKED__' };
      return getOrgFilter(entityName, organizationId, userId, null, null, null, email);
    }

    // ─── Employer — לפי employer_company_id בלבד ──────────────
    case 'employer': {
      if (!employerCompanyId) return { id: '__BLOCKED__' };
      switch (entityName) {
        case 'Job':          return { employer_company_id: employerCompanyId };
        case 'Application':  return { employer_company_id: employerCompanyId };
        case 'Candidate':    return { employer_company_id: employerCompanyId };
        case 'Interview':    return { employer_company_id: employerCompanyId };
        case 'CompensationPlan': return { id: '__BLOCKED__' }; // חסום לחלוטין
        default:             return { id: '__BLOCKED__' };
      }
    }

    // ─── Candidate ────────────────────────────────────────────
    case 'candidate': {
      switch (entityName) {
        case 'Job':             return { is_closed: false };
        case 'Application':     return { candidate_email: email };
        case 'SavedJob':        return { user_email: email };
        case 'CandidateProfile':return { user_email: email };
        case 'Interview':       return { candidate_email: email };
        case 'JobAlert':        return { user_email: email };
        default:                return { id: '__BLOCKED__' };
      }
    }

    default:
      return { id: '__BLOCKED__' };
  }
};

/**
 * Entities שתומכות ב-soft delete — מסוננות אוטומטית
 */
const SOFT_DELETE_ENTITIES = ['Candidate', 'Application', 'Job', 'Company'];

/**
 * בונה filter לפי organization_id + hierarchy
 * @param {string} entityName
 * @param {string} orgId          - organization_id (חובה לכל internal role)
 * @param {string|null} recruiterId      - userId של recruiter (רק ל-recruiter)
 * @param {string|null} teamManagerId    - userId של team_manager (רק ל-team_manager)
 * @param {string|null} rmId             - userId של recruitment_manager (אם רלוונטי)
 * @param {string|null} employerCompanyId
 * @param {string|null} email
 */
function getOrgFilter(entityName, orgId, recruiterId, teamManagerId, rmId, employerCompanyId, email, orgType = null) {
  // CompensationPlan — staffing_agency בלבד! חסום ל-company HR
  if (entityName === 'CompensationPlan') {
    if (orgType !== 'staffing_agency') {
      return { id: '__BLOCKED__' };
    }
    return { organization_id: orgId };
  }

  // Entities שתומכות ב-organization_id בלבד (org-wide)
  const orgWideEntities = [
    'Job', 'Application', 'Candidate', 'CandidateDocument',
    'CandidateTimeline', 'ApplicationTimeline', 'CommunicationLog',
    'Interview', 'Notification', 'CandidateImportBatch',
    'CandidateNote', 'CandidateTag', 'Message', 'ApplicationPipeline', 'Position'
  ];

  if (!orgWideEntities.includes(entityName)) {
    return { id: '__BLOCKED__' };
  }

  // base filter — תמיד organization_id + soft delete
  const base = {
    organization_id: orgId,
    ...(SOFT_DELETE_ENTITIES.includes(entityName) ? { is_deleted: false } : {}),
  };

  if (recruiterId) {
    return { ...base, recruiter_id: recruiterId };
  }
  if (teamManagerId) {
    return { ...base, team_manager_id: teamManagerId };
  }

  return base;
}

/**
 * האם filter זה חסום?
 * (exported separately to preserve backward compat)
 */

export const isFilterBlocked = (filter) =>
  filter && filter.id === '__BLOCKED__';
