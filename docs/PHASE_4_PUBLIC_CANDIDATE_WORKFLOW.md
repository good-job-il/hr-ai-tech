# Phase 4 — Public and candidate workflow boundary

Status: code complete on 13 August 2026. Browser E2E is pending an executable test environment.

## Implemented boundary

- Public vacancies use `GET /public/jobs`; protected `/jobs` remains the B2B management surface.
- Search, similar jobs, recommendations, resume extraction and location have explicit domain endpoints instead of `/functions/*` compatibility calls.
- Job views use `POST /jobs/:id/view`; uploads use `fileService`.
- Candidate saved jobs, profile, applications, interviews, messages and notifications use typed services.
- `POST /applications/submit` accepts no candidate email, tenant, status, source or assignment fields. The backend derives identity and lifecycle defaults from JWT.
- Saved jobs, alerts, profiles, applications, interviews and notifications use canonical user IDs for ownership. Migration `1752400000000-CandidateCanonicalOwnership` backfills IDs by the legacy email snapshots.
- Message sender and company-review author are derived by the backend. Every message operation first checks access to its application.
- Messages use explicit React Query polling; notifications use an explicit 15-second polling loop. The UI no longer presents shim polling as realtime subscriptions.

## Automated gate

Run:

```bash
npm run test:phase-4-public-candidate
```

The gate performs API type-contract tests and rejects:

- `base44Client`, `base44.*`, raw `httpClient`, `fetch` or `axios` in active public/candidate UI;
- compatibility `/functions/*` routes in Phase 4 services;
- browser-authored ownership in saved jobs, profiles, candidate submission, messages, notifications and reviews;
- removal of canonical-ID RLS/backfill, application authorization for messages, or explicit polling.

## Operational acceptance still required

Against a migrated database and a real candidate account, execute:

1. Search public jobs and open a job detail page; verify the view counter increments.
2. Upload a resume and submit an application; inspect that `candidate_user_id` comes from JWT.
3. Save/unsave a job and edit the candidate profile.
4. Exchange messages for the submitted application and verify a different candidate receives 404/403.
5. Schedule an interview from an authorized employer/agency account and verify it appears for the candidate.
6. Verify message/notification polling recovers visibly after a transient API failure.
7. Repeat with `*.base44.com` blocked and confirm no request is attempted.

Until this scenario runs, Phase 4 is complete for source code and CI enforcement, but not operationally signed off.
