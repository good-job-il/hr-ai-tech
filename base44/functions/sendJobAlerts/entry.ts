import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active alerts
    const alerts = await base44.asServiceRole.entities.JobAlert.filter({ is_active: true });
    if (!alerts.length) return Response.json({ sent: 0 });

    const now = new Date();
    let sent = 0;

    for (const alert of alerts) {
      // Check if we should send (daily = every 24h, weekly = every 7 days)
      if (alert.last_sent) {
        const lastSent = new Date(alert.last_sent);
        const hoursDiff = (now - lastSent) / 3600000;
        if (alert.frequency === 'daily' && hoursDiff < 23) continue;
        if (alert.frequency === 'weekly' && hoursDiff < 167) continue;
      }

      // Find matching jobs created in the last 24h (or 7 days for weekly)
      const hoursBack = alert.frequency === 'weekly' ? 168 : 24;
      const since = new Date(now - hoursBack * 3600000).toISOString();

      let jobs = await base44.asServiceRole.entities.Job.filter({ is_closed: false });
      jobs = jobs.filter(j => new Date(j.created_date) > new Date(since));

      // Filter by keywords
      if (alert.keywords) {
        const kw = alert.keywords.toLowerCase();
        jobs = jobs.filter(j =>
          j.title?.toLowerCase().includes(kw) ||
          j.description?.toLowerCase().includes(kw) ||
          j.category?.toLowerCase().includes(kw)
        );
      }
      if (alert.location) {
        jobs = jobs.filter(j => j.location?.includes(alert.location));
      }
      if (alert.category && alert.category !== 'any') {
        jobs = jobs.filter(j => j.category === alert.category);
      }
      if (alert.job_type && alert.job_type !== 'any') {
        jobs = jobs.filter(j => j.type === alert.job_type);
      }
      if (alert.salary_min) {
        jobs = jobs.filter(j => !j.salary_min || j.salary_min >= alert.salary_min);
      }

      if (!jobs.length) continue;

      const jobList = jobs.slice(0, 10).map(j =>
        `• ${j.title} – ${j.company} | ${j.location || ''} ${j.salary_min ? `| ₪${j.salary_min.toLocaleString()}+` : ''}`
      ).join('\n');

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: alert.user_email,
        subject: `${jobs.length} משרות חדשות מתאימות לך – HeadHunter`,
        body: `שלום,\n\nמצאנו ${jobs.length} משרות חדשות שעשויות לעניין אותך:\n\n${jobList}\n\nלצפייה בכל המשרות: https://headhunter.co.il/jobs\n\nבברכה,\nצוות HeadHunter`
      });

      await base44.asServiceRole.entities.JobAlert.update(alert.id, { last_sent: now.toISOString() });
      sent++;
    }

    return Response.json({ success: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});