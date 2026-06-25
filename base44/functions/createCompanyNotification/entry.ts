import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Mode A: called from frontend with explicit fields
    // Mode B: entity automation payload { event, data } for Application or Interview
    const isEntityAutomation = !!body?.event?.entity_name;

    if (isEntityAutomation) {
      const entityName = body.event?.entity_name;
      const entityId = body.event?.entity_id;
      const entityData = body.data;

      if (entityName === 'Application') {
        // Notify the employer (job poster) about new application
        const jobId = entityData?.job_id;
        let recipientEmail = entityData?.employer_id || null;

        // If no employer_id on application, look it up from the Job
        if (!recipientEmail && jobId) {
          const jobs = await base44.asServiceRole.entities.Job.filter({ id: jobId }, '-created_date', 1);
          recipientEmail = jobs[0]?.employer_id || null;
        }

        if (!recipientEmail) {
          return Response.json({ skipped: true, reason: 'no employer to notify' });
        }

        const notification = await base44.asServiceRole.entities.Notification.create({
          recipient_email: recipientEmail,
          type: 'new_application',
          title: `מועמדות חדשה: ${entityData?.candidate_name || 'מועמד'}`,
          content: `${entityData?.candidate_name || 'מועמד'} הגיש מועמדות למשרת ${entityData?.job_title || ''}`,
          metadata: { application_id: entityId, job_id: jobId },
          is_read: false,
        });
        return Response.json(notification);
      }

      if (entityName === 'Interview') {
        // Notify recruiter who scheduled the interview
        const recipientEmail = entityData?.recruiter_id || null;
        if (!recipientEmail) {
          return Response.json({ skipped: true, reason: 'no recruiter to notify' });
        }
        const notification = await base44.asServiceRole.entities.Notification.create({
          recipient_email: recipientEmail,
          type: 'interview_scheduled',
          title: `ראיון נקבע: ${entityData?.candidate_name || 'מועמד'}`,
          content: `ראיון עם ${entityData?.candidate_name || 'מועמד'} ב-${entityData?.date || ''} ${entityData?.time || ''}`,
          metadata: { interview_id: entityId, job_id: entityData?.job_id },
          is_read: false,
        });
        return Response.json(notification);
      }

      return Response.json({ skipped: true, reason: `unsupported entity: ${entityName}` });
    }

    // Mode A — direct call from frontend with explicit fields
    const payload = body?.data || body;
    const { type, targetEmail, title, content, metadata } = payload;

    if (!targetEmail || !type || !title) {
      return Response.json({ skipped: true, reason: 'missing required fields' });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      recipient_email: targetEmail,
      type,
      title,
      content: content || '',
      metadata: metadata || {},
      is_read: false,
    });

    return Response.json(notification);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});