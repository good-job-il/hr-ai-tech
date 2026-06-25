/**
 * migrateUsersToOrg
 * One-time migration: sets organization_id on all internal users.
 * Admin-only.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

// Roles that belong to the agency org
const INTERNAL_ROLES = ['recruiter', 'team_manager', 'recruitment_manager', 'org_admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list('', 200);

    const results = [];

    for (const u of allUsers) {
      // Skip users that already have org id
      if (u.organization_id === TAASUKA_TOVA_ORG_ID) {
        results.push({ id: u.id, email: u.email, status: 'already_set' });
        continue;
      }

      // Assign internal roles + admins that belong to תעסוקה טובה (identified by company_id field)
      const isInternal = INTERNAL_ROLES.includes(u.role);
      const isOrgAdmin = u.role === 'admin' && (u.company_id === 'תעסוקה טובה' || u.email === 'r.rodion2802@gmail.com');

      if (isInternal || isOrgAdmin) {
        await base44.asServiceRole.entities.User.update(u.id, {
          organization_id: TAASUKA_TOVA_ORG_ID,
        });
        results.push({ id: u.id, email: u.email, role: u.role, status: 'updated' });
      } else {
        results.push({ id: u.id, email: u.email, role: u.role, status: 'skipped' });
      }
    }

    const updated = results.filter(r => r.status === 'updated').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const already = results.filter(r => r.status === 'already_set').length;

    console.log(`[migrateUsersToOrg] updated=${updated}, skipped=${skipped}, already_set=${already}`);
    return Response.json({ success: true, updated, skipped, already_set: already, results });

  } catch (error) {
    console.error('[migrateUsersToOrg] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});