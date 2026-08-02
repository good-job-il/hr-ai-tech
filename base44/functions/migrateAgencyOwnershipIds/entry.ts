import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITY_FIELDS = {
  Candidate: ['recruiter_id', 'team_manager_id', 'recruitment_manager_id'],
  Application: ['recruiter_id', 'assigned_to', 'team_manager_id', 'recruitment_manager_id'],
  Job: ['recruiter_id', 'team_manager_id', 'recruitment_manager_id', 'created_by_user_id'],
  Interview: ['recruiter_id', 'team_manager_id', 'recruitment_manager_id'],
  CompensationPlan: ['recruiter_id', 'team_manager_id', 'recruitment_manager_id'],
  CandidateImportBatch: ['recruiter_id', 'team_manager_id', 'recruitment_manager_id'],
};

function normalizedEmail(value) {
  return typeof value === 'string' && value.includes('@') ? value.trim().toLowerCase() : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'org_admin'].includes(user.role)) {
      return Response.json({ error: 'Org Admin permission required' }, { status: 403 });
    }

    const organizationId = user.organization_id || user.data?.organization_id;
    if (!organizationId) {
      return Response.json({ error: 'Scoped organization context required' }, { status: 403 });
    }

    const { dry_run = true } = await req.json().catch(() => ({}));
    const users = await base44.asServiceRole.entities.User.filter(
      { organization_id: organizationId }, '', 5000
    );
    const userIdByEmail = new Map(
      users
        .filter(candidateUser => candidateUser.id && candidateUser.email)
        .map(candidateUser => [candidateUser.email.trim().toLowerCase(), candidateUser.id])
    );

    const report = {
      organization_id: organizationId,
      dry_run: Boolean(dry_run),
      scanned: 0,
      records_changed: 0,
      fields_changed: 0,
      unresolved: [],
      by_entity: {},
    };

    for (const [entityName, fields] of Object.entries(ENTITY_FIELDS)) {
      const repository = base44.asServiceRole.entities[entityName];
      const records = await repository.filter({ organization_id: organizationId }, '', 5000);
      const entityReport = { scanned: records.length, records_changed: 0, fields_changed: 0 };
      report.scanned += records.length;

      for (const record of records) {
        const updates = {};
        for (const field of fields) {
          const email = normalizedEmail(record[field]);
          if (!email) continue;
          const userId = userIdByEmail.get(email);
          if (!userId) {
            report.unresolved.push({ entity: entityName, id: record.id, field, email });
            continue;
          }
          updates[field] = userId;
        }

        const changedFields = Object.keys(updates).length;
        if (changedFields === 0) continue;
        entityReport.records_changed += 1;
        entityReport.fields_changed += changedFields;
        report.records_changed += 1;
        report.fields_changed += changedFields;
        if (!dry_run) await repository.update(record.id, updates);
      }

      report.by_entity[entityName] = entityReport;
    }

    if (!dry_run) {
      await base44.asServiceRole.functions.invoke('createAuditLog', {
        organization_id: organizationId,
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role,
        entity_type: 'Organization',
        entity_id: organizationId,
        entity_label: 'Agency ownership ID migration',
        action: 'data_migration',
        metadata: report,
      });
    }

    return Response.json(report);
  } catch (error) {
    console.error('[migrateAgencyOwnershipIds]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

