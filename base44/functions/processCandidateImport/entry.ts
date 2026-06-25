/**
 * processCandidateImport
 * Full pipeline: Import → CRM → ATS → AI Matching
 *
 * Called after a Candidate entity is created (or during bulk import).
 * Handles:
 *  1. Timeline event (imported)
 *  2. Document record for resume
 *  3. Duplicate detection
 *  4. AI match scoring against open jobs
 *  5. Auto-create Application if job_id provided
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { candidateId, jobId } = body;

    if (!candidateId) {
      return Response.json({ error: 'Missing candidateId' }, { status: 400 });
    }

    // ── 1. Load candidate ──────────────────────────────────────────────────────
    const candidates = await base44.asServiceRole.entities.Candidate.filter({ id: candidateId }, '', 1);
    const candidate = candidates[0];
    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const results = { candidateId, steps: {} };

    // ── 2. Create imported timeline event ─────────────────────────────────────
    try {
      await base44.asServiceRole.entities.CandidateTimeline.create({
        organization_id: candidate.organization_id || TAASUKA_TOVA_ORG_ID,
        candidate_id: candidateId,
        candidate_email: candidate.email || '',
        event_type: 'imported',
        description: `מועמד נייבא למערכת ממקור: ${candidate.source || 'import'}`,
        performed_by: user.email,
        performed_by_name: user.full_name || user.email,
        performed_by_role: user.role || 'admin',
        metadata: {
          source: candidate.source,
          import_batch_id: candidate.import_batch_id,
          data_quality_score: candidate.data_quality_score,
        },
        is_visible_to_candidate: false,
        is_visible_to_employer: false,
      });
      results.steps.timeline = 'created';
    } catch (e) {
      results.steps.timeline = `error: ${e.message}`;
    }

    // ── 3. Create Document record for resume ──────────────────────────────────
    if (candidate.resume_url || candidate.original_resume_url || candidate.converted_resume_url) {
      try {
        const resumeUrl = candidate.converted_resume_url || candidate.resume_url || candidate.original_resume_url;
        const resumeFilename = candidate.converted_resume_filename || candidate.resume_filename || candidate.original_resume_filename || 'resume';

        // Check if document already exists
        const existingDocs = await base44.asServiceRole.entities.CandidateDocument.filter(
          { candidate_id: candidateId, doc_type: 'cv' }, '', 5
        );

        if (existingDocs.length === 0) {
          await base44.asServiceRole.entities.CandidateDocument.create({
            organization_id: candidate.organization_id || TAASUKA_TOVA_ORG_ID,
            candidate_id: candidateId,
            candidate_email: candidate.email || '',
            doc_type: 'cv',
            filename: resumeFilename,
            file_url: resumeUrl,
            file_size: candidate.resume_file_size || 0,
            uploaded_by: candidate.imported_by || user.email,
            is_latest_cv: true,
            notes: `ייובא אוטומטית מ-${candidate.source || 'import'} בתאריך ${new Date().toLocaleDateString('he-IL')}`,
          });
          results.steps.document = 'created';
        } else {
          results.steps.document = 'already_exists';
        }
      } catch (e) {
        results.steps.document = `error: ${e.message}`;
      }
    } else {
      results.steps.document = 'skipped_no_resume';
    }

    // ── 4. Duplicate detection ────────────────────────────────────────────────
    try {
      const RECRUITER_ROLES = ['recruiter', 'email', 'phone', 'name'];
      let duplicateFound = false;

      // Check by email
      if (candidate.email) {
        const byEmail = await base44.asServiceRole.entities.Candidate.filter(
          { email: candidate.email }, '', 5
        );
        const others = byEmail.filter(c => c.id !== candidateId);
        if (others.length > 0) {
          duplicateFound = true;
          await base44.asServiceRole.entities.Candidate.update(candidateId, {
            is_duplicate_suspected: true,
            duplicate_of_id: others[0].id,
          });
          results.steps.duplicate = { found: true, reason: 'email_match', match_id: others[0].id };
        }
      }

      // Check by phone (normalized)
      if (!duplicateFound && candidate.phone) {
        const normalizedPhone = candidate.phone.replace(/\D/g, '');
        const allCandidates = await base44.asServiceRole.entities.Candidate.filter(
          {}, '-created_date', 500
        );
        const phoneMatch = allCandidates.find(c =>
          c.id !== candidateId && c.phone && c.phone.replace(/\D/g, '') === normalizedPhone
        );
        if (phoneMatch) {
          duplicateFound = true;
          await base44.asServiceRole.entities.Candidate.update(candidateId, {
            is_duplicate_suspected: true,
            duplicate_of_id: phoneMatch.id,
          });
          results.steps.duplicate = { found: true, reason: 'phone_match', match_id: phoneMatch.id };
        }
      }

      if (!duplicateFound) {
        results.steps.duplicate = { found: false };
      }
    } catch (e) {
      results.steps.duplicate = `error: ${e.message}`;
    }

    // ── 5. AI Match scoring against open jobs ─────────────────────────────────
    try {
      const openJobs = await base44.asServiceRole.entities.Job.filter(
        { is_closed: false }, '-created_date', 50
      );

      if (openJobs.length > 0 && (candidate.role_name || candidate.domain_name || (candidate.skills || []).length > 0)) {
        // Rule-based scoring (no LLM cost)
        const scoredJobs = openJobs.map(job => {
          let score = 0;
          let reasons = [];

          // Domain match
          if (candidate.domain_id && job.domain_id && candidate.domain_id === job.domain_id) {
            score += 25;
            reasons.push('תחום תואם');
          } else if (candidate.domain_name && job.title &&
            job.title.toLowerCase().includes((candidate.domain_name || '').toLowerCase())) {
            score += 12;
          }

          // Role match
          const cRole = (candidate.role_name || '').toLowerCase();
          const jTitle = (job.title || '').toLowerCase();
          if (cRole && jTitle && (jTitle.includes(cRole) || cRole.includes(jTitle))) {
            score += 25;
            reasons.push('תפקיד תואם');
          } else if (cRole && jTitle) {
            const cWords = new Set(cRole.split(' '));
            const jWords = jTitle.split(' ');
            const overlap = jWords.filter(w => cWords.has(w)).length;
            score += Math.min(15, overlap * 8);
          }

          // Skills match — check required_skills, preferred_skills, ai_keywords, and description
          const skills = (candidate.skills || []).map(s => s.toLowerCase());
          const jobRequiredSkills = (job.required_skills || []).map(s => s.toLowerCase());
          const jobPreferredSkills = (job.preferred_skills || []).map(s => s.toLowerCase());
          const jobKeywords = (job.ai_keywords || []).map(s => s.toLowerCase());
          const jobDesc = (job.description || job.title || '').toLowerCase();

          const matchedRequired = skills.filter(s => jobRequiredSkills.includes(s) || jobDesc.includes(s));
          const matchedPreferred = skills.filter(s => jobPreferredSkills.includes(s));
          const matchedKeywords = skills.filter(s => jobKeywords.includes(s));

          if (matchedRequired.length > 0) {
            score += Math.min(25, matchedRequired.length * 6);
            reasons.push(`כישורים: ${matchedRequired.slice(0, 3).join(', ')}`);
          }
          if (matchedPreferred.length > 0) {
            score += Math.min(10, matchedPreferred.length * 3);
            reasons.push(`preferred: ${matchedPreferred.slice(0, 2).join(', ')}`);
          }
          if (matchedKeywords.length > 0) {
            score += Math.min(5, matchedKeywords.length * 2);
          }

          // Seniority match
          if (job.seniority && job.seniority !== 'any') {
            const seniorityMap = { junior: [0,2], mid: [2,5], senior: [5,10], lead: [6,15], manager: [5,20], director: [10,30] };
            const [minY, maxY] = seniorityMap[job.seniority] || [0, 30];
            const cExp2 = candidate.experience_years || 0;
            if (cExp2 >= minY && cExp2 <= maxY) { score += 10; reasons.push('seniority תואמת'); }
            else if (cExp2 >= minY - 1) { score += 5; }
          }

          // Experience match
          const cExp = candidate.experience_years || 0;
          const jReqExp = job.years_experience_required || job.required_experience || 3;
          if (cExp >= jReqExp) score += 15;
          else if (cExp >= jReqExp - 1) score += 10;

          // Location
          const cLoc = (candidate.location || '').toLowerCase();
          const jLoc = (job.location || '').toLowerCase();
          if (cLoc && jLoc && (cLoc.includes(jLoc) || jLoc.includes(cLoc))) {
            score += 10;
            reasons.push('מיקום תואם');
          }

          // Salary
          const cMin = candidate.desired_salary_min || 0;
          const cMax = candidate.desired_salary_max || 99999;
          const jMin = job.salary_min || 0;
          const jMax = job.salary_max || 99999;
          if (cMax >= jMin && cMin <= jMax) score += 5;

          return {
            job,
            score: Math.min(100, Math.round(score)),
            reason: reasons.join(' | '),
          };
        });

        const topMatches = scoredJobs
          .filter(m => m.score >= 40)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        // Store best match info in candidate notes (don't overwrite data_quality_score)
        if (topMatches.length > 0) {
          const matchNote = `[AI Match] התאמה הטובה ביותר: ${topMatches[0].job.title} (${topMatches[0].score}%)`;
          await base44.asServiceRole.entities.Candidate.update(candidateId, {
            notes: (candidate.notes ? candidate.notes + '\n' : '') + matchNote,
          });
        }

        results.steps.ai_matching = {
          jobs_checked: openJobs.length,
          matches_found: topMatches.length,
          top_score: topMatches[0]?.score || 0,
          top_job: topMatches[0]?.job?.title || null,
        };

        // ── 6. Auto-create Application or suggested match ────────────────────
        // score >= 70 → auto-create Application
        // score 50–69 → save suggested match (notes on candidate), review_required
        // score < 50  → no action

        // ── Threshold rules ──────────────────────────────────────────────────
        // score >= 70 → auto-create Application
        // score 50–69 → suggested_match only (review_required on candidate)
        // score < 50  → no action
        // NOTE: jobId passed explicitly is treated as a hint only — threshold still enforced
        const bestMatch = topMatches.length > 0 ? topMatches[0] : null;
        const bestScore = bestMatch?.score || 0;

        const autoJobId = bestScore >= 70
          ? (jobId && openJobs.find(j => j.id === jobId) ? jobId : bestMatch.job.id)
          : null;
        const suggestedMatch = !autoJobId && bestScore >= 50 ? bestMatch : null;

        if (autoJobId) {
          try {
            const targetJob = openJobs.find(j => j.id === autoJobId) || bestMatch?.job;

            // ── Duplicate Application Prevention ─────────────────────────────
            // ALWAYS check by both candidate_email+job_id before creating
            const existingApps = candidate.email
              ? await base44.asServiceRole.entities.Application.filter(
                  { job_id: autoJobId, candidate_email: candidate.email }, '', 1
                )
              : [];

            if (existingApps.length > 0) {
              // Log duplicate skip to timeline
              await base44.asServiceRole.entities.CandidateTimeline.create({
                candidate_id: candidateId,
                candidate_email: candidate.email || '',
                event_type: 'application_submitted',
                description: `מועמדות כבר קיימת למשרת ${targetJob?.title || autoJobId} — דילוג על כפיל`,
                performed_by: user.email,
                performed_by_name: user.full_name || user.email,
                performed_by_role: 'system',
                metadata: {
                  existing_application_id: existingApps[0].id,
                  job_id: autoJobId,
                  reason: 'duplicate_application_skipped',
                },
                is_visible_to_candidate: false,
                is_visible_to_employer: false,
              });
              results.steps.application = {
                created: false,
                reason: 'duplicate_application_skipped',
                existing_application_id: existingApps[0].id,
              };
            } else if (targetJob) {
              const newApp = await base44.asServiceRole.entities.Application.create({
                organization_id: candidate.organization_id || TAASUKA_TOVA_ORG_ID,
                job_id: autoJobId,
                job_title: targetJob.title,
                company: targetJob.company,
                employer_id: targetJob.employer_id || '',
                candidate_name: candidate.full_name,
                candidate_email: candidate.email || '',
                candidate_phone: candidate.phone || '',
                resume_url: candidate.resume_url || candidate.converted_resume_url || '',
                resume_filename: candidate.resume_filename || '',
                location: candidate.location || '',
                source: candidate.source || 'import',
                status: 'new',
                match_score: bestScore,
                match_reason: bestMatch?.reason || null,
                assigned_to: candidate.recruiter_id || user.email,
              });

              await base44.asServiceRole.entities.CandidateTimeline.create({
                candidate_id: candidateId,
                candidate_email: candidate.email || '',
                event_type: 'application_submitted',
                description: `מועמדות נוצרה אוטומטית למשרת ${targetJob.title} ב-${targetJob.company}`,
                performed_by: user.email,
                performed_by_name: user.full_name || user.email,
                performed_by_role: 'system',
                metadata: { application_id: newApp.id, job_id: autoJobId, job_title: targetJob.title, match_score: bestScore },
                is_visible_to_candidate: false,
                is_visible_to_employer: false,
              });

              results.steps.application = { created: true, app_id: newApp.id, job: targetJob.title, score: bestScore };
            } else {
              results.steps.application = { created: false, reason: 'already_exists' };
            }
          } catch (e) {
            results.steps.application = `error: ${e.message}`;
          }
        } else if (suggestedMatch) {
          // Score 50–69: save suggested match on candidate, mark review_required
          try {
            const suggestedMatches = topMatches.slice(0, 3).map(m => ({
              job_id: m.job.id,
              job_title: m.job.title,
              company: m.job.company,
              score: m.score,
              reason: m.reason,
            }));

            await base44.asServiceRole.entities.Candidate.update(candidateId, {
              review_required: true,
              notes: (candidate.notes ? candidate.notes + '\n' : '') +
                `[AI Suggested Matches] ${suggestedMatches.map(m => `${m.job_title} (${m.score}%)`).join(', ')}`,
            });

            await base44.asServiceRole.entities.CandidateTimeline.create({
              candidate_id: candidateId,
              candidate_email: candidate.email || '',
              event_type: 'status_changed',
              description: `${topMatches.length} התאמות AI מוצעות נמצאו (ציון ${suggestedMatch.score}%). נדרשת בדיקה ידנית.`,
              performed_by: user.email,
              performed_by_name: user.full_name || user.email,
              performed_by_role: 'system',
              metadata: { suggested_matches: suggestedMatches, top_score: suggestedMatch.score },
              is_visible_to_candidate: false,
              is_visible_to_employer: false,
            });

            results.steps.application = { created: false, reason: 'suggested_match', suggested_matches: suggestedMatches, top_score: suggestedMatch.score };
          } catch (e) {
            results.steps.application = { created: false, reason: 'suggested_match_error', error: e.message };
          }
        } else {
          results.steps.application = { created: false, reason: 'score_below_50_no_action', top_score: bestScore };
        }
      } else {
        results.steps.ai_matching = { jobs_checked: openJobs.length, skipped: 'no_candidate_profile_data' };
        results.steps.application = { created: false, reason: 'ai_matching_skipped' };
      }
    } catch (e) {
      results.steps.ai_matching = `error: ${e.message}`;
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});