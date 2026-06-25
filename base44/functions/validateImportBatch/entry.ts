import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Validate import batch for production readiness
 * Check all critical dependencies before large-scale import
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { import_batch_id } = await req.json();

    if (!import_batch_id) {
      return Response.json({ error: 'import_batch_id required' }, { status: 400 });
    }

    // Fetch batch
    const batch = await base44.entities.CandidateImportBatch.get(import_batch_id);
    if (!batch) {
      return Response.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Fetch candidates in batch
    const candidates = await base44.entities.Candidate.filter({ import_batch_id });

    // Run validation checks
    const checks = {
      resume_upload: {
        passed: candidates.filter(c => c.resume_url).length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.resume_url).length,
        failed: candidates.filter(c => !c.resume_url).length
      },
      docx_conversion: {
        passed: candidates.filter(c => c.converted_resume_url).length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.converted_resume_url).length,
        failed: candidates.filter(c => !c.converted_resume_url).length
      },
      parsing_success: {
        passed: candidates.filter(c => c.parsing_status === 'success').length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.parsing_status === 'success').length,
        partial: candidates.filter(c => c.parsing_status === 'partial').length,
        failed: candidates.filter(c => c.parsing_status === 'failed').length
      },
      email_validation: {
        passed: candidates.filter(c => c.email).length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.email).length,
        missing: candidates.filter(c => !c.email).length
      },
      phone_validation: {
        passed: candidates.filter(c => c.phone).length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.phone).length,
        missing: candidates.filter(c => !c.phone).length
      },
      role_validation: {
        passed: candidates.filter(c => c.role_name).length === candidates.length,
        total: candidates.length,
        success: candidates.filter(c => c.role_name).length,
        missing: candidates.filter(c => !c.role_name).length
      },
      duplicate_detection: {
        passed: candidates.filter(c => !c.is_duplicate_suspected).length === candidates.length,
        total: candidates.length,
        clean: candidates.filter(c => !c.is_duplicate_suspected).length,
        suspected: candidates.filter(c => c.is_duplicate_suspected).length
      },
      recruiter_assignment: {
        passed: candidates.filter(c => c.recruiter_id).length === candidates.length,
        total: candidates.length,
        assigned: candidates.filter(c => c.recruiter_id).length,
        unassigned: candidates.filter(c => !c.recruiter_id).length
      },
      data_quality: {
        passed: candidates.filter(c => c.data_quality_score >= 50).length === candidates.length,
        avg_score: Math.round(candidates.reduce((sum, c) => sum + (c.data_quality_score || 0), 0) / candidates.length),
        excellent: candidates.filter(c => c.data_quality_score >= 80).length,
        good: candidates.filter(c => c.data_quality_score >= 50 && c.data_quality_score < 80).length,
        poor: candidates.filter(c => c.data_quality_score < 50).length
      }
    };

    // Calculate overall readiness
    const passedChecks = Object.values(checks).filter(c => c.passed).length;
    const totalChecks = Object.values(checks).length;
    const readinessScore = Math.round((passedChecks / totalChecks) * 100);

    // Generate recommendations
    const recommendations = [];
    if (!checks.resume_upload.passed) recommendations.push(`⚠️ ${checks.resume_upload.failed} candidates missing resumes`);
    if (!checks.docx_conversion.passed) recommendations.push(`⚠️ ${checks.docx_conversion.failed} candidates missing DOCX conversion`);
    if (!checks.parsing_success.passed) recommendations.push(`⚠️ ${checks.parsing_success.failed} candidates have parsing failures`);
    if (!checks.email_validation.passed) recommendations.push(`⚠️ ${checks.email_validation.missing} candidates missing email`);
    if (!checks.phone_validation.passed) recommendations.push(`⚠️ ${checks.phone_validation.missing} candidates missing phone`);
    if (!checks.role_validation.passed) recommendations.push(`⚠️ ${checks.role_validation.missing} candidates missing role`);
    if (!checks.duplicate_detection.passed) recommendations.push(`⚠️ ${checks.duplicate_detection.suspected} suspected duplicates`);
    if (!checks.recruiter_assignment.passed) recommendations.push(`⚠️ ${checks.recruiter_assignment.unassigned} candidates unassigned`);
    if (checks.data_quality.avg_score < 60) recommendations.push(`⚠️ Average data quality is ${checks.data_quality.avg_score}%`);

    const isProduction = readinessScore >= 80 && recommendations.length === 0;

    return Response.json({
      batch_id: import_batch_id,
      readiness_score: readinessScore,
      passed_checks: passedChecks,
      total_checks: totalChecks,
      is_production_ready: isProduction,
      checks,
      recommendations,
      summary: {
        total_candidates: candidates.length,
        duplicates_suspected: checks.duplicate_detection.suspected,
        parsing_issues: checks.parsing_success.failed + checks.parsing_success.partial,
        missing_data: {
          email: checks.email_validation.missing,
          phone: checks.phone_validation.missing,
          role: checks.role_validation.missing
        }
      }
    });

  } catch (error) {
    console.error('[validateImportBatch] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});