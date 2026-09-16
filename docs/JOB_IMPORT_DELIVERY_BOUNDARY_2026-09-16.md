# Job Import delivery boundary

**Status:** active implementation contract  
**Related plan:** [`JOB_IMPORT_IMPLEMENTATION_PLAN_2026-09-16.md`](./JOB_IMPORT_IMPLEMENTATION_PLAN_2026-09-16.md)  
**Operational ticket:** [`JOB_IMPORT_OPERATIONAL_TICKET_2026-09-16.md`](./JOB_IMPORT_OPERATIONAL_TICKET_2026-09-16.md)

## 1. MVP scope

The MVP delivers a tenant-scoped workflow for importing jobs from Generic JSON, JSON-LD, Greenhouse and Lever into a staffing-agency workspace. It includes read-only preview, staging, field-level diff, review, draft creation through the canonical Jobs domain service, safe reconciliation, provenance and operational monitoring.

The MVP does not include browser rendering, a self-service generic HTML connector, custom connector SDKs, automatic LLM parsing or external candidate application submission.

## 2. Feature-flag contract

| Flag                             | Default | Authority      | Meaning                                               | Enablement prerequisite                                                         |
| -------------------------------- | ------: | -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `job_imports_enabled`            | `false` | Platform admin | Shows and permits the tenant job-import workspace     | Tenant/client ownership, read-only preview and permission guards                |
| `job_imports_auto_apply_enabled` | `false` | Platform admin | Permits scheduled runs to apply reviewed-safe changes | Reconciliation, field ownership, circuit breaker and selected-tenant acceptance |
| `job_imports_html_beta_enabled`  | `false` | Platform admin | Enables operator-managed generic HTML beta            | Secure fetcher, robots policy, detail enrichment and HTML beta runbook          |

Rules:

- All flags are opt-in for every plan.
- Organization overrides are stored under `Organization.settings.feature_flags`.
- Self-service organization onboarding and organization admins cannot set feature flags.
- A child flag never implies `job_imports_enabled`; callers must check both the workspace flag and the capability flag.
- Flags control exposure, not authorization. Backend permissions remain mandatory.
- `job_imports_auto_apply_enabled` must remain false during shadow runs and the first production rollout wave.
- Disabling a flag stops new actions; it must not delete or silently change existing jobs.

Canonical implementations:

- backend: `backend/src/common/feature-flags/job-import-feature-flags.ts`;
- frontend: `client/src/config/jobImportFeatureFlags.js`;
- platform overrides: `/platform/billing/flags`.

## 3. Supported roles

| Role                  |                                                     View source/health |                        Create/configure |           Run preview/sync |                       Review |    Credentials |                   Provenance |
| --------------------- | ---------------------------------------------------------------------: | --------------------------------------: | -------------------------: | ---------------------------: | -------------: | ---------------------------: |
| `org_admin`           |                                                      Yes, organization |                                     Yes |                        Yes |                          Yes |            Yes |                          Yes |
| `recruitment_manager` |                                                      Yes, organization | No destructive configuration by default |                        Yes |                          Yes |             No |                          Yes |
| `team_manager`        | Assigned sources only, deferred unless included in MVP permission work |                                      No | Preview only when assigned |               Assigned items |             No |                          Yes |
| `recruiter`           |                                         No source-management workspace |                                      No |                         No |                           No |             No | Read-only on accessible jobs |
| Platform support      |                 Cross-tenant health metadata with dedicated permission |    No business configuration by default |     Controlled replay only | No content review by default | Never returned |                Metadata only |

This table is a product contract. Step 2 of the implementation plan will encode it in the Permission Matrix and backend guards.

## 4. Rollout boundary

1. **Development:** flags may be enabled only for deterministic fixture organizations.
2. **Shadow:** preview/staging only; no Job mutations and no auto-apply.
3. **Internal operator:** drafts only, every run reviewed.
4. **Selected agencies:** first run reviewed; safe updates may be enabled separately.
5. **General availability:** scheduled apply only after connector/reconciliation SLO approval.

## 5. Actions forbidden before production gates pass

- Exposing orphaned legacy import pages in agency navigation.
- Running the current destructive `preview` against production data.
- Enabling scheduled legacy sources without tenant/client ownership.
- Writing jobs directly from a connector/crawler repository.
- Updating a job by unscoped `external_id` or external URL.
- Using an external posting URL as the canonical platform `apply_url`.
- Auto-closing from a partial, failed or anomalously empty snapshot.
- Auto-merging probable duplicates.
- Overwriting manually edited fields without field-ownership evaluation.
- Persisting credentials, tokens or raw secrets in source configuration/logs.
- Enabling browser rendering or generic HTML self-service without its security gate.
- Assigning ambiguous legacy sources to a client by company-name guessing.

## 6. Staging organization and clients

The repository provides an idempotent, non-production seed:

```bash
cd backend
npm run seed:job-import-staging
```

It creates:

- staffing agency `Job Import E2E Staging`;
- `Job Import Fixture Client Alpha`;
- `Job Import Fixture Client Beta`;
- `job_imports_enabled=true`;
- auto-apply and HTML beta disabled.

The seed refuses `NODE_ENV=production`, refuses database names containing `prod`, and requires an explicit confirmation argument embedded in the npm script. It creates no users and must be paired with an existing non-production test identity.

## 7. Source fixture inventory

The canonical inventory is [`backend/src/fixtures/job-imports/source-inventory.json`](../../backend/src/fixtures/job-imports/source-inventory.json).

It contains 12 publicly observable ATS boards across Greenhouse, Lever, Ashby and SmartRecruiters. No customer/private source is committed. Deterministic payload fixtures are synthetic, use `.fixture.test`, and cover:

- JSON roots `jobs` and `data`;
- Hebrew/English content;
- pagination;
- malformed/privacy-like titles;
- JSON-LD remote/salary/expiry;
- static HTML with footer/privacy noise.

Live public URLs are discovery references, not CI dependencies. CI uses only local fixtures.

## 8. Change-control rule

Any change to MVP scope, role capabilities, flag semantics or forbidden actions requires:

1. an update to this contract;
2. product and security review recorded in the operational ticket;
3. updated acceptance tests before enabling the affected flag.
