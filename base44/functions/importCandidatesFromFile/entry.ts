/**
 * importCandidatesFromFile
 * Full import pipeline:
 *  1. Parse CSV
 *  2. Validate rows
 *  3. Duplicate detection (email + phone normalized)
 *  4. Create Candidate
 *  5. Create CandidateDocument for resume
 *  6. Create CandidateTimeline 'imported' event
 *  7. Trigger processCandidateImport for AI matching + ATS
 *  8. Update batch stats
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // PERMISSION CHECK: Only internal recruitment team can import candidates
    if (!['admin', 'org_admin', 'recruitment_manager', 'team_manager'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized: Import access limited to admin/recruitment_manager/team_manager' }, { status: 403 });
    }

    const organizationId = user.organization_id || user.data?.organization_id;
    if (!organizationId) {
      return Response.json({ error: 'Organization context required' }, { status: 403 });
    }

    const body = await req.json();
    const { fileUrl, batchId, fileName } = body;

    if (!fileUrl || !batchId) {
      return Response.json({ error: 'Missing fileUrl or batchId' }, { status: 400 });
    }

    const visibleBatches = await base44.entities.CandidateImportBatch.filter(
      { id: batchId, organization_id: organizationId }, '', 1
    );
    if (visibleBatches.length === 0) {
      return Response.json({ error: 'Import batch not found in organization scope' }, { status: 404 });
    }

    // Update batch status to in_progress
    await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
      status: 'in_progress',
      processing_started_at: new Date().toISOString(),
    });

    // Fetch file content
    const fileResponse = await fetch(fileUrl);
    const fileContent = await fileResponse.text();

    // Parse CSV (handles quoted fields with commas)
    const lines = fileContent.split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
        status: 'failed',
        error_log: 'File is empty or has only headers',
        processing_completed_at: new Date().toISOString(),
      });
      return Response.json({ error: 'Empty file' }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record = {};
      headers.forEach((header, idx) => { record[header] = (values[idx] || '').trim(); });
      if (record.full_name) records.push(record);
    }

    let successful = 0, failed = 0, duplicates = 0;
    let missingEmail = 0, missingPhone = 0, missingRole = 0, missingResume = 0;
    const errors = [];

    for (const record of records) {
      try {
        if (!record.full_name) { failed++; errors.push('Missing full_name'); continue; }

        if (!record.email) missingEmail++;
        if (!record.phone) missingPhone++;
        if (!record.role_name && !record.role_id) missingRole++;
        if (!record.resume_url) missingResume++;

        // ── Duplicate detection: email ───────────────────────────────────────
        let existingCandidateId = null;
        if (record.email) {
          const byEmail = await base44.asServiceRole.entities.Candidate.filter(
            { organization_id: organizationId, email: record.email.toLowerCase().trim() }, '', 1
          );
          if (byEmail.length > 0) {
            duplicates++;
            existingCandidateId = byEmail[0].id;
            errors.push(`DUPLICATE (email): ${record.full_name} <${record.email}>`);
            // Update existing CandidateProfile if missing fields
            await upsertCandidateProfile(base44, byEmail[0], record, false);
            continue;
          }
        }

        // ── Duplicate detection: phone (normalized) ──────────────────────────
        if (record.phone) {
          const normalizedPhone = record.phone.replace(/\D/g, '');
          if (normalizedPhone.length >= 7) {
            const allWithPhone = await base44.asServiceRole.entities.Candidate.filter(
              { organization_id: organizationId, phone: record.phone }, '', 1
            );
            if (allWithPhone.length > 0) {
              duplicates++;
              errors.push(`DUPLICATE (phone): ${record.full_name} ${record.phone}`);
              await upsertCandidateProfile(base44, allWithPhone[0], record, false);
              continue;
            }
          }
        }

        // ── Data quality score ───────────────────────────────────────────────
        let dataQuality = 0;
        if (record.full_name) dataQuality += 20;
        if (record.email) dataQuality += 20;
        if (record.phone) dataQuality += 20;
        if (record.role_name || record.role_id) dataQuality += 20;
        if (record.resume_url) dataQuality += 20;

        const missingFields = [];
        if (!record.email) missingFields.push('email');
        if (!record.phone) missingFields.push('phone');
        if (!record.role_name && !record.role_id) missingFields.push('role');
        if (!record.resume_url) missingFields.push('resume');

        const skills = record.skills ? record.skills.split(';').map(s => s.trim()).filter(Boolean) : [];
        const languages = record.languages ? record.languages.split(';').map(l => l.trim()).filter(Boolean) : [];
        const previousCompanies = record.previous_companies ? record.previous_companies.split(';').map(c => c.trim()).filter(Boolean) : [];

        // ── Create Candidate ─────────────────────────────────────────────────
        const newCandidate = await base44.asServiceRole.entities.Candidate.create({
          organization_id: organizationId,
          full_name: record.full_name,
          email: record.email ? record.email.toLowerCase().trim() : '',
          phone: record.phone || '',
          location: record.location || '',
          domain_name: record.domain_name || '',
          domain_id: record.domain_id ? parseInt(record.domain_id) : null,
          role_name: record.role_name || '',
          role_id: record.role_id ? parseInt(record.role_id) : null,
          specialization_name: record.specialization_name || '',
          experience_years: record.experience_years ? parseInt(record.experience_years) : 0,
          desired_salary_min: record.desired_salary_min ? parseInt(record.desired_salary_min) : null,
          desired_salary_max: record.desired_salary_max ? parseInt(record.desired_salary_max) : null,
          resume_url: record.resume_url || '',
          original_resume_url: record.resume_url || '',
          resume_filename: record.resume_filename || (record.resume_url ? record.resume_url.split('/').pop() : ''),
          original_resume_filename: record.resume_filename || '',
          source: 'import',
          status: 'new',
          employer_id: record.employer_id || '',
          recruiter_id: null,
          team_manager_id: user.role === 'team_manager' ? user.id : (user.team_manager_id || null),
          recruitment_manager_id: user.recruitment_manager_id || (user.role === 'recruitment_manager' ? user.id : null),
          skills,
          languages,
          previous_companies: previousCompanies,
          summary: record.summary || '',
          notes: record.notes || '',
          data_quality_score: dataQuality,
          missing_data: missingFields,
          import_batch_id: batchId,
          imported_at: new Date().toISOString(),
          imported_by: user.email,
          parsing_status: 'success',
          review_required: dataQuality < 60,
        });

        // ── Create Document record ────────────────────────────────────────────
        if (record.resume_url) {
          await base44.asServiceRole.entities.CandidateDocument.create({
            organization_id: organizationId,
            candidate_id: newCandidate.id,
            candidate_email: newCandidate.email || '',
            doc_type: 'cv',
            filename: record.resume_filename || record.resume_url.split('/').pop() || 'resume',
            file_url: record.resume_url,
            file_size: 0,
            uploaded_by: user.email,
            is_latest_cv: true,
            notes: `ייובא מקובץ: ${fileName || 'import'}`,
          });
        }

        // ── Create Timeline event ─────────────────────────────────────────────
        await base44.asServiceRole.entities.CandidateTimeline.create({
          organization_id: organizationId,
          candidate_id: newCandidate.id,
          candidate_email: newCandidate.email || '',
          event_type: 'imported',
          description: `מועמד יובא ממקור: ${fileName || 'קובץ CSV'}. ציון נתונים: ${dataQuality}%`,
          performed_by: user.email,
          performed_by_name: user.full_name || user.email,
          performed_by_role: 'admin',
          metadata: {
            batch_id: batchId,
            source_file: fileName,
            data_quality_score: dataQuality,
            missing_fields: missingFields,
          },
          is_visible_to_candidate: false,
          is_visible_to_employer: false,
        });

        // ── Create CandidateProfile ───────────────────────────────────────────
        await upsertCandidateProfile(base44, newCandidate, record, true);

        // ── Trigger full pipeline (AI + ATS) async (fire-and-forget) ─────────
        base44.asServiceRole.functions.invoke('processCandidateImport', {
          candidateId: newCandidate.id,
          jobId: record.job_id || null,
        }).catch(() => {});

        successful++;
      } catch (err) {
        failed++;
        errors.push(`${record.full_name}: ${err.message}`);
      }
    }

    // Update batch with results
    await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
      total_records: records.length,
      successful_imports: successful,
      failed_imports: failed,
      duplicate_found: duplicates,
      missing_email: missingEmail,
      missing_phone: missingPhone,
      missing_role: missingRole,
      missing_resume: missingResume,
      status: 'completed',
      processing_completed_at: new Date().toISOString(),
      error_log: errors.join('\n'),
    });

    return Response.json({
      message: `יובאו ${successful} מועמדים. ${duplicates} כפילויות. ${failed} כשלונות.`,
      successful, failed, duplicates,
      missingEmail, missingPhone, missingRole, missingResume,
    });
  } catch (error) {
    // Always mark batch as failed if something crashes mid-run
    if (batchId) {
      await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
        status: 'failed',
        processing_completed_at: new Date().toISOString(),
        error_log: error.message,
      }).catch(() => {});
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── CandidateProfile upsert helper ───────────────────────────────────────────
async function upsertCandidateProfile(base44, candidate, record, isNew) {
  try {
    const skills = record?.skills
      ? record.skills.split(';').map(s => s.trim()).filter(Boolean)
      : (candidate.skills || []);

    const email = candidate.email || record?.email || '';
    const generatedEmail = email || `imported_${candidate.id}@noemail.local`;

    const profileData = {
      user_email: generatedEmail,
      full_name: candidate.full_name || record?.full_name || '',
      phone: candidate.phone || record?.phone || '',
      location: candidate.location || record?.location || '',
      title: candidate.role_name || record?.role_name || '',
      skills,
      experience_years: candidate.experience_years || (record?.experience_years ? parseInt(record.experience_years) : 0),
      desired_salary_min: candidate.desired_salary_min || (record?.desired_salary_min ? parseInt(record.desired_salary_min) : null),
      desired_salary_max: candidate.desired_salary_max || (record?.desired_salary_max ? parseInt(record.desired_salary_max) : null),
      resume_url: candidate.resume_url || record?.resume_url || '',
      is_public: false,
      is_open_to_work: false,
      summary: candidate.summary || record?.summary || '',
    };

    // Check if profile already exists for this email
    const existing = await base44.asServiceRole.entities.CandidateProfile.filter(
      { user_email: generatedEmail }, '', 1
    );

    let profileId;
    let eventDescription;

    if (existing.length > 0) {
      // Update only missing fields
      const existingProfile = existing[0];
      const updates = {};
      for (const [key, val] of Object.entries(profileData)) {
        const existingVal = existingProfile[key];
        const isEmpty = existingVal === null || existingVal === undefined || existingVal === '' ||
          (Array.isArray(existingVal) && existingVal.length === 0);
        if (isEmpty && val && (Array.isArray(val) ? val.length > 0 : true)) {
          updates[key] = val;
        }
      }
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.CandidateProfile.update(existingProfile.id, updates);
      }
      profileId = existingProfile.id;
      eventDescription = `פרופיל מועמד עודכן (${Object.keys(updates).length} שדות)`;
    } else {
      const newProfile = await base44.asServiceRole.entities.CandidateProfile.create(profileData);
      profileId = newProfile.id;
      eventDescription = `פרופיל מועמד נוצר אוטומטית מייבוא CSV`;
    }

    // Timeline event
    await base44.asServiceRole.entities.CandidateTimeline.create({
      candidate_id: candidate.id,
      candidate_email: email,
      event_type: existing.length > 0 ? 'status_changed' : 'imported',
      description: eventDescription,
      performed_by: 'system',
      performed_by_name: 'System',
      performed_by_role: 'system',
      metadata: { profile_id: profileId, data_quality_score: candidate.data_quality_score || 0, source: 'csv_import' },
      is_visible_to_candidate: false,
      is_visible_to_employer: false,
    });

    return profileId;
  } catch (e) {
    // Non-fatal — don't fail the whole import
    return null;
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
