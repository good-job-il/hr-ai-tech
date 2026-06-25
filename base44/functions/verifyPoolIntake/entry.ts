/**
 * verifyPoolIntake
 * Diagnostic function to verify end-to-end pool intake flow.
 * Call this after sending a CV to headhunter.jobs+pool@gmail.com
 * 
 * Usage: test_backend_function('verifyPoolIntake', {})
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[verifyPoolIntake] Starting verification...');

    // 1. Get all pool candidates
    const poolCandidates = await base44.asServiceRole.entities.Candidate.filter(
      { source: 'pool' },
      '-created_date',
      10
    );

    console.log(`[verifyPoolIntake] Found ${poolCandidates.length} pool candidates`);

    // 2. Get latest candidate
    const latestCandidate = poolCandidates[0];
    
    if (!latestCandidate) {
      return Response.json({
        status: 'no_candidates',
        message: 'No candidates from pool yet. Send CV to headhunter.jobs+pool@gmail.com',
        pool_count: 0,
      });
    }

    // 3. Get documents for latest candidate
    const documents = await base44.asServiceRole.entities.CandidateDocument.filter(
      { candidate_id: latestCandidate.id, doc_type: 'cv' },
      '-created_date',
      5
    );

    // 4. Get timeline events
    const timelineEvents = await base44.asServiceRole.entities.CandidateTimeline.filter(
      { candidate_id: latestCandidate.id },
      '-created_date',
      10
    );

    // 5. Check for applications (should be NONE for pool)
    const applications = await base44.asServiceRole.entities.Application.filter(
      { candidate_email: latestCandidate.email },
      '-created_date',
      5
    );

    // 6. Get all candidates for comparison
    const allCandidates = await base44.asServiceRole.entities.Candidate.list('-created_date', 5);

    return Response.json({
      status: 'success',
      verification: {
        pool_candidates_count: poolCandidates.length,
        latest_candidate: {
          id: latestCandidate.id,
          full_name: latestCandidate.full_name,
          email: latestCandidate.email,
          phone: latestCandidate.phone,
          source: latestCandidate.source,
          status: latestCandidate.status,
          skills: latestCandidate.skills || [],
          domain_name: latestCandidate.domain_name,
          role_name: latestCandidate.role_name,
          experience_years: latestCandidate.experience_years,
          desired_salary_min: latestCandidate.desired_salary_min,
          desired_salary_max: latestCandidate.desired_salary_max,
          languages: latestCandidate.languages || [],
          previous_companies: latestCandidate.previous_companies || [],
          summary: latestCandidate.summary,
          resume_url: latestCandidate.resume_url,
          resume_filename: latestCandidate.resume_filename,
          original_file_type: latestCandidate.original_file_type,
          parsing_status: latestCandidate.parsing_status,
          parsing_confidence: latestCandidate.parsing_confidence,
          data_quality_score: latestCandidate.data_quality_score,
          created_date: latestCandidate.created_date,
        },
        documents: documents.map(d => ({
          id: d.id,
          filename: d.filename,
          file_url: d.file_url,
          original_file_type: d.original_file_type,
          uploaded_by: d.uploaded_by,
          conversion_status: d.conversion_status,
          parsing_status: d.parsing_status,
          created_date: d.created_date,
        })),
        timeline_events: timelineEvents.map(e => ({
          id: e.id,
          event_type: e.event_type,
          description: e.description,
          performed_by: e.performed_by,
          performed_by_role: e.performed_by_role,
          metadata: e.metadata,
          is_visible_to_candidate: e.is_visible_to_candidate,
          is_visible_to_employer: e.is_visible_to_employer,
          created_date: e.created_date,
        })),
        applications_count: applications.length,
        applications: applications.map(a => ({
          id: a.id,
          job_id: a.job_id,
          job_title: a.job_title,
          company: a.company,
          status: a.status,
          created_date: a.created_date,
        })),
        all_recent_candidates: allCandidates.map(c => ({
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          source: c.source,
          created_date: c.created_date,
        })),
      },
      checks: {
        candidate_created: !!latestCandidate,
        has_resume: !!latestCandidate.resume_url,
        parsing_success: latestCandidate.parsing_status === 'success',
        has_skills: (latestCandidate.skills || []).length > 0,
        has_domain: !!latestCandidate.domain_name,
        has_role: !!latestCandidate.role_name,
        document_created: documents.length > 0,
        timeline_created: timelineEvents.length > 0,
        timeline_has_pool_source: timelineEvents.some(e => e.metadata?.source === 'general_pool'),
        no_application: applications.length === 0,
        source_is_pool: latestCandidate.source === 'pool',
      },
    });
  } catch (error) {
    console.error('[verifyPoolIntake] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});