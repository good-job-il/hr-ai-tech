# Phase 6 — Functions, AI, imports and background jobs

Status: source code and CI boundary complete on 14 August 2026. Database-backed worker and browser E2E sign-off are pending an executable environment.

## Runtime boundary

- Frontend has no `functions.invoke`, `integrations.Core`, compatibility `/functions/*`, generic LLM, or legacy vendor-function calls.
- `FunctionsController` and the generic `IntegrationsController` are removed. The remaining shim exposes entities only until Phase 7.
- Search/recommendations/resume extraction use explicit `/jobs/search`, `/matching/jobs/*`, and `/resumes/extract` contracts.
- Application scoring uses authorized `POST /applications/:id/score` and Application RLS.
- Dashboard analytics uses `GET /analytics/dashboard`.
- Upload uses authenticated `POST /files`; processing accepts only application-owned `/uploads` URLs.
- Market salary insights use stored salary/job data instead of a browser-authored LLM prompt.

## Import job model

Candidate file imports and saved import-source runs are persisted in `background_jobs`:

- states: `pending`, `running`, `completed`, `failed`;
- tenant-scoped idempotency key with a database unique constraint;
- atomic claim before execution;
- three attempts with exponential backoff;
- recovery of jobs left running after an interrupted worker;
- persisted result/error/attempt timestamps;
- scheduled enqueue for active import sources whose interval is due.

The in-process scheduler is only the executor trigger; job state itself is database-backed. Multiple instances are protected by the conditional claim. A dedicated queue worker can replace the trigger later without changing the HTTP contract.

## Security boundary

- Career crawling resolves DNS, rejects loopback/private/link-local targets, manually validates redirects, and applies a timeout.
- Candidate/resume import rejects arbitrary remote URLs and accepts only configured application-owned upload origins.
- Import batch organization/importer/status are derived by the backend.
- Bulk import uses a closed DTO capped at 500 rows; browser ownership fields are rejected.
- Generic browser-controlled LLM prompts are removed; the only remaining AI prompt is backend-owned resume extraction.

## Automated gate

```bash
npm run test:phase-6-operations
```

The gate verifies zero string RPC, physical removal of compatibility controllers, domain routes, persisted idempotency/retry/recovery, scheduler presence, SSRF controls, server-owned batch identity, closed bulk DTOs, and removal of the generic LLM endpoint.

## Operational acceptance

1. Apply migration `1752500000000-BackgroundJobs` to a test database.
2. Upload a CSV/XLSX, enqueue it twice, and verify one job/one import result.
3. Stop the backend while a job is running, restart after the stale-lock threshold, and verify recovery.
4. Force a transient source failure, verify backoff and three attempts, then inspect the persisted final error.
5. Verify a cross-tenant user cannot read a job or batch.
6. Verify private/loopback crawler URLs and non-owned import URLs are rejected.
7. Run a scheduled source and confirm source counters/status/logs and duplicate job prevention.
8. Exercise resume extraction with and without the configured AI provider.

Until these scenarios pass, Phase 6 is complete for source code and enforcement but not operationally signed off.
