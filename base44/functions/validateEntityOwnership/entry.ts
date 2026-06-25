/**
 * Backend Validation Utilities — Multi-Tenant
 * ─────────────────────────────────────────────────────────────
 * Validation ל-create/update של entities קריטיים.
 * מונע יצירת רשומות ללא ownership ברור.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Validate organization context for staffing_agency
 * @param {object} base44
 * @returns {{ organizationId: string, orgType: string, role: string, userId: string, email: string }}
 */
export async function validateOrgContext(base44) {
  const user = await base44.auth.me();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const organizationId = user.organization_id;
  const orgType = user.data?.org_type;
  const role = user.role || user.user_type;

  // staffing_agency validation
  if (orgType === 'staffing_agency') {
    if (!organizationId) {
      throw new Error('Missing organization_id — user not associated with any organization');
    }

    // recruiter/team_manager/recruitment_manager חייבים להיות משויכים
    if (role === 'recruiter' && !user.data?.recruiter_id) {
      throw new Error('Recruiter must have recruiter_id set');
    }
    if (role === 'team_manager' && !user.data?.team_manager_id) {
      throw new Error('Team manager must have team_manager_id set');
    }
  }

  return { organizationId, orgType, role, userId: user.id, email: user.email };
}

/**
 * Validate candidate/application data before create/update
 * @param {object} data
 * @param {object} context - { organizationId, orgType, role, userId }
 * @param {string} entityName - 'Candidate' | 'Application' | 'Interview'
 */
export function validateEntityData(data, context, entityName) {
  const { organizationId, orgType, role, userId } = context;
  const errors = [];

  // חובה לכל הארגונים
  if (!data.organization_id) {
    errors.push(`organization_id is required for ${entityName}`);
  } else if (data.organization_id !== organizationId) {
    errors.push(`organization_id mismatch: expected ${organizationId}, got ${data.organization_id}`);
  }

  // staffing_agency specific
  if (orgType === 'staffing_agency') {
    // recruiter_id חובה ל-Candidate/Application/Interview
    if (['Candidate', 'Application', 'Interview'].includes(entityName)) {
      if (!data.recruiter_id) {
        errors.push('recruiter_id is required for staffing_agency');
      }
    }

    // team_manager_id חובה אם יש team_manager
    if (role === 'team_manager' && !data.team_manager_id) {
      errors.push('team_manager_id is required when user is team_manager');
    }
  }

  // company HR validation
  if (orgType === 'organization') {
    if (entityName === 'CompensationPlan') {
      errors.push('CompensationPlan is not allowed for organization type');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
}

/**
 * Enforce CompensationPlan isolation — staffing_agency only
 * @param {object} context
 * @throws {Error} if not staffing_agency
 */
export function enforceCompensationIsolation(context) {
  if (context.orgType !== 'staffing_agency') {
    throw new Error('CompensationPlan is only available for staffing_agency organizations');
  }
}