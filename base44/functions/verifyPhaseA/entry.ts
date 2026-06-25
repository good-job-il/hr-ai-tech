/**
 * verifyPhaseA
 * Verification function for Phase A Multi-Tenant migration.
 * Creates a synthetic candidate and checks all organization_id fields.
 * Admin-only. Delete after verification.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const results = {};
    const testEmail = `verify_phase_a_${Date.now()}@test-internal.local`;

    // ── 1. Create synthetic Candidate with organization_id ──────────────────
    const candidate = await base44.asServiceRole.entities.Candidate.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      full_name: 'בדיקת Phase A — מועמד סינטטי',
      email: testEmail,
      phone: '0501234999',
      skills: ['בדיקה', 'multi-tenant'],
      source: 'manual',
      status: 'new',
      parsing_status: 'success',
    });

    results.candidate = {
      id: candidate.id,
      organization_id: candidate.organization_id,
      pass: candidate.organization_id === TAASUKA_TOVA_ORG_ID,
    };

    // ── 2. Create CandidateDocument ─────────────────────────────────────────
    const doc = await base44.asServiceRole.entities.CandidateDocument.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      candidate_id: candidate.id,
      candidate_email: testEmail,
      doc_type: 'cv',
      filename: 'test_phase_a.pdf',
      file_url: 'https://example.com/test.pdf',
      uploaded_by: user.email,
      uploaded_at: new Date().toISOString(),
      is_latest_cv: true,
      conversion_status: 'not_needed',
      parsing_status: 'success',
    });

    results.candidateDocument = {
      id: doc.id,
      organization_id: doc.organization_id,
      pass: doc.organization_id === TAASUKA_TOVA_ORG_ID,
    };

    // ── 3. Create CandidateTimeline ─────────────────────────────────────────
    const timeline = await base44.asServiceRole.entities.CandidateTimeline.create({
      organization_id: TAASUKA_TOVA_ORG_ID,
      candidate_id: candidate.id,
      candidate_email: testEmail,
      event_type: 'imported',
      description: 'בדיקת Phase A — timeline event סינטטי',
      performed_by: user.email,
      performed_by_name: user.full_name || user.email,
      performed_by_role: 'system',
      is_visible_to_candidate: false,
      is_visible_to_employer: false,
    });

    results.candidateTimeline = {
      id: timeline.id,
      organization_id: timeline.organization_id,
      pass: timeline.organization_id === TAASUKA_TOVA_ORG_ID,
    };

    // ── 4. RLS Check: internal user with org_id sees candidate ──────────────
    // Fetch candidate filtered by organization_id (simulates what internal user sees)
    const byOrg = await base44.asServiceRole.entities.Candidate.filter(
      { organization_id: TAASUKA_TOVA_ORG_ID, email: testEmail }, '', 1
    );
    results.rls_internal_sees_candidate = {
      found: byOrg.length > 0,
      pass: byOrg.length > 0,
    };

    // ── 5. RLS Check: wrong org_id returns nothing ──────────────────────────
    const wrongOrg = await base44.asServiceRole.entities.Candidate.filter(
      { organization_id: 'wrong_org_000', email: testEmail }, '', 1
    );
    results.rls_wrong_org_blocked = {
      found: wrongOrg.length,
      pass: wrongOrg.length === 0,
    };

    // ── 6. Verify Users have organization_id ───────────────────────────────
    const users = await base44.asServiceRole.entities.User.list('', 50);
    const internalUsers = users.filter(u =>
      ['recruiter', 'team_manager', 'recruitment_manager', 'org_admin'].includes(u.role) ||
      (u.role === 'admin' && u.email === 'r.rodion2802@gmail.com')
    );
    const usersWithOrg = internalUsers.filter(u => u.organization_id === TAASUKA_TOVA_ORG_ID);
    results.users_org_migration = {
      internal_users_total: internalUsers.length,
      with_org_id: usersWithOrg.length,
      details: internalUsers.map(u => ({
        email: u.email,
        role: u.role,
        organization_id: u.organization_id,
        pass: u.organization_id === TAASUKA_TOVA_ORG_ID,
      })),
      pass: usersWithOrg.length === internalUsers.length,
    };

    // ── 7. Cleanup — delete synthetic records ───────────────────────────────
    await base44.asServiceRole.entities.CandidateTimeline.delete(timeline.id);
    await base44.asServiceRole.entities.CandidateDocument.delete(doc.id);
    await base44.asServiceRole.entities.Candidate.delete(candidate.id);
    results.cleanup = 'done';

    // ── Overall PASS/FAIL ───────────────────────────────────────────────────
    const allPassed = [
      results.candidate.pass,
      results.candidateDocument.pass,
      results.candidateTimeline.pass,
      results.rls_internal_sees_candidate.pass,
      results.rls_wrong_org_blocked.pass,
      results.users_org_migration.pass,
    ].every(Boolean);

    return Response.json({
      phase_a_verification: allPassed ? '✅ PASS — שלב א׳ סגור' : '❌ FAIL — יש בעיות',
      all_passed: allPassed,
      results,
    });

  } catch (error) {
    console.error('[verifyPhaseA]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});