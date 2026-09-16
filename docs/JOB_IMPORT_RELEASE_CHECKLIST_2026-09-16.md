# Job Import release checklist

**Scope:** job import platform only  
**Source of truth:** [`JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md`](./JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md)

## Delivery boundary

- [x] MVP in-scope and out-of-scope behavior documented.
- [x] Three feature flags exist and default to false.
- [x] Platform admin is the only organization feature-flag authority.
- [x] Role capabilities are documented.
- [x] Workstream ownership is assigned to accountable roles.
- [x] Named production assignees are an explicit release blocker.
- [x] Forbidden pre-production actions are documented.
- [x] Non-production staging organization/client seed is available.
- [x] Twelve public source references and deterministic local fixtures are inventoried.

## Foundation gate

- [ ] Preview is read-only and proven by an invariant test.
- [ ] ImportSource is tenant- and AgencyClient-scoped.
- [x] Runtime fields are not browser-editable.
- [ ] Source identity is tenant/source scoped.
- [ ] Connectors cannot write jobs directly.
- [ ] Source URLs and canonical public apply URL are separated.

## Legacy safety freeze

- [x] Preview and manual legacy source execution return `501` without invoking the crawler.
- [x] Legacy unscoped scheduler execution is disabled.
- [x] Already queued legacy source jobs fail closed without invoking the crawler.
- [x] Legacy sources default to inactive with no schedule.
- [x] Crawler job lookup by external ID/apply URL includes organization scope.
- [x] Crawler rejects actors without an organization.
- [x] Orphaned legacy pages remain outside production routing and expose disabled controls only.

## Product gate

- [ ] Onboarding wizard passes usability acceptance.
- [ ] Dry-run explains create/update/close/skip/review.
- [ ] Review queue and field ownership are operational.
- [ ] Job provenance is visible.
- [ ] EN/HE, RTL, responsive and accessibility checks pass.

## Reliability and security gate

- [ ] Secure fetcher/SSRF suite passes.
- [ ] Partial/failed snapshots cannot close jobs.
- [ ] Circuit breaker is tested with anomalous empty/mass-close runs.
- [ ] Credentials and secrets are redacted.
- [ ] Audit, metrics, alerts and dead-letter replay are ready.
- [ ] Two-tenant, >500-record and pagination E2E pass.

## Rollout gate

- [ ] Named owners are recorded in the deployment system.
- [ ] Legacy migration reconciliation report is approved.
- [ ] Shadow run baseline is approved.
- [ ] Internal operator Wave 1 completes without critical incident.
- [ ] Selected-agency Wave 2 is approved.
- [ ] Rollback and connector kill switch are exercised.
- [ ] General availability is approved by product, security and operations.
