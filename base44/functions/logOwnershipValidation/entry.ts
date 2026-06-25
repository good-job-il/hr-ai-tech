/**
 * Ownership Validation Audit Logger
 * Logs failed ownership validation attempts to AuditLog
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export async function logOwnershipValidationFailure(base44, context) {
  try {
    const { entityName, fieldName, userId, userEmail, userRole, metadata = {} } = context;
    
    await base44.asServiceRole.entities.AuditLog.create({
      organization_id: metadata.organization_id || null,
      actor_user_id: userId,
      actor_email: userEmail,
      actor_role: userRole,
      entity_type: entityName,
      entity_id: metadata.entity_id || 'unknown',
      entity_label: metadata.entity_label || `Failed ${entityName} creation`,
      action: 'ownership_validation_failed',
      metadata: {
        failed_field: fieldName,
        error_message: `Missing required field: ${fieldName}`,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
    
    console.warn(`[OwnershipValidation] Failed to create ${entityName}: missing ${fieldName}`, { userId: userId, email: userEmail });
  } catch (err) {
    console.error('[logOwnershipValidationFailure] Failed to log audit:', err.message);
  }
}

/**
 * Validate required ownership fields before entity creation
 * Returns { valid: boolean, errors: string[] }
 */
export function validateOwnershipFields(entityName, data, userContext) {
  const errors = [];
  const { organizationId, orgType, role, userId, email } = userContext;
  
  // ALL entities require organization_id
  if (!data.organization_id) {
    errors.push(`organization_id is required for ${entityName}`);
  } else if (data.organization_id !== organizationId) {
    errors.push(`organization_id mismatch: expected ${organizationId}, got ${data.organization_id}`);
  }
  
  // Entity-specific required fields
  if (entityName === 'Candidate') {
    if (!data.full_name) errors.push('full_name is required');
    if (!data.email && !data.phone) errors.push('email or phone is required');
    
    // staffing_agency: recruiter_id required
    if (orgType === 'staffing_agency' && ['recruiter', 'team_manager', 'recruitment_manager'].includes(role)) {
      if (!data.recruiter_id) {
        errors.push('recruiter_id is required for staffing_agency');
      }
    }
  }
  
  if (entityName === 'CandidateDocument') {
    if (!data.candidate_id) errors.push('candidate_id is required');
    if (!data.file_url) errors.push('file_url is required');
    if (!data.doc_type) errors.push('doc_type is required');
  }
  
  if (entityName === 'CandidateTimeline') {
    if (!data.candidate_id) errors.push('candidate_id is required');
    if (!data.event_type) errors.push('event_type is required');
    if (!data.description) errors.push('description is required');
  }
  
  if (entityName === 'Application') {
    if (!data.job_id) errors.push('job_id is required');
    if (!data.candidate_id && !data.candidate_email) errors.push('candidate_id or candidate_email is required');
    if (!data.candidate_name) errors.push('candidate_name is required');
  }
  
  if (entityName === 'ApplicationTimeline') {
    if (!data.application_id) errors.push('application_id is required');
    if (!data.event_type) errors.push('event_type is required');
    if (!data.description) errors.push('description is required');
  }
  
  if (entityName === 'Interview') {
    if (!data.candidate_id) errors.push('candidate_id is required');
    if (!data.date) errors.push('date is required');
    if (!data.time) errors.push('time is required');
  }
  
  if (entityName === 'CompensationPlan') {
    // Only staffing_agency can create compensation plans
    if (orgType !== 'staffing_agency') {
      errors.push('CompensationPlan is only allowed for staffing_agency organizations');
    }
    if (!data.client_name) errors.push('client_name is required');
  }
  
  if (entityName === 'CommunicationLog') {
    if (!data.candidate_id) errors.push('candidate_id is required');
    if (!data.channel) errors.push('channel is required');
    if (!data.content) errors.push('content is required');
    if (!data.sender_email) errors.push('sender_email is required');
  }
  
  return { valid: errors.length === 0, errors };
}