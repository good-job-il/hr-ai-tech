import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Soft-deletes a candidate (sets is_deleted=true, deleted_at, deleted_by).
 * Hard-deletes all related records (notes, tags, comms, etc.) as before.
 * Logs a delete AuditLog entry.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['admin', 'recruitment_manager', 'team_manager', 'recruiter'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { candidate_id } = await req.json();
    if (!candidate_id) {
      return Response.json({ error: 'candidate_id required' }, { status: 400 });
    }

    const db = base44.asServiceRole;

    const candidate = await db.entities.Candidate.get(candidate_id);
    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Fetch related records in parallel
    const [notesList, interviews, timeline, documents, tags, communications,
           appsByEmail, appsByName] = await Promise.all([
      db.entities.CandidateNote.filter({ candidate_id }),
      db.entities.Interview.filter({ candidate_id }),
      db.entities.CandidateTimeline.filter({ candidate_id }),
      db.entities.CandidateDocument.filter({ candidate_id }),
      db.entities.CandidateTag.filter({ candidate_id }),
      db.entities.CommunicationLog.filter({ candidate_id }),
      candidate.email ? db.entities.Application.filter({ candidate_email: candidate.email }) : Promise.resolve([]),
      candidate.full_name ? db.entities.Application.filter({ candidate_name: candidate.full_name }) : Promise.resolve([]),
    ]);

    // Deduplicate applications
    const appMap = new Map();
    [...appsByEmail, ...appsByName].forEach(a => appMap.set(a.id, a));
    const candidateApplications = Array.from(appMap.values());

    // Delete ApplicationTimeline rows for each application
    await Promise.all(
      candidateApplications.map(app =>
        db.entities.ApplicationTimeline.filter({ application_id: app.id })
          .then(rows => Promise.all(rows.map(r => db.entities.ApplicationTimeline.delete(r.id))))
      )
    );

    // Hard-delete all related entities
    await Promise.all([
      ...candidateApplications.map(a => db.entities.Application.delete(a.id)),
      ...notesList.map(n => db.entities.CandidateNote.delete(n.id)),
      ...interviews.map(i => db.entities.Interview.delete(i.id)),
      ...timeline.map(t => db.entities.CandidateTimeline.delete(t.id)),
      ...documents.map(d => db.entities.CandidateDocument.delete(d.id)),
      ...tags.map(t => db.entities.CandidateTag.delete(t.id)),
      ...communications.map(c => db.entities.CommunicationLog.delete(c.id)),
    ]);

    // Soft-delete the Candidate itself
    await db.entities.Candidate.update(candidate_id, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    });

    // Audit log — fire and forget
    base44.functions.invoke('createAuditLog', {
      organization_id: candidate.organization_id || null,
      actor_user_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      entity_type: 'Candidate',
      entity_id: candidate_id,
      entity_label: candidate.full_name,
      action: 'delete',
      metadata: {
        applications_deleted: candidateApplications.length,
        notes_deleted: notesList.length,
        documents_deleted: documents.length,
      },
    }).catch(e => console.warn('[deleteCandidate] audit warn:', e.message));

    console.log(`[deleteCandidate] Soft-deleted candidate ${candidate_id}, hard-deleted related records`);

    return Response.json({ success: true });

  } catch (error) {
    console.error('[deleteCandidate] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});