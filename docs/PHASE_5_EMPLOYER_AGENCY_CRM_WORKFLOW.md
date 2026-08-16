# Phase 5 — Employer, Agency and CRM workflow boundary

Status: source code and CI boundary complete on 13 August 2026. Role-specific browser E2E is pending an executable environment.

## Migrated runtime graph

- Staffing Agency: dashboard, client list/detail, job management, candidate CRM, pipeline, AI matching, compensation, team management and import dashboard.
- Company HR: dashboard, jobs, candidate CRM, interviews, team management and analytics.
- Recruiter views and the legacy Employer routes currently mounted by `App.jsx`.
- Shared ATS, CRM, interview and employer job-form components used by those routes.

These consumers use typed domain services and contain no `base44Client`, `base44.*`, raw `httpClient`, `fetch`, `axios` or compatibility `/functions/*` calls.

## Backend-owned business actions

- `PATCH /applications/:id/status` performs an authorized transition and writes timeline/notification records server-side.
- `POST /applications/assign-candidate` accepts canonical job and candidate IDs, resolves the complete record under Job/Candidate RLS, and prevents duplicate assignments.
- `POST /users/invite` creates an organization-scoped member and sends a backend-owned 48-hour password setup email. Organization admins cannot assign or modify administrator accounts, create platform identities, or change tenant ownership; generic user updates are restricted to platform/org admins.
- `POST /communication-logs/present-candidate` resolves candidate, job and employer contact under RLS and owns the email template and communication audit trail.
- Candidate CRM notes, tags, documents, timeline and communication DTOs no longer accept browser-authored author/sender/tenant identity.
- Compensation plan ownership is always derived from the JWT organization.
- Company profile media uses `fileService`; profile fields use the authenticated `/auth/me` contract.
- The unused compatibility employer-timeline read/write endpoints are platform-admin-only until physical removal.

## Automated gate

Run:

```bash
npm run test:phase-5-b2b
```

It checks the active B2B route/component graph, API type contracts, identity ownership, canonical-ID assignment, explicit pipeline transitions and the absence of `.catch(() => [])` error masking.

## Deferred legacy artifacts

Several standalone files under `src/pages/employer/` are not imported by `App.jsx`. Vendor imports and crawling belong to Phase 6. Duplicate Jobs/Candidates/Dashboard/Kanban/Settings implementations remain historical artifacts for physical deletion in Phase 7 and are not part of the runtime route graph.

## Operational acceptance still required

1. Run agency org-admin, recruitment-manager, team-manager and recruiter accounts; verify each sees only its permitted clients/jobs/candidates/applications.
2. Run company org-admin, HR-manager and internal-recruiter accounts; verify cross-company records return 404/403.
3. Invite a team member, complete password setup from the email and verify role/tenant assignment.
4. Create an agency client and job, assign a pool candidate, transition the pipeline and verify timeline plus notification records.
5. Present a candidate to the employer and verify recipient, template, communication log and retry/error visibility.
6. Schedule/update an interview and verify both company and candidate views.
7. Repeat with Base44 domains blocked and confirm no request is attempted.

Until these scenarios run, Phase 5 is complete for source code and enforcement, but not operationally signed off.
