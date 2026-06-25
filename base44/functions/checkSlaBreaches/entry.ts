/**
 * checkSlaBreaches
 * Scheduled cron job — runs every hour.
 * Scans all open Application records and fires SLA breach notifications
 * when a candidate has been in a stage longer than the allowed SLA hours.
 * Uses service role so it can run without an authenticated user session.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STAGE_SLA = {
  new: 24,
  screening: 48,
  phone_interview: 72,
  professional_interview: 96,
  client_stage: 120,
};

const STAGE_LABELS = {
  new: 'חדש', screening: 'סינון ראשוני', phone_interview: 'ראיון טלפוני',
  professional_interview: 'ראיון מקצועי', client_stage: 'שלב לקוח',
};

const OPEN_STATUSES = Object.keys(STAGE_SLA);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin to trigger manually, or allow system (no user) for cron
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    // Fetch all open applications (not hired/rejected)
    const apps = await base44.asServiceRole.entities.Application.list('-created_date', 1000);
    const openApps = apps.filter(a => OPEN_STATUSES.includes(a.status));

    const now = Date.now();
    const breaches = [];
    const notifications = [];

    for (const app of openApps) {
      const slaHours = STAGE_SLA[app.status];
      if (!slaHours || !app.stage_entered_at) continue;

      const hoursInStage = (now - new Date(app.stage_entered_at).getTime()) / 3600000;
      if (hoursInStage < slaHours) continue;

      const candidateName = app.candidate_name || 'מועמד';
      const stageLabel = STAGE_LABELS[app.status] || app.status;
      const hoursOver = Math.round(hoursInStage - slaHours);

      breaches.push({ app_id: app.id, candidate_name: candidateName, stage: app.status, hours_in_stage: Math.round(hoursInStage), sla_hours: slaHours });

      // Determine recipients
      const recipients = new Set();
      if (app.assigned_to) recipients.add(app.assigned_to);
      if (app.recruiter_id) recipients.add(app.recruiter_id);

      for (const email of recipients) {
        if (!email) continue;
        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            recipient_email: email,
            type: 'job_closed',
            title: `⏰ SLA חריגה: ${candidateName} — ${stageLabel}`,
            content: `${candidateName} נמצא בשלב "${stageLabel}" כבר ${Math.round(hoursInStage)} שעות (מעל ה-SLA של ${slaHours} שעות). חריגה של ${hoursOver} שעות.`,
            metadata: {
              application_id: app.id,
              candidate_name: candidateName,
              stage: app.status,
              hours_in_stage: Math.round(hoursInStage),
              sla_hours: slaHours,
              hours_over: hoursOver,
              type: 'sla_breach',
            },
            is_read: false,
          }).catch(() => null)
        );
      }
    }

    // Fire all notifications in parallel
    await Promise.allSettled(notifications);

    return Response.json({
      success: true,
      checked: openApps.length,
      breaches_found: breaches.length,
      notifications_sent: notifications.length,
      breaches,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});