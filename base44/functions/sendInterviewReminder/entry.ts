import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled automation: find all interviews tomorrow that haven't been reminded yet
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const allInterviews = await base44.asServiceRole.entities.Interview.filter(
      { status: 'scheduled', reminder_sent: false }
    );

    let sent = 0;
    for (const interview of allInterviews) {
      if (!interview.date || !interview.candidate_email) continue;
      if (interview.date !== tomorrowStr && interview.date !== todayStr) continue;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: interview.candidate_email,
        subject: `🎯 תזכורת: ראיון ${interview.date === todayStr ? 'היום' : 'מחר'} ${interview.date}`,
        body: `שלום ${interview.candidate_name},\n\nתזכורת לראיון שלך:\n\nתאריך: ${interview.date}\nשעה: ${interview.time || ''}\nסוג: ${interview.type || ''}\n${interview.location_or_link ? `קישור/מקום: ${interview.location_or_link}` : ''}\n\nבהצלחה!`,
      });

      await base44.asServiceRole.entities.Interview.update(interview.id, { reminder_sent: true });
      sent++;
    }

    return Response.json({ success: true, reminders_sent: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});