import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { application_id } = await req.json();

    const applications = await base44.asServiceRole.entities.Application.filter({ id: application_id });
    const app = applications[0];
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });

    const jobs = await base44.asServiceRole.entities.Job.filter({ id: app.job_id });
    const job = jobs[0];

    const profiles = await base44.asServiceRole.entities.CandidateProfile.filter({ user_email: app.candidate_email });
    const profile = profiles[0];

    const profileText = profile
      ? `שם: ${profile.full_name}, תפקיד: ${profile.title || ''}, ניסיון: ${profile.experience_years || 0} שנים, כישורים: ${(profile.skills || []).join(', ')}, תיאור: ${profile.summary || ''}`
      : `שם: ${app.candidate_name}, מכתב מוטיבציה: ${app.cover_letter || 'לא צורף'}`;

    const jobText = `תפקיד: ${job?.title || app.job_title}, חברה: ${job?.company || app.company}, תיאור: ${job?.description || ''}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `אתה מערכת AI לגיוס עובדים. דרג את ההתאמה בין המועמד למשרה בסקלה של 0-100.
      
משרה: ${jobText}

מועמד: ${profileText}

החזר JSON בפורמט: { "score": <number 0-100>, "reason": "<הסבר קצר בעברית, 1-2 משפטים>" }`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "number" },
          reason: { type: "string" }
        }
      }
    });

    await base44.asServiceRole.entities.Application.update(app.id, {
      match_score: result.score,
      match_reason: result.reason
    });

    return Response.json({ score: result.score, reason: result.reason });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});