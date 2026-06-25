import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const jobId = body.job_id;
    const limit = body.limit || 5;

    if (!jobId) {
      return Response.json({ error: 'job_id required' }, { status: 400 });
    }

    // Get the target job
    const job = await base44.asServiceRole.entities.Job.get(jobId);
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch all active jobs except this one
    const allJobs = await base44.asServiceRole.entities.Job.filter(
      { is_closed: false },
      '-views',
      500
    );

    // Score each job
    const scored = allJobs
      .filter(j => j.id !== jobId)
      .map(j => ({
        ...j,
        score: calculateJobSimilarity(job, j),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return Response.json({ recommendations: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateJobSimilarity(job1, job2) {
  let score = 0;

  // Exact domain match (highest priority)
  if (job1.domain_id && job1.domain_id === job2.domain_id) {
    score += 50;
  }

  // Exact role match
  if (job1.role_id && job1.role_id === job2.role_id) {
    score += 40;
  }

  // Same specialization
  if (job1.specialization_id && job1.specialization_id === job2.specialization_id) {
    score += 20;
  }

  // Same location
  if (job1.location && job1.location === job2.location) {
    score += 15;
  }

  // Same category
  if (job1.category && job1.category === job2.category) {
    score += 10;
  }

  // Title similarity (fuzzy match on key words)
  const words1 = job1.title.toLowerCase().split(/\s+/);
  const words2 = job2.title.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  score += commonWords * 5;

  // Views boost (popular jobs score higher)
  score += (job2.views || 0) * 0.1;

  // Recency boost
  const hoursSinceCreation = (Date.now() - new Date(job2.created_date)) / (1000 * 60 * 60);
  if (hoursSinceCreation < 168) { // Within a week
    score += 5;
  }

  return score;
}