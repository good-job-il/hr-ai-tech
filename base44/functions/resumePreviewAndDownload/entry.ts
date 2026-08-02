import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Resume preview and download service
 * Logs cv_view and cv_download events to AuditLog.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id, action } = await req.json();

    if (!candidate_id) {
      return Response.json({ error: 'candidate_id required' }, { status: 400 });
    }

    // Fetch candidate
    const candidate = await base44.entities.Candidate.get(candidate_id);
    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Check permissions
    const organizationId = user.organization_id || user.data?.organization_id;
    const sameOrganization = Boolean(organizationId && candidate.organization_id === organizationId);
    const isAdmin = user.role === 'admin' && sameOrganization;
    const isOrgManager = sameOrganization && ['org_admin', 'recruitment_manager', 'hr_manager'].includes(user.role);
    const isTeamOwner = sameOrganization && user.role === 'team_manager' && candidate.team_manager_id === user.id;
    const isRecruiterOwner = sameOrganization && ['recruiter', 'internal_recruiter'].includes(user.role) && candidate.recruiter_id === user.id;
    const isEmployerOwner = sameOrganization && user.role === 'employer' && candidate.employer_id === user.email;
    const isOwner = isOrgManager || isTeamOwner || isRecruiterOwner || isEmployerOwner;

    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Helper — fire-and-forget audit log (never blocks main flow)
    const auditAction = action === 'download' ? 'cv_download' : 'cv_view';
    base44.functions.invoke('createAuditLog', {
      organization_id: candidate.organization_id || null,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      entity_type: 'Candidate',
      entity_id: candidate_id,
      entity_label: candidate.full_name,
      action: auditAction,
      metadata: { filename: candidate.original_resume_filename || candidate.resume_filename },
      ip_address: req.headers.get('x-forwarded-for') || null,
      user_agent: req.headers.get('user-agent') || null,
    }).catch(e => console.warn('[resumePreviewAndDownload] audit warn:', e.message));

    if (action === 'preview') {
      return Response.json({
        candidate_id,
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        parsed_data: {
          summary: candidate.summary,
          skills: candidate.skills || [],
          experience_years: candidate.experience_years,
          location: candidate.location,
          previous_companies: candidate.previous_companies || []
        },
        resume_info: {
          converted_resume_url: candidate.converted_resume_url,
          original_resume_url: candidate.original_resume_url,
          converted_filename: candidate.converted_resume_filename,
          original_filename: candidate.original_resume_filename,
          original_file_type: candidate.original_file_type,
          file_size: candidate.resume_file_size,
          uploaded_at: candidate.resume_uploaded_at
        },
        parsing: {
          status: candidate.parsing_status,
          confidence: candidate.parsing_confidence,
          quality_score: candidate.data_quality_score
        }
      });
    }

    if (action === 'download') {
      if (!candidate.converted_resume_url) {
        return Response.json({
          error: 'Converted resume not available',
          status: 'conversion_pending'
        }, { status: 404 });
      }
      return Response.json({
        download_url: candidate.converted_resume_url,
        filename: candidate.converted_resume_filename || `${candidate.full_name}.docx`,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('[resumePreviewAndDownload] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
