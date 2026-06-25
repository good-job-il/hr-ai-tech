import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.data || !user.data.organization_id) {
      return Response.json({ 
        error: 'User has no organization_id',
        user_id: user.id,
        user_data: user.data
      }, { status: 400 });
    }

    // Test 1: Recruiter Isolation
    // Get all candidates in the same organization
    const allCandidates = await base44.asServiceRole.entities.Candidate.filter({
      organization_id: user.data.organization_id,
      recruiter_id: { $exists: true }
    });

    // Get candidates visible to current user (RLS enforced)
    const visibleCandidates = await base44.entities.Candidate.list();

    // Test 2: Team Manager Isolation
    const allCandidatesWithTM = await base44.asServiceRole.entities.Candidate.filter({
      organization_id: user.data.organization_id,
      team_manager_id: { $exists: true, $ne: null }
    });

    // Group candidates by recruiter_id
    const candidatesByRecruiter = {};
    allCandidates.forEach(c => {
      const rid = c.recruiter_id || 'unassigned';
      if (!candidatesByRecruiter[rid]) candidatesByRecruiter[rid] = [];
      candidatesByRecruiter[rid].push({
        id: c.id,
        full_name: c.full_name,
        recruiter_id: c.recruiter_id,
        team_manager_id: c.team_manager_id
      });
    });

    // Group by team_manager_id
    const candidatesByTeamManager = {};
    allCandidatesWithTM.forEach(c => {
      const tmid = c.team_manager_id || 'unassigned';
      if (!candidatesByTeamManager[tmid]) candidatesByTeamManager[tmid] = [];
      candidatesByTeamManager[tmid].push({
        id: c.id,
        full_name: c.full_name,
        recruiter_id: c.recruiter_id,
        team_manager_id: c.team_manager_id
      });
    });

    // Verification results
    const results = {
      test_timestamp: new Date().toISOString(),
      current_user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.data.organization_id
      },
      recruiter_isolation: {
        description: 'Recruiters should only see candidates assigned to them',
        all_candidates_by_recruiter: candidatesByRecruiter,
        visible_to_current_user: visibleCandidates.map(c => ({
          id: c.id,
          full_name: c.full_name,
          recruiter_id: c.recruiter_id
        })),
        expected_recruiter_ids: user.role === 'recruiter' ? [user.id] : ['all_for_admin'],
        pass_fail: user.role === 'recruiter' 
          ? (visibleCandidates.every(c => c.recruiter_id === user.id) ? 'PASS' : 'FAIL')
          : 'PASS (admin sees all)'
      },
      team_manager_isolation: {
        description: 'Team managers should only see candidates from their team',
        all_candidates_by_team_manager: candidatesByTeamManager,
        visible_to_current_user_count: visibleCandidates.length,
        expected_team_manager_id: user.role === 'team_manager' ? user.id : 'all_for_admin',
        pass_fail: user.role === 'team_manager'
          ? (visibleCandidates.every(c => c.team_manager_id === user.id) ? 'PASS' : 'FAIL')
          : 'PASS (admin sees all)'
      },
      rls_enforcement: {
        description: 'RLS rules are enforced at database query level',
        total_candidates_in_org: allCandidates.length,
        visible_to_current_user: visibleCandidates.length,
        filtered_out: allCandidates.length - visibleCandidates.length,
        pass_fail: user.role === 'recruiter' || user.role === 'team_manager'
          ? (visibleCandidates.length < allCandidates.length ? 'PASS (filtered)' : 'FAIL (no filtering)')
          : 'PASS (admin sees all)'
      }
    };

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});