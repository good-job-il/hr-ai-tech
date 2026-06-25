/**
 * emailIntakeHandler
 * Triggered by Gmail webhook (connector automation) on every new message.
 *
 * Flow:
 * 1. Read new message + attachments from Gmail
 * 2. Extract job_code from the TO address alias (e.g. headhunter.jobs+hhABC12@gmail.com)
 * 3. Look up matching Job
 * 4. Download attachment (CV) → upload to Base44 storage
 * 5. Extract candidate data from CV via LLM
 * 6. Duplicate detection (email / phone / name)
 * 7. Create/update Candidate + CandidateDocument + Application + CandidateTimeline
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);

    const messageIds = body.data?.new_message_ids ?? [];
    console.log(`[emailIntakeHandler] body.data keys: ${JSON.stringify(Object.keys(body.data || {}))}, messageIds: ${JSON.stringify(messageIds)}`);
    if (!messageIds.length) {
      return Response.json({ skipped: true, reason: 'no new messages' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const results = [];

    for (const messageId of messageIds) {
      console.log(`[emailIntakeHandler] Processing messageId: ${messageId}`);
      try {
        const result = await processMessage(messageId, authHeader, base44, req);
        results.push({ messageId, ...result });
      } catch (err) {
        console.error(`[emailIntakeHandler] Failed message ${messageId}:`, err.message);
        results.push({ messageId, error: err.message });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    console.error('[emailIntakeHandler] Fatal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function processMessage(messageId, authHeader, base44, req) {
  // 1. Fetch full message
  const msgRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: authHeader }
  );
  if (!msgRes.ok) throw new Error(`Gmail fetch failed: ${msgRes.status}`);
  const message = await msgRes.json();
  console.log(`[emailIntakeHandler] Message payload mimeType: ${message.payload?.mimeType}, parts count: ${message.payload?.parts?.length ?? 0}`);

  // 2. Extract headers
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const toHeader = getHeader('To');
  const fromHeader = getHeader('From');
  const subject = getHeader('Subject');

  console.log(`[emailIntakeHandler] Processing: from=${fromHeader}, to=${toHeader}, subject=${subject}`);

  // 3. Extract job_code from alias in To header
  // Supports: "headhunter.jobs+hhABC12@gmail.com" or "Name <...+hhABC12@...>"
  const aliasMatch = toHeader.match(/\+([a-zA-Z0-9]+)@/);
  const jobCode = aliasMatch ? aliasMatch[1] : null;

  // GUARD: if no job_code alias in To address, skip — not a CV submission email
  if (!jobCode) {
    console.log(`[emailIntakeHandler] Skipped — no job_code alias in To: ${toHeader}`);
    return { status: 'skipped', reason: 'no_job_code_alias', to: toHeader };
  }

  let job = null;
  const jobs = await base44.asServiceRole.entities.Job.filter({ job_code: jobCode }, '-created_date', 1);
  job = jobs[0] || null;

  // GUARD: if job_code doesn't match any real job, skip entirely — no candidate created
  if (!job) {
    console.log(`[emailIntakeHandler] Skipped — job_code=${jobCode} not found in DB`);
    return { status: 'skipped', reason: 'job_not_found', job_code: jobCode };
  }

  console.log(`[emailIntakeHandler] job_code=${jobCode}, job=${job.id}`);

  // 4. Extract sender email + name
  const senderEmailMatch = fromHeader.match(/<(.+?)>/) || fromHeader.match(/([^\s]+@[^\s]+)/);
  const senderEmail = senderEmailMatch ? senderEmailMatch[1].trim() : fromHeader.trim();
  const senderName = fromHeader.replace(/<.*>/, '').replace(/"/g, '').trim() || senderEmail;

  // 5. Find CV attachment
  const attachment = findAttachment(message.payload);
  console.log(`[emailIntakeHandler] findAttachment result: ${attachment ? attachment.filename + ' / ' + attachment.mimeType : 'null'}`);
  let resumeUrl = null;
  let resumeFilename = null;

  if (attachment) {
    // Download attachment data
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
      console.log(`[emailIntakeHandler] Attachment binary length: ${binary.length}, mimeType: ${attachment?.mimeType}, filename: ${attachment?.filename}`);
      if (binary.length > 0) {
        const mimeType = attachment.mimeType || 'application/octet-stream';
        resumeFilename = attachment.filename || `cv_${messageId}.pdf`;

        try {
          // Upload using File object (SDK expects UploadFile / File, not raw Blob)
          const file = new File([binary], resumeFilename, { type: mimeType });
          const sdkUpload = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          resumeUrl = sdkUpload?.file_url || null;
          console.log(`[emailIntakeHandler] Uploaded CV: ${resumeUrl}`);
        } catch (uploadErr) {
          console.warn('[emailIntakeHandler] Upload failed:', uploadErr.message);
        }
      } else {
        console.warn('[emailIntakeHandler] Attachment binary is empty, skipping upload');
      }
    }
  }

  // 6. Extract candidate info from CV (or fall back to email sender info)
  let parsed = {
    full_name: senderName,
    email: senderEmail,
    phone: null,
    location: null,
    skills: [],
    experience_years: null,
    summary: null,
  };

  if (resumeUrl) {
    try {
      const extractRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `קרא את קובץ קורות החיים המצורף וחלץ את הנתונים הבאים בדיוק:
        - שם מלא (full_name)
        - מייל (email) 
        - טלפון (phone)
        - עיר מגורים (location)
        - כישורים (skills) - רשימה
        - שנות ניסיון (experience_years) - מספר
        - תקציר קצר (summary)
        אם אין מידע — השאר null.`,
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
          }
        }
      });
      // Merge: prefer CV data, fall back to email sender
      parsed = {
        full_name: extractRes.full_name || senderName,
        email: extractRes.email || senderEmail,
        phone: extractRes.phone || null,
        location: extractRes.location || null,
        skills: extractRes.skills || [],
        experience_years: extractRes.experience_years || null,
        summary: extractRes.summary || null,
      };
      console.log(`[emailIntakeHandler] Parsed CV: name=${parsed.full_name}, email=${parsed.email}`);
    } catch (llmErr) {
      console.warn('[emailIntakeHandler] LLM extraction failed, using email data:', llmErr.message);
    }
  }

  // 7. Duplicate detection
  let existingCandidate = null;
  let isDuplicate = false;

  if (parsed.email) {
    const byEmail = await base44.asServiceRole.entities.Candidate.filter({ email: parsed.email }, '-created_date', 1);
    if (byEmail.length > 0) {
      existingCandidate = byEmail[0];
      isDuplicate = true;
      console.log(`[emailIntakeHandler] Duplicate found by email: ${existingCandidate.id}`);
    }
  }

  if (!isDuplicate && parsed.phone) {
    const allCandidates = await base44.asServiceRole.entities.Candidate.list('-created_date', 500);
    const normPhone = parsed.phone.replace(/\D/g, '');
    const byPhone = allCandidates.find(c => c.phone && c.phone.replace(/\D/g, '') === normPhone);
    if (byPhone) {
      existingCandidate = byPhone;
      isDuplicate = true;
      console.log(`[emailIntakeHandler] Duplicate found by phone: ${existingCandidate.id}`);
    }
  }

  // 8. Create or update Candidate
  let candidate;
  if (isDuplicate && existingCandidate) {
    candidate = existingCandidate;
    // Update resume if new one uploaded
    if (resumeUrl) {
      await base44.asServiceRole.entities.Candidate.update(candidate.id, {
        resume_url: resumeUrl,
        resume_filename: resumeFilename,
        is_duplicate_suspected: true,
      });
    }
  } else {
    candidate = await base44.asServiceRole.entities.Candidate.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      full_name: parsed.full_name,
      email: parsed.email,
      phone: parsed.phone || '',
      location: parsed.location || '',
      skills: parsed.skills || [],
      experience_years: parsed.experience_years || 0,
      summary: parsed.summary || '',
      resume_url: resumeUrl || '',
      resume_filename: resumeFilename || '',
      source: 'import',
      status: 'new',
      parsing_status: resumeUrl ? 'success' : 'failed',
    });
    console.log(`[emailIntakeHandler] Created candidate: ${candidate.id}`);
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
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'system_email_intake',
      is_latest_cv: true,
      conversion_status: 'not_needed',
      parsing_status: 'success',
    });
  }

  // 10. Create Application (if job found)
  let application = null;
  if (job && candidate?.id) {
    // Check for existing application
    const existing = await base44.asServiceRole.entities.Application.filter(
      { job_id: job.id, candidate_email: candidate.email },
      '-created_date', 1
    );
    if (existing.length === 0) {
      application = await base44.asServiceRole.entities.Application.create({
        organization_id: TAASUKA_TOVA_ORG_ID,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        employer_id: job.employer_id || '',
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        candidate_phone: candidate.phone || '',
        resume_url: resumeUrl || '',
        resume_filename: resumeFilename || '',
        source: 'other',
        status: 'new',
      });
      console.log(`[emailIntakeHandler] Created application: ${application.id}`);
    } else {
      application = existing[0];
      console.log(`[emailIntakeHandler] Application already exists: ${application.id}`);
    }
  }

  // 11. CandidateTimeline event
  if (candidate?.id) {
    await base44.asServiceRole.entities.CandidateTimeline.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      candidate_id: candidate.id,
      candidate_email: candidate.email,
      event_type: 'imported',
      description: isDuplicate
        ? `קורות חיים חדשים התקבלו במייל (${subject || 'ללא נושא'}) — מועמד קיים, עודכן`
        : `מועמד חדש הגיע ממייל נכנס לכתובת ${toHeader} (${subject || 'ללא נושא'})`,
      performed_by: 'system',
      performed_by_name: 'מערכת Email Intake',
      performed_by_role: 'system',
      metadata: {
        job_id: job?.id || null,
        job_code: jobCode,
        email_message_id: messageId,
        is_duplicate: isDuplicate,
        has_attachment: !!resumeUrl,
      },
      is_visible_to_candidate: false,
      is_visible_to_employer: false,
    });
  }

  // 12. Mark email as read
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
    is_duplicate: isDuplicate,
    candidate_id: candidate?.id,
    application_id: application?.id,
    job_id: job?.id,
    job_code: jobCode,
    has_resume: !!resumeUrl,
  };
}

// Find first PDF/DOC/DOCX attachment recursively in message parts
// Only returns parts that have an actual filename (real attachments, not body text)
function findAttachment(payload) {
  if (!payload) return null;
  const RESUME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (
    payload.filename && payload.filename.length > 0 &&
    (RESUME_TYPES.includes(payload.mimeType) || payload.body?.size > 0)
  ) {
    return payload;
  }
  for (const part of (payload.parts || [])) {
    const found = findAttachment(part);
    if (found) return found;
  }
  return null;
}

// Convert base64url (Gmail format) to Uint8Array
function base64urlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}