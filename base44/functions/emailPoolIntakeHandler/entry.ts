/**
 * emailPoolIntakeHandler
 * Triggered by Gmail webhook (connector automation) on every new message to +pool alias.
 *
 * CRITICAL: Each attachment in an email is processed INDEPENDENTLY:
 * - Separate LLM context per attachment
 * - Separate duplicate detection per attachment
 * - Separate Candidate creation per attachment
 * - Name mismatch detection (filename vs extracted name)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    // PERMISSION CHECK: Only internal recruitment team can process pool emails
    const user = await base44.auth.me();
    if (!user || !['admin', 'recruitment_manager', 'team_manager', 'recruiter'].includes(user.role)) {
      console.error('[emailPoolIntakeHandler] Unauthorized access:', user?.role || 'no_user');
      return Response.json({ error: 'Unauthorized: Internal recruitment access only' }, { status: 403 });
    }

    const messageIds = body.data?.new_message_ids ?? [];
    console.log(`[emailPoolIntakeHandler] messageIds: ${JSON.stringify(messageIds)}`);
    if (!messageIds.length) {
      return Response.json({ skipped: true, reason: 'no new messages' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const results = [];

    for (const messageId of messageIds) {
      console.log(`[emailPoolIntakeHandler] Processing messageId: ${messageId}`);
      try {
        const result = await processPoolMessage(messageId, authHeader, base44, req);
        results.push({ messageId, ...result });
      } catch (err) {
        console.error(`[emailPoolIntakeHandler] Failed message ${messageId}:`, err.message);
        results.push({ messageId, error: err.message });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    console.error('[emailPoolIntakeHandler] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processPoolMessage(messageId, authHeader, base44, req) {
  // 1. Fetch full message
  const msgRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: authHeader }
  );
  if (!msgRes.ok) throw new Error(`Gmail fetch failed: ${msgRes.status}`);
  const message = await msgRes.json();

  // 2. Extract headers
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const toHeader = getHeader('To');
  const fromHeader = getHeader('From');
  const subject = getHeader('Subject');

  console.log(`[emailPoolIntakeHandler] Processing: from=${fromHeader}, to=${toHeader}, subject=${subject}`);

  // 3. Detect +pool alias (General Pool, no job_code)
  const aliasMatch = toHeader.match(/\+([a-zA-Z0-9]+)@/);
  const alias = aliasMatch ? aliasMatch[1] : null;

  // Only process if alias is 'pool' or no alias at all (fallback to pool logic)
  if (alias && alias.toLowerCase() !== 'pool') {
    console.log(`[emailPoolIntakeHandler] Skipped — not a pool email, alias=${alias}`);
    return { status: 'skipped', reason: 'not_pool_alias', alias };
  }

  console.log(`[emailPoolIntakeHandler] Pool intake: alias=${alias || 'none'}`);

  // 4. Extract sender email + name
  const senderEmailMatch = fromHeader.match(/<(.+?)>/) || fromHeader.match(/([^\s]+@[^\s]+)/);
  const senderEmail = senderEmailMatch ? senderEmailMatch[1].trim() : fromHeader.trim();
  const senderName = fromHeader.replace(/<.*>/, '').replace(/"/g, '').trim() || senderEmail;

  // 5. Find ALL CV attachments (process each independently!)
  const attachments = findAllAttachments(message.payload);
  console.log(`[emailPoolIntakeHandler] Found ${attachments.length} attachments`);

  const results = [];

  // CRITICAL: Process EACH attachment as a SEPARATE candidate
  for (const attachment of attachments) {
    console.log(`[emailPoolIntakeHandler] Processing attachment: ${attachment.filename}`);
    
    let resumeUrl = null;
    let resumeFilename = attachment.filename || `cv_${messageId}.pdf`;
    let originalFileType = null;

    // Download attachment
    let attachmentData = attachment.body?.data;
    if (!attachmentData && attachment.body?.attachmentId) {
      const attRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachment.body.attachmentId}`,
        { headers: authHeader }
      );
      if (attRes.ok) {
        const attBody = await attRes.json();
        attachmentData = attBody.data;
      }
    }

    if (attachmentData) {
      const binary = base64urlToUint8Array(attachmentData);
      if (binary.length > 0) {
        const mimeType = attachment.mimeType || 'application/octet-stream';
        
        // Determine file type
        if (mimeType.includes('pdf')) originalFileType = 'pdf';
        else if (mimeType.includes('msword')) originalFileType = 'doc';
        else if (mimeType.includes('openxmlformats')) originalFileType = 'docx';
        else if (mimeType.includes('plain')) originalFileType = 'txt';
        else originalFileType = 'other';

        const file = new File([binary], resumeFilename, { type: mimeType });
        const sdkUpload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        resumeUrl = sdkUpload?.file_url || null;
        console.log(`[emailPoolIntakeHandler] Uploaded CV: ${resumeUrl}`);
      }
    }

    // 6. Extract candidate info from THIS CV ONLY (no context mixing!)
    let parsed = {
      full_name: senderName,
      email: senderEmail,
      phone: null,
      location: null,
      skills: [],
      experience_years: null,
      summary: null,
      domain_name: null,
      role_name: null,
      desired_salary_min: null,
      desired_salary_max: null,
      languages: [],
      previous_companies: [],
    };

    if (resumeUrl) {
      try {
        const extractRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `קרא את קורות החיים המצורפים (קובץ: ${resumeFilename}) וחלץ את הנתונים הבאים.
          חשוב מאוד: חלץ רק מידע מקובץ זה בלבד.

          כללי חילוץ קריטיים:
          1. שם מלא (full_name) - השם מהכותרת/ראש קורות החיים
          2. מייל (email) - האימייל מפרטי הקשר בראש קורות החיים בלבד (לא מגוף הטקסט)
          3. טלפון (phone) - מספר הטלפון מפרטי הקשר בראש קורות החיים בלבד
          4. עיר מגורים (location) - העיר הנוכחית של המועמד
          5. תפקיד אחרון (role_name) - התפקיד מניסיון העבודה האחרון/הנוכחי (המשרה הראשונה ברשימת הניסיון), לא קורסים
          6. תחום מקצועי (domain_name) - התחום לפי ניסיון העבודה העיקרי (למשל: "שרשרת אספקה", "פיתוח תוכנה", "שיווק")
          7. כישורים (skills) - כישורים מניסיון העבודה בפועל (כלים, תוכנות, מתודולוגיות שבהן השתמש/ה בעבודה). אל תכלול כישורים מקורסים בלבד
          8. שנות ניסיון (experience_years) - חשב לפי תאריכי העסקה בניסיון העבודה (סה"כ שנות עבודה בפועל)
          9. תקציר (summary) - 2-3 שורות המתארות את הניסיון והתחום המקצועי העיקרי
          10. שפות (languages) - שפות מדוברות
          11. חברות קודמות (previous_companies) - רשימת שמות חברות מניסיון העבודה
          12. ציפיות שכר (desired_salary_min, desired_salary_max) - אם מוזכר בקורות החיים, בש"ח

          אם אין מידע — השאר null או מערך ריק.`,
          file_urls: [resumeUrl],
          response_json_schema: {
            type: 'object',
            properties: {
              full_name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              location: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              experience_years: { type: 'number' },
              summary: { type: 'string' },
              domain_name: { type: 'string' },
              role_name: { type: 'string' },
              desired_salary_min: { type: 'number' },
              desired_salary_max: { type: 'number' },
              languages: { type: 'array', items: { type: 'string' } },
              previous_companies: { type: 'array', items: { type: 'string' } },
            }
          }
        });
        
        parsed = {
          full_name: extractRes.full_name || senderName,
          email: extractRes.email || senderEmail,
          phone: extractRes.phone || null,
          location: extractRes.location || null,
          skills: extractRes.skills || [],
          experience_years: extractRes.experience_years || null,
          summary: extractRes.summary || null,
          domain_name: extractRes.domain_name || null,
          role_name: extractRes.role_name || null,
          desired_salary_min: extractRes.desired_salary_min || null,
          desired_salary_max: extractRes.desired_salary_max || null,
          languages: extractRes.languages || [],
          previous_companies: extractRes.previous_companies || [],
        };
        console.log(`[emailPoolIntakeHandler] Parsed CV ${resumeFilename}: name=${parsed.full_name}, email=${parsed.email}`);
      } catch (llmErr) {
        console.warn(`[emailPoolIntakeHandler] LLM extraction failed for ${resumeFilename}:`, llmErr.message);
      }
    }

    // 7. Duplicate detection - EXTRA SAFE MODE for multiple attachments
    let existingCandidate = null;
    let isDuplicate = false;
    let duplicateReason = null;
    let duplicateConfidence = 0;
    let reviewRequired = false;

    // Extract name from filename for comparison
    const filenameNameMatch = resumeFilename.match(/של\s+(.+?)\.docx/);
    const filenameName = filenameNameMatch ? filenameNameMatch[1].trim() : null;

    // ── Validate phone & email before using for dup-detection ────────────────
    const emailFromCV = parsed.email && parsed.email !== senderEmail;
    const phoneFromCV = parsed.phone && parsed.phone.trim().length > 0;

    const phoneIsGeneric = isGenericPhone(parsed.phone);
    const emailIsGeneric = isGenericEmail(parsed.email);

    let ignoredPhoneReason = null;
    let ignoredEmailReason = null;
    let duplicateFieldsUsed = [];

    if (phoneIsGeneric && phoneFromCV) {
      ignoredPhoneReason = 'placeholder_or_generic_phone';
      console.log(`[emailPoolIntakeHandler] Phone ignored for dup-detection (generic): ${parsed.phone}`);
    }
    if (emailIsGeneric && emailFromCV) {
      ignoredEmailReason = 'fake_or_placeholder_email_domain';
      console.log(`[emailPoolIntakeHandler] Email ignored for dup-detection (generic): ${parsed.email}`);
    }

    // Check if phone is shared among too many candidates (>2 = generic)
    let phoneSharedCount = 0;
    if (phoneFromCV && !phoneIsGeneric) {
      phoneSharedCount = await phoneUsageCount(parsed.phone, base44);
      if (phoneSharedCount > 2) {
        ignoredPhoneReason = `phone_appears_in_${phoneSharedCount}_candidates`;
        console.log(`[emailPoolIntakeHandler] Phone ignored — shared by ${phoneSharedCount} candidates: ${parsed.phone}`);
      }
    }

    const canUseEmail = emailFromCV && !emailIsGeneric;
    const canUsePhone = phoneFromCV && !phoneIsGeneric && phoneSharedCount <= 2;

    // ── Contact quality check → review_required if no reliable contact info ──
    const senderEmailIsGeneric = isGenericEmail(senderEmail);
    const hasValidEmail = canUseEmail || (!emailIsGeneric && parsed.email) || (!senderEmailIsGeneric && senderEmail);
    const hasValidPhone = canUsePhone;

    let contactReviewReason = null;
    if (!hasValidEmail && !hasValidPhone) {
      contactReviewReason = 'no_valid_email_and_no_valid_phone';
    } else if (!hasValidEmail) {
      contactReviewReason = ignoredEmailReason ? `email_ignored_${ignoredEmailReason}` : 'no_valid_email';
    } else if (!hasValidPhone) {
      contactReviewReason = ignoredPhoneReason ? `phone_ignored_${ignoredPhoneReason}` : 'no_valid_phone';
    }

    // ── EMAIL-based dup-detection (only if email is valid & non-generic) ─────
    if (canUseEmail) {
      const byEmail = await base44.asServiceRole.entities.Candidate.filter({ email: parsed.email }, '-created_date', 1);
      if (byEmail.length > 0) {
        existingCandidate = byEmail[0];
        if (filenameName && filenameName !== existingCandidate.full_name &&
            !filenameName.includes(existingCandidate.full_name) &&
            !existingCandidate.full_name.includes(filenameName)) {
          console.log(`[emailPoolIntakeHandler] Name mismatch on email match: "${filenameName}" vs "${existingCandidate.full_name}" - new candidate`);
          reviewRequired = true;
          isDuplicate = false;
        } else {
          isDuplicate = true;
          duplicateReason = 'email_match';
          duplicateConfidence = 95;
          duplicateFieldsUsed.push('email');
          console.log(`[emailPoolIntakeHandler] Duplicate by email: ${existingCandidate.id}`);
        }
      }
    }

    // ── PHONE-based dup-detection (only if phone is valid & non-generic & non-shared) ─
    if (!isDuplicate && !reviewRequired && canUsePhone) {
      const allCandidates = await base44.asServiceRole.entities.Candidate.list('-created_date', 500);
      const normPhone = parsed.phone.replace(/\D/g, '');
      const byPhone = allCandidates.find(c => c.phone && c.phone.replace(/\D/g, '') === normPhone);
      if (byPhone) {
        existingCandidate = byPhone;
        if (filenameName && filenameName !== existingCandidate.full_name &&
            !filenameName.includes(existingCandidate.full_name) &&
            !existingCandidate.full_name.includes(filenameName)) {
          console.log(`[emailPoolIntakeHandler] Name mismatch on phone match: "${filenameName}" vs "${existingCandidate.full_name}" - new candidate`);
          reviewRequired = true;
          isDuplicate = false;
        } else {
          isDuplicate = true;
          duplicateReason = 'phone_match';
          duplicateConfidence = 90;
          duplicateFieldsUsed.push('phone');
          console.log(`[emailPoolIntakeHandler] Duplicate by phone: ${existingCandidate.id}`);
        }
      }
    }

    // ── If neither email nor phone is usable for dup-detection ────────────────
    if (!isDuplicate && !reviewRequired && !canUseEmail && !canUsePhone) {
      console.log(`[emailPoolIntakeHandler] No reliable identifier for dup-detection — new candidate, no dup flag`);
      // Don't mark as duplicate — just create fresh candidate, no review_required for this reason alone
    }

    // Multiple attachments in same email → review required
    if (!isDuplicate && attachments.length > 1) {
      console.log(`[emailPoolIntakeHandler] Multiple attachments (${attachments.length}) - review_required`);
      reviewRequired = true;
    }

    // Fake/placeholder contact data → review required
    if (!isDuplicate && contactReviewReason) {
      console.log(`[emailPoolIntakeHandler] Contact review required: ${contactReviewReason}`);
      reviewRequired = true;
    }

    // 8. VALIDATION: Ensure organization_id is present
    if (!TAASUKA_TOVA_ORG_ID) {
      throw new Error('OWNERSHIP_VALIDATION_FAILED: organization_id is required for Candidate creation');
    }

    // Create or update Candidate
    let candidate;
    
    if (isDuplicate && existingCandidate && !reviewRequired) {
      candidate = existingCandidate;
      
      // High confidence - safe to update existing
      const updateData = {};
      if (resumeUrl) {
        updateData.resume_url = resumeUrl;
        updateData.resume_filename = resumeFilename;
        updateData.original_file_type = originalFileType;
      }
      if (parsed.skills?.length > 0) updateData.skills = parsed.skills;
      if (parsed.experience_years) updateData.experience_years = parsed.experience_years;
      if (parsed.summary) updateData.summary = parsed.summary;
      if (parsed.domain_name) updateData.domain_name = parsed.domain_name;
      if (parsed.role_name) updateData.role_name = parsed.role_name;
      if (parsed.desired_salary_min) updateData.desired_salary_min = parsed.desired_salary_min;
      if (parsed.desired_salary_max) updateData.desired_salary_max = parsed.desired_salary_max;
      if (parsed.languages?.length > 0) updateData.languages = parsed.languages;
      if (parsed.previous_companies?.length > 0) updateData.previous_companies = parsed.previous_companies;
      
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Candidate.update(candidate.id, updateData);
      }
    } else {
      // Create new candidate (not duplicate OR review required)
      candidate = await base44.asServiceRole.entities.Candidate.create({
        organization_id: TAASUKA_TOVA_ORG_ID,
        full_name: parsed.full_name,
        email: parsed.email || senderEmail,
        phone: parsed.phone || '',
        location: parsed.location || '',
        skills: parsed.skills || [],
        experience_years: parsed.experience_years || 0,
        summary: parsed.summary || '',
        domain_name: parsed.domain_name || null,
        role_name: parsed.role_name || null,
        desired_salary_min: parsed.desired_salary_min || null,
        desired_salary_max: parsed.desired_salary_max || null,
        languages: parsed.languages || [],
        previous_companies: parsed.previous_companies || [],
        resume_url: resumeUrl || '',
        resume_filename: resumeFilename || '',
        original_file_type: originalFileType || null,
        source: 'pool',
        status: 'new',
        parsing_status: resumeUrl ? 'success' : 'failed',
        is_duplicate_suspected: isDuplicate || (reviewRequired && !!existingCandidate),
        review_required: reviewRequired,
        duplicate_of_id: (isDuplicate || reviewRequired) && existingCandidate ? existingCandidate.id : null,
      });
      console.log(`[emailPoolIntakeHandler] Created candidate: ${candidate.id}${reviewRequired ? ' (review_required)' : ''}`);
    }

    // 9. Create CandidateDocument
    if (resumeUrl && candidate?.id) {
      await base44.asServiceRole.entities.CandidateDocument.create({
        organization_id: TAASUKA_TOVA_ORG_ID,
        candidate_id: candidate.id,
        candidate_email: candidate.email,
        doc_type: 'cv',
        filename: resumeFilename,
        file_url: resumeUrl,
        original_filename: resumeFilename,
        original_file_type: originalFileType,
        uploaded_at: new Date().toISOString(),
        uploaded_by: 'system_pool_intake',
        is_latest_cv: true,
        conversion_status: 'not_needed',
        parsing_status: 'success',
      });
    }

    // 10. CandidateTimeline event
    if (candidate?.id) {
      await base44.asServiceRole.entities.CandidateTimeline.create({
        organization_id: TAASUKA_TOVA_ORG_ID,
        candidate_id: candidate.id,
        candidate_email: candidate.email,
        event_type: 'imported',
        description: reviewRequired
          ? `קורות חיים חדשים התקבלו במאגר הכללי (${resumeFilename}) — מועמד חדש נוצר עם חשד לכפילות (review_required)`
          : `מועמד חדש נכנס למאגר הכללי ממייל (${resumeFilename})`,
        performed_by: 'system',
        performed_by_name: 'מערכת Pool Intake',
        performed_by_role: 'system',
        metadata: {
          source: 'general_pool',
          email_message_id: messageId,
          attachment_filename: resumeFilename,
          is_duplicate: isDuplicate,
          duplicate_reason: duplicateReason,
          duplicate_confidence: duplicateConfidence,
          review_required: reviewRequired,
          has_resume: !!resumeUrl,
          parsing_confidence: parsed.skills?.length > 0 ? 80 : 50,
          extracted_email: parsed.email,
          extracted_phone: parsed.phone,
          sender_email: senderEmail,
          filename_extracted_name: filenameName,
          ignored_phone_reason: ignoredPhoneReason,
          ignored_email_reason: ignoredEmailReason,
          review_required_reason: contactReviewReason || (attachments.length > 1 ? 'multiple_attachments' : null),
          duplicate_fields_used: duplicateFieldsUsed,
          phone_shared_count: phoneSharedCount > 0 ? phoneSharedCount : undefined,
        },
        is_visible_to_candidate: false,
        is_visible_to_employer: false,
      });
    }

    results.push({
      status: 'success',
      is_duplicate: isDuplicate && !reviewRequired,
      review_required: reviewRequired,
      duplicate_reason: duplicateReason,
      duplicate_confidence: duplicateConfidence,
      candidate_id: candidate?.id,
      candidate_name: candidate?.full_name,
      candidate_email: candidate?.email,
      extracted_email: parsed.email,
      extracted_phone: parsed.phone,
      sender_email: senderEmail,
      attachment_filename: resumeFilename,
      has_resume: !!resumeUrl,
      review_required_reason: contactReviewReason || null,
    });
  }

  // 11. Mark email as read
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    }
  );

  return {
    status: 'success',
    attachments_processed: results.length,
    results: results,
  };
}

// ── Phone & Email validation helpers ────────────────────────────────────────

// Generic / placeholder phone patterns to ignore for dup-detection
const PLACEHOLDER_PHONES = new Set([
  '0501234567', '0541234567', '0521234567', '0531234567', '0581234567',
  '0500000000', '0540000000', '0520000000', '0000000000', '0000000',
  '123456789', '1234567890', '000000000',
]);

// Suspicious phone pattern: repeating digits, sequential, all-same
function isGenericPhone(phone) {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return true;
  if (PLACEHOLDER_PHONES.has(digits)) return true;
  // All same digit: 0000000000, 1111111111
  if (/^(\d)\1{7,}$/.test(digits)) return true;
  // Sequential: 1234567890, 0987654321
  const seq = '0123456789012345678901234567890';
  const seqRev = '9876543210987654321098765432109';
  if (seq.includes(digits) || seqRev.includes(digits)) return true;
  return false;
}

// Fake/placeholder email domains to ignore for dup-detection
const FAKE_EMAIL_DOMAINS = new Set([
  'example.com', 'example.co.il', 'example.org', 'example.net',
  'test.com', 'test.co.il', 'test.org', 'test.net',
  'fake.com', 'placeholder.com', 'noreply.com', 'dummy.com',
  'mail.com', 'email.com', 'domain.com', 'domain.co.il',
]);

function isGenericEmail(email) {
  if (!email) return true;
  const lower = email.toLowerCase();
  const domain = lower.split('@')[1] || '';
  if (FAKE_EMAIL_DOMAINS.has(domain)) return true;
  // local part looks like placeholder
  const local = lower.split('@')[0];
  if (['example', 'test', 'fake', 'placeholder', 'noreply', 'dummy', 'user', 'abigail', 'ilia.noodleman'].some(p => local === p)) return true;
  return false;
}

// Count how many existing candidates share this phone (to detect shared/generic phones)
async function phoneUsageCount(phone, base44) {
  if (!phone) return 0;
  const digits = phone.replace(/\D/g, '');
  const all = await base44.asServiceRole.entities.Candidate.list('-created_date', 500);
  return all.filter(c => c.phone && c.phone.replace(/\D/g, '') === digits).length;
}

// Find ALL attachments (for processing multiple CVs in one email)
function findAllAttachments(payload) {
  if (!payload) return [];
  const RESUME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const attachments = [];
  
  if (
    payload.filename && payload.filename.length > 0 &&
    (RESUME_TYPES.includes(payload.mimeType) || payload.body?.size > 0)
  ) {
    attachments.push(payload);
  }
  
  for (const part of (payload.parts || [])) {
    const found = findAllAttachments(part);
    attachments.push(...found);
  }
  
  return attachments;
}

// Convert base64url to Uint8Array
function base64urlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}