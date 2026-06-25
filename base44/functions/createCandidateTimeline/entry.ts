import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

/**
 * Create timeline event for candidate
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const { candidate_email, candidate_id, event_type, description, metadata, organization_id } = await req.json();

    if (!candidate_email || !event_type || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orgId = organization_id || user?.organization_id || TAASUKA_TOVA_ORG_ID;

    // Create timeline event
    const timeline = await base44.asServiceRole.entities.CandidateTimeline.create({
      candidate_id: candidate_id || null,
      candidate_email,
      event_type,
      description,
      metadata: metadata || {},
      organization_id: orgId,
      performed_by: user?.email || 'system',
      performed_by_name: user?.full_name || user?.email || 'מערכת',
      performed_by_role: user?.role || 'system',
    });

    return Response.json({ success: true, timeline });
  } catch (error) {
    console.error('[createCandidateTimeline] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});