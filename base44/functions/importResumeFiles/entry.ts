/**
 * importResumeFiles
 * Resume File Pipeline: PDF/DOC/DOCX → DOCX → Parse → Candidate → CRM → ATS
 *
 * Accepts array of file URLs + metadata.
 * Steps per file:
 *  1. Upload tracking + original file save
 *  2. Convert to DOCX (if needed)
 *  3. Parse resume with LLM (extractAndTranslateResume logic inlined)
 *  4. Duplicate detection (email + phone)
 *  5. Create or update Candidate entity
 *  6. Create CandidateDocument with full metadata
 *  7. Create CandidateTimeline events
 *  8. Trigger processCandidateImport for AI matching + ATS
 *  9. Update batch stats
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPPORTED_TYPES = ['pdf', 'doc', 'docx', 'txt'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'org_admin', 'recruitment_manager', 'team_manager'].includes(user.role)) {
      return Response.json({ error: 'Import permission denied' }, { status: 403 });
    }
    const organizationId = user.organization_id || user.data?.organization_id;
    if (!organizationId) {
      return Response.json({ error: 'Organization context required' }, { status: 403 });
    }

    const body = await req.json();
    // files: [{file_url, filename, file_size?, employer_id?, recruiter_id?}]
    // batchId: optional CandidateImportBatch id
    const { files, batchId, employer_id, recruiter_id } = body;
    let effectiveRecruiterId = null;

    if (recruiter_id) {
      const recruiters = await base44.asServiceRole.entities.User.filter(
        { id: recruiter_id, organization_id: organizationId }, '', 1
      );
      const recruiter = recruiters[0];
      const visibleToTeamManager = user.role !== 'team_manager' || recruiter?.team_manager_id === user.id;
      if (!recruiter || recruiter.role !== 'recruiter' || !visibleToTeamManager) {
        return Response.json({ error: 'Recruiter outside permitted organization/team scope' }, { status: 403 });
      }
      effectiveRecruiterId = recruiter.id;
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return Response.json({ error: 'Missing files array' }, { status: 400 });
    }

    // Update batch to in_progress if provided
    if (batchId) {
      const batches = await base44.asServiceRole.entities.CandidateImportBatch.filter(
        { id: batchId, organization_id: organizationId }, '', 1
      );
      if (batches.length === 0) {
        return Response.json({ error: 'Import batch not found in organization scope' }, { status: 404 });
      }
      await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
        status: 'in_progress',
        processing_started_at: new Date().toISOString(),
        total_records: files.length,
      });
    }

    const results = [];
    let successful = 0, failed = 0, duplicates = 0, conversionFailed = 0, parsingFailed = 0;

    for (const fileEntry of files) {
      const fileResult = {
        filename: fileEntry.filename || 'unknown',
        steps: {},
        candidate_id: null,
        document_id: null,
        errors: [],
      };

      try {
        const fileUrl = fileEntry.file_url;
        const filename = fileEntry.filename || fileUrl.split('/').pop() || 'resume';
        const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z]/g, '');
        const fileType = SUPPORTED_TYPES.includes(ext) ? ext : 'other';

        if (fileType === 'other') {
          fileResult.errors.push(`Unsupported file type: .${ext}`);
          fileResult.steps.upload = 'unsupported_format';
          failed++;
          results.push(fileResult);
          continue;
        }

        fileResult.steps.upload = 'ok';
        fileResult.original_file_url = fileUrl;
        fileResult.original_file_type = fileType;

        // ── Step 2: Convert to DOCX ──────────────────────────────────────────
        let docxUrl = null;
        let docxFilename = null;
        let conversionStatus = 'not_needed';

        if (fileType === 'docx') {
          // Already DOCX — no conversion needed
          docxUrl = fileUrl;
          docxFilename = filename;
          conversionStatus = 'not_needed';
          fileResult.steps.conversion = 'skipped_already_docx';
        } else {
          // Need to convert PDF/DOC/TXT → DOCX
          try {
            const convRes = await base44.asServiceRole.functions.invoke('convertResumeToDocx', {
              source_file_url: fileUrl,
              source_filename: filename,
              source_file_type: fileType,
            });
            if (convRes?.data?.conversion_status === 'success' && convRes?.data?.converted_resume_url) {
              docxUrl = convRes.data.converted_resume_url;
              docxFilename = convRes.data.converted_filename || filename.replace(/\.[^/.]+$/, '') + '_converted.docx';
              conversionStatus = 'success';
              fileResult.steps.conversion = 'success';
            } else {
              throw new Error(convRes?.data?.error || 'Conversion returned no URL');
            }
          } catch (convErr) {
            conversionStatus = 'failed';
            conversionFailed++;
            fileResult.steps.conversion = `failed: ${convErr.message}`;
            fileResult.errors.push(`Conversion failed: ${convErr.message}`);
            // Continue with original file for parsing (best-effort)
            docxUrl = fileUrl;
            docxFilename = filename;
          }
        }

        // ── Step 3: Parse resume with LLM ────────────────────────────────────
        let parsedData = null;
        let parsingStatus = 'pending';
        let parsingError = null;

        const parseUrl = docxUrl || fileUrl;

        try {
          const parseResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `קרא את קובץ קורות החיים המצורף וחלץ את המידע המדויק הבא בפורמט JSON.
אם הטקסט באנגלית — תרגם שם, תפקיד, סיכום לעברית. שאר השדות — כמות שהם.
החזר רק JSON תקין ללא הסברים.

{
  "full_name": "שם מלא",
  "phone": "מספר טלפון בפורמט ישראלי",
  "email": "כתובת אימייל",
  "location": "עיר/אזור מגורים",
  "current_role": "תפקיד נוכחי או אחרון",
  "experience_years": 0,
  "summary": "תקציר מקצועי קצר",
  "skills": ["כישור1","כישור2"],
  "languages": ["עברית","אנגלית"],
  "education": "השכלה גבוהה ביותר",
  "work_history": [{"company":"שם חברה","role":"תפקיד","years":"2018-2022","description":"תיאור קצר"}],
  "salary_expectation": null,
  "availability": null,
  "original_language": "he/en/other"
}`,
            file_urls: [parseUrl],
            response_json_schema: {
              type: 'object',
              properties: {
                full_name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
                location: { type: 'string' },
                current_role: { type: 'string' },
                experience_years: { type: 'number' },
                summary: { type: 'string' },
                skills: { type: 'array', items: { type: 'string' } },
                languages: { type: 'array', items: { type: 'string' } },
                education: { type: 'string' },
                work_history: { type: 'array', items: { type: 'object' } },
                salary_expectation: { type: 'string' },
                availability: { type: 'string' },
                original_language: { type: 'string' },
              }
            }
          });

          if (parseResult && parseResult.full_name) {
            parsedData = parseResult;
            parsingStatus = 'success';
            fileResult.steps.parsing = 'success';
          } else {
            parsingStatus = 'partial';
            parsedData = parseResult || {};
            fileResult.steps.parsing = 'partial';
          }
        } catch (parseErr) {
          parsingStatus = 'failed';
          parsingError = parseErr.message;
          parsingFailed++;
          fileResult.steps.parsing = `failed: ${parseErr.message}`;
          fileResult.errors.push(`Parsing failed: ${parseErr.message}`);
        }

        // ── Step 4: Duplicate detection ──────────────────────────────────────
        const parsedEmail = (parsedData?.email || '').toLowerCase().trim();
        const parsedPhone = (parsedData?.phone || '').replace(/\D/g, '');

        let isDuplicate = false;
        let duplicateOfId = null;

        if (parsedEmail) {
          const byEmail = await base44.asServiceRole.entities.Candidate.filter(
            { organization_id: organizationId, email: parsedEmail }, '', 1
          );
          if (byEmail.length > 0) {
            isDuplicate = true;
            duplicateOfId = byEmail[0].id;
            fileResult.steps.duplicate_check = `duplicate_email: ${parsedEmail}`;
          }
        }

        if (!isDuplicate && parsedPhone && parsedPhone.length >= 7) {
          const byPhone = await base44.asServiceRole.entities.Candidate.filter(
            { organization_id: organizationId, phone: parsedData.phone }, '', 1
          );
          if (byPhone.length > 0) {
            isDuplicate = true;
            duplicateOfId = byPhone[0].id;
            fileResult.steps.duplicate_check = `duplicate_phone: ${parsedPhone}`;
          }
        }

        if (isDuplicate) {
          duplicates++;
          fileResult.steps.duplicate_check = fileResult.steps.duplicate_check || 'duplicate_found';
          fileResult.duplicate_of_id = duplicateOfId;

          // Create a timeline event on the EXISTING candidate
          await base44.asServiceRole.entities.CandidateTimeline.create({
            organization_id: organizationId,
            candidate_id: duplicateOfId,
            candidate_email: parsedEmail || '',
            event_type: 'duplicate_detected',
            description: `נמצא קובץ כפול: ${filename}`,
            performed_by: user.email,
            performed_by_name: user.full_name || user.email,
            performed_by_role: 'system',
            metadata: { duplicate_filename: filename, batch_id: batchId || null },
            is_visible_to_candidate: false,
            is_visible_to_employer: false,
          }).catch(() => {});

          results.push(fileResult);
          continue;
        }

        if (!isDuplicate) {
          fileResult.steps.duplicate_check = 'no_duplicate';
        }

        // ── Step 5: Create Candidate ──────────────────────────────────────────
        const previousCompanies = (parsedData?.work_history || []).map(w => w.company).filter(Boolean);

        // data quality score
        let dq = 0;
        if (parsedData?.full_name) dq += 20;
        if (parsedEmail) dq += 20;
        if (parsedData?.phone) dq += 15;
        if (parsedData?.current_role) dq += 15;
        if ((parsedData?.skills || []).length > 0) dq += 15;
        if ((parsedData?.work_history || []).length > 0) dq += 15;

        const missingFields = [];
        if (!parsedEmail) missingFields.push('email');
        if (!parsedData?.phone) missingFields.push('phone');
        if (!parsedData?.current_role) missingFields.push('role');
        if (parsingStatus === 'failed') missingFields.push('parsed_resume');
        if (!parsedData?.full_name || !parsedData.full_name.trim()) missingFields.push('full_name');

        // Fallback name — NEVER use raw filename
        const candidateName = (parsedData?.full_name && parsedData.full_name.trim())
          ? parsedData.full_name.trim()
          : 'מועמד לא מזוהה';

        const newCandidate = await base44.asServiceRole.entities.Candidate.create({
          organization_id: organizationId,
          full_name: candidateName,
          email: parsedEmail || '',
          phone: parsedData?.phone || '',
          location: parsedData?.location || '',
          role_name: parsedData?.current_role || '',
          experience_years: parsedData?.experience_years || 0,
          skills: parsedData?.skills || [],
          languages: parsedData?.languages || [],
          previous_companies: previousCompanies,
          summary: parsedData?.summary || '',
          source: 'upload',
          status: 'new',
          employer_id: employer_id || fileEntry.employer_id || '',
          recruiter_id: effectiveRecruiterId,
          team_manager_id: user.role === 'team_manager' ? user.id : (user.team_manager_id || null),
          recruitment_manager_id: user.recruitment_manager_id || (user.role === 'recruitment_manager' ? user.id : null),
          resume_url: docxUrl || fileUrl,
          original_resume_url: fileUrl,
          original_resume_filename: filename,
          original_file_type: fileType,
          converted_resume_url: conversionStatus === 'success' ? docxUrl : '',
          converted_resume_filename: conversionStatus === 'success' ? docxFilename : '',
          resume_filename: docxFilename || filename,
          resume_file_size: fileEntry.file_size || 0,
          resume_uploaded_at: new Date().toISOString(),
          resume_upload_source: 'manual',
          conversion_status: conversionStatus,
          parsing_status: parsingStatus,
          parsing_confidence: parsingStatus === 'success' ? 85 : parsingStatus === 'partial' ? 50 : 0,
          data_quality_score: dq,
          missing_data: missingFields,
          review_required: dq < 60 || parsingStatus === 'failed',
          import_batch_id: batchId || null,
          imported_at: new Date().toISOString(),
          imported_by: user.email,
        });

        fileResult.candidate_id = newCandidate.id;
        fileResult.steps.candidate_created = 'ok';

        // ── Step 5b: Create CandidateProfile (public-facing profile) ─────────
        try {
          await base44.asServiceRole.entities.CandidateProfile.create({
            user_email: parsedEmail || `imported_${newCandidate.id}@noemail.local`,
            full_name: candidateName,
            phone: parsedData?.phone || '',
            location: parsedData?.location || '',
            title: parsedData?.current_role || '',
            summary: parsedData?.summary || '',
            skills: parsedData?.skills || [],
            experience_years: parsedData?.experience_years || 0,
            education: parsedData?.education || '',
            experience: (parsedData?.work_history || []).map(w => ({
              company: w.company || '',
              role: w.role || '',
              years: w.years || '',
              description: w.description || '',
            })),
            desired_salary_min: null,
            desired_salary_max: null,
            is_public: false,
            is_open_to_work: false,
            resume_url: docxUrl || fileUrl,
          });
          fileResult.steps.candidate_profile = 'created';
        } catch (profileErr) {
          fileResult.steps.candidate_profile = `failed: ${profileErr.message}`;
        }

        // ── Step 6: Create CandidateDocument ─────────────────────────────────
        const doc = await base44.asServiceRole.entities.CandidateDocument.create({
          organization_id: organizationId,
          candidate_id: newCandidate.id,
          candidate_email: parsedEmail || '',
          doc_type: 'cv',
          filename: docxFilename || filename,
          file_url: docxUrl || fileUrl,
          original_file_url: fileUrl,
          original_file_type: fileType,
          original_filename: filename,
          docx_url: conversionStatus !== 'failed' ? docxUrl : null,
          docx_filename: docxFilename || null,
          file_size: fileEntry.file_size || 0,
          uploaded_by: user.email,
          uploaded_at: new Date().toISOString(),
          is_latest_cv: true,
          conversion_status: conversionStatus,
          conversion_error: conversionStatus === 'failed' ? fileResult.steps.conversion : null,
          parsing_status: parsingStatus,
          parsing_error: parsingError || null,
          parsed_data: parsedData || null,
          import_batch_id: batchId || null,
          notes: `ייובא מקובץ ${fileType.toUpperCase()} ב-${new Date().toLocaleDateString('he-IL')}`,
        });

        fileResult.document_id = doc.id;
        fileResult.steps.document_created = 'ok';

        // ── Step 7: Timeline events ───────────────────────────────────────────
        const tlBase = {
          organization_id: organizationId,
          candidate_id: newCandidate.id,
          candidate_email: parsedEmail || '',
          performed_by: user.email,
          performed_by_name: user.full_name || user.email,
          performed_by_role: 'system',
          is_visible_to_candidate: false,
          is_visible_to_employer: false,
        };

        // resume_uploaded
        await base44.asServiceRole.entities.CandidateTimeline.create({
          ...tlBase,
          event_type: 'resume_uploaded',
          description: `קובץ ${fileType.toUpperCase()} הועלה: ${filename}`,
          metadata: { filename, file_type: fileType, file_url: fileUrl, batch_id: batchId || null },
        }).catch(() => {});

        // resume_converted
        if (fileType !== 'docx') {
          await base44.asServiceRole.entities.CandidateTimeline.create({
            ...tlBase,
            event_type: 'resume_converted',
            description: conversionStatus === 'success'
              ? `קורות חיים הומרו ל-DOCX בהצלחה`
              : `המרה ל-DOCX נכשלה: ${fileResult.steps.conversion}`,
            metadata: { conversion_status: conversionStatus, docx_url: docxUrl, original_type: fileType },
          }).catch(() => {});
        }

        // parsing event
        await base44.asServiceRole.entities.CandidateTimeline.create({
          ...tlBase,
          event_type: parsingStatus === 'success' ? 'parsing_completed' : 'parsing_failed',
          description: parsingStatus === 'success'
            ? `קורות חיים נותחו בהצלחה. שדות שנחלצו: שם, ${parsedEmail ? 'email' : ''} ${parsedData?.phone ? 'טלפון' : ''} ${(parsedData?.skills || []).length} כישורים`
            : `parsing נכשל: ${parsingError || 'שגיאה לא ידועה'}`,
          metadata: { parsing_status: parsingStatus, fields_extracted: Object.keys(parsedData || {}).length },
        }).catch(() => {});

        // candidate created
        await base44.asServiceRole.entities.CandidateTimeline.create({
          ...tlBase,
          event_type: 'imported',
          description: `מועמד ${candidateName} נוצר ממקובץ קורות חיים. ציון איכות: ${dq}%`,
          metadata: { batch_id: batchId || null, data_quality: dq, missing_fields: missingFields },
        }).catch(() => {});

        fileResult.steps.timeline = 'ok';

        // ── Step 8: Trigger AI matching + ATS ────────────────────────────────
        base44.asServiceRole.functions.invoke('processCandidateImport', {
          candidateId: newCandidate.id,
          jobId: fileEntry.job_id || null,
        }).catch(() => {});

        fileResult.steps.ai_pipeline = 'triggered';
        successful++;

      } catch (fileErr) {
        failed++;
        fileResult.errors.push(fileErr.message);
        fileResult.steps.overall = `error: ${fileErr.message}`;
        console.error(`[importResumeFiles] Error processing ${fileEntry.filename}:`, fileErr);
      }

      results.push(fileResult);
    }

    // ── Update batch stats ────────────────────────────────────────────────────
    if (batchId) {
      const errors = results
        .filter(r => r.errors.length > 0)
        .map(r => `${r.filename}: ${r.errors.join(', ')}`)
        .join('\n');

      await base44.asServiceRole.entities.CandidateImportBatch.update(batchId, {
        total_records: files.length,
        successful_imports: successful,
        failed_imports: failed,
        duplicate_found: duplicates,
        conversion_failures: conversionFailed,
        parsing_failures: parsingFailed,
        status: 'completed',
        processing_completed_at: new Date().toISOString(),
        error_log: errors || null,
        summary: { successful, failed, duplicates, conversionFailed, parsingFailed },
      });
    }

    return Response.json({
      message: `עובדו ${files.length} קבצים. ${successful} נקלטו. ${duplicates} כפילויות. ${failed} כשלונות.`,
      successful, failed, duplicates, conversionFailed, parsingFailed,
      results,
    });

  } catch (error) {
    console.error('[importResumeFiles] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
