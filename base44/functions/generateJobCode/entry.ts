/**
 * generateJobCode
 * Called by entity automation when a Job is created.
 * Generates a unique job_code (e.g. "hh247") and apply_email alias.
 *
 * apply_email format: r.rodion2802+hh{N}@gmail.com
 * Uses GMAIL_ALIAS_BASE secret (defaults to r.rodion2802@gmail.com)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALIAS_BASE = Deno.env.get('GMAIL_ALIAS_BASE') || 'r.rodion2802@gmail.com';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { event, data } = body;

    // Only act on job creation; skip if job_code already set
    if (event?.type !== 'create' || data?.job_code) {
      return Response.json({ skipped: true });
    }

    const jobId = event?.entity_id || data?.id;
    if (!jobId) return Response.json({ error: 'No job id' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    // Generate sequential code based on created_date timestamp
    const code = `hh${Date.now().toString(36).toUpperCase().slice(-5)}`;

    // Build alias: headhunter.jobs+hh12345@gmail.com
    const [localPart, domain] = ALIAS_BASE.split('@');
    const applyEmail = `${localPart}+${code}@${domain}`;

    // Build apply_url — public job detail page
    const applyUrl = `https://hire-israel-link.base44.app/jobs/${jobId}`;

    await base44.asServiceRole.entities.Job.update(jobId, {
      job_code: code,
      apply_email: applyEmail,
      apply_url: applyUrl,
    });

    return Response.json({ job_code: code, apply_email: applyEmail, apply_url: applyUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});