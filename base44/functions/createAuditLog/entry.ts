/**
 * createAuditLog — unified audit logging helper.
 * Call from other functions: base44.functions.invoke('createAuditLog', { ... })
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { organization_id, actor_user_id, actor_email, actor_role,
            entity_type, entity_id, entity_label, action, metadata,
            ip_address, user_agent } = body;

    if (!entity_type || !entity_id || !action) {
      return Response.json({ error: 'entity_type, entity_id, action required' }, { status: 400 });
    }

    const logEntry = {
      organization_id: organization_id || null,
      actor_user_id: actor_user_id || null,
      actor_email: actor_email || null,
      actor_role: actor_role || null,
      entity_type,
      entity_id,
      entity_label: entity_label || null,
      action,
      metadata: metadata || null,
      ip_address: ip_address || req.headers.get('x-forwarded-for') || null,
      user_agent: user_agent || req.headers.get('user-agent') || null,
    };

    const created = await base44.asServiceRole.entities.AuditLog.create(logEntry);
    return Response.json({ success: true, id: created.id });

  } catch (error) {
    console.error('[createAuditLog]', error.message);
    return Response.json({ success: false, error: error.message });
  }
});