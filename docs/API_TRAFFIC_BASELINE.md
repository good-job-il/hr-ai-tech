# API traffic baseline contract

Status: capture pending — no running test environment or role credentials were available on 13 August 2026.

Phase 0 code boundaries are active, but runtime traffic cannot be truthfully claimed from static source analysis. Capture one browser HAR per role using the same seeded dataset and workflow.

| Role                     | Required workflow                                                          | HAR artifact         | Status  |
| ------------------------ | -------------------------------------------------------------------------- | -------------------- | ------- |
| Candidate                | login → jobs → job detail → profile → application → messages/notifications | `candidate.har`      | pending |
| Employer / company admin | login → dashboard → jobs → candidates → interview → settings               | `employer.har`       | pending |
| Staffing agency admin    | login → dashboard → clients → job → candidate → pipeline → import          | `agency-admin.har`   | pending |
| Platform admin           | login → organizations → users → permissions → taxonomy/audit               | `platform-admin.har` | pending |

## Capture rules

1. Use a non-production environment with known seed IDs and record its build SHA, API base URL, timestamp and dataset version.
2. Clear browser cache, preserve the network log, execute the workflow once, and export HAR with response bodies and secrets removed.
3. Redact `Authorization`, cookies, reset tokens, uploaded files, email bodies and personal data before committing any summary. Raw HAR files must not be committed.
4. Summarize method + normalized route, request count, status distribution, p50/p95 duration and response bytes. Replace IDs with `:id`.
5. Record all non-`/api/*` requests separately. Any request to `*.base44.com` is a Phase 1 blocker.
6. Repeat after every migration phase and compare: removed legacy calls must disappear; no unexplained call or error-rate increase is accepted.

## Completion gate

Phase 0 runtime baseline is complete only when all four rows have a reviewed summary containing build SHA and zero unredacted secrets. Until then this is an explicit operational gap, not a passed check.
