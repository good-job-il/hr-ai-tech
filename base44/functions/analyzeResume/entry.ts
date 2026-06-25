import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { resumeUrl, jobTitle, jobDescription } = await req.json();

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this resume and provide structured information:\n\nResume URL: ${resumeUrl}\n\nJob Title: ${jobTitle}\nJob Description: ${jobDescription}\n\nProvide: 1) Summary of candidate, 2) Key skills extracted, 3) Years of experience, 4) Match score (0-100) with job, 5) Top 3 reasons for match/mismatch`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          experience_years: { type: 'number' },
          match_score: { type: 'number' },
          match_reasons: { type: 'array', items: { type: 'string' } }
        }
      },
      file_urls: [resumeUrl]
    });

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});