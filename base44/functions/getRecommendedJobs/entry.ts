import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await base44.entities.CandidateProfile.filter({ user_email: user.email });
    if (!profile.length) return Response.json({ jobs: [] });

    const candidateData = profile[0];
    const allJobs = await base44.entities.Job.filter({ is_closed: false });
    
    const savedJobIds = (await base44.entities.SavedJob.filter({ user_email: user.email })).map(j => j.job_id);
    const appliedJobIds = (await base44.entities.Application.filter({ candidate_email: user.email })).map(a => a.job_id);
    
    const relevantJobs = allJobs
      .filter(j => !savedJobIds.includes(j.id) && !appliedJobIds.includes(j.id))
      .slice(0, 10);

    const scoredJobs = await Promise.all(
      relevantJobs.map(async (job) => {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Score match between candidate and job (0-100). Candidate skills: ${candidateData.skills?.join(', ')}. Candidate experience: ${candidateData.experience_years} years. Job: ${job.title}. Description: ${job.description}. Return only a number 0-100.`,
          response_json_schema: { type: 'object', properties: { score: { type: 'number' } } }
        });
        return { ...job, match_score: response.score || 0 };
      })
    );

    return Response.json({
      jobs: scoredJobs.sort((a, b) => b.match_score - a.match_score).slice(0, 5)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});