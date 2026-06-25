/**
 * createApplicationTimeline
 * Backend function to reliably record Application stage changes in ApplicationTimeline.
 * Called from the frontend AFTER a successful Application.update().
 * Running server-side ensures the record is never lost due to browser close / network drop.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      application_id,
      event_type,
      previous_value,
      new_value,
      description,
      performed_by_role,
    } = await req.json();

    if (!application_id || !event_type || !description) {
      return Response.json({ error: 'Missing required fields: application_id, event_type, description' }, { status: 400 });
    }

    const {
      organization_id,
    } = await req.json().catch(() => ({}));

    // Use service role so the record is always written regardless of user RLS
    const timeline = await base44.asServiceRole.entities.ApplicationTimeline.create({
      organization_id: organization_id || TAASUKA_TOVA_ORG_ID,
      application_id,
      event_type,
      previous_value: previous_value || null,
      new_value: new_value || null,
      description,
      performed_by: user.email,
      performed_by_role: performed_by_role || user.role || 'recruiter',
      timestamp: new Date().toISOString(),
    });

    return Response.json({ success: true, timeline });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});