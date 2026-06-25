/**
 * sendCandidateToEmployer
 * Sends a candidate profile to an employer via real email.
 * Creates CommunicationLog + CandidateTimeline event on success.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // PERMISSION CHECK: Only internal recruitment team can send candidates to employers
    if (!['admin', 'recruitment_manager', 'team_manager', 'recruiter'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized: Internal recruitment access only' }, { status: 403 });
    }

    const {
      candidateId,
      to,
      cc,
      subject,
      recruiterNote,
      candidateName,
      candidateEmail,
      jobTitle,
      jobId, // optional job_id for logging
      attachmentUrls, // array of { url, filename, doc_type }
    } = await req.json();

    if (!to || !candidateId || !candidateName) {
      return Response.json({ error: 'Missing required fields: to, candidateId, candidateName' }, { status: 400 });
    }

    // Build email body
    const attachmentList = (attachmentUrls || [])
      .map(a => `• ${a.filename || a.doc_type || 'קובץ'}: ${a.url}`)
      .join('\n');

    const body = `שלום,

מצורפת מועמדות עבור${jobTitle ? ` המשרה: ${jobTitle}` : ''}

שם המועמד: ${candidateName}
${candidateEmail ? `אימייל: ${candidateEmail}` : ''}

${recruiterNote ? `הערת מגייס:\n${recruiterNote}\n` : ''}
${attachmentList ? `\nקישורי מסמכים:\n${attachmentList}` : ''}

בברכה,
${user.full_name || user.email}
HeadHunter ATS`;

    // Send email via platform integration
    await base44.integrations.Core.SendEmail({
      to,
      subject: subject || `מועמדות: ${candidateName}${jobTitle ? ` — ${jobTitle}` : ''}`,
      body,
      from_name: user.full_name || 'HeadHunter',
    });

    // Log to CommunicationLog
    await base44.asServiceRole.entities.CommunicationLog.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      candidate_id: candidateId,
      candidate_email: candidateEmail || '',
      channel: 'email',
      direction: 'outbound',
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      subject: subject || `מועמדות: ${candidateName}`,
      content: body,
      status: 'sent',
      related_job_id: jobId || null,
    });

    // Timeline event
    await base44.asServiceRole.entities.CandidateTimeline.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      candidate_id: candidateId,
      candidate_email: candidateEmail || '',
      event_type: 'sent_to_employer',
      description: `מועמד נשלח ל-${to}${jobTitle ? ` עבור: ${jobTitle}` : ''}`,
      performed_by: user.email,
      performed_by_name: user.full_name || user.email,
      performed_by_role: user.role || 'recruiter',
      metadata: {
        to,
        cc: cc || '',
        job_title: jobTitle || '',
        attachments_count: (attachmentUrls || []).length,
        attachment_types: (attachmentUrls || []).map(a => a.doc_type),
      },
      is_visible_to_candidate: false,
      is_visible_to_employer: true,
    });

    // Audit log — fire and forget
    base44.functions.invoke('createAuditLog', {
      organization_id: TAASUKA_TOVA_ORG_ID,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      entity_type: 'Candidate',
      entity_id: candidateId,
      entity_label: candidateName,
      action: 'send_to_employer',
      metadata: { to, job_title: jobTitle || null, job_id: jobId || null },
    }).catch(e => console.warn('[sendCandidateToEmployer] audit warn:', e.message));

    return Response.json({ success: true, message: `אימייל נשלח בהצלחה אל ${to}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});