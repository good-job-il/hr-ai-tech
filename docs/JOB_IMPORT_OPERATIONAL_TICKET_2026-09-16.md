# Job Import operational ticket

**Ticket status:** implementation authorized; production release blocked  
**Created:** 16 September 2026  
**Scope contract:** [`JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md`](./JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md)

## Accountable ownership

Repository-level accountability is assigned below. The release manager must replace every `REQUIRED BEFORE PRODUCTION` entry with a named person in the deployment system before Wave 1. The repository must not invent personal names.

| Workstream              | Accountable owner               | Named production assignee  | Required approval              |
| ----------------------- | ------------------------------- | -------------------------- | ------------------------------ |
| Backend import platform | Backend Import Platform Lead    | REQUIRED BEFORE PRODUCTION | Architecture + backend release |
| Frontend workflow       | Frontend Product Workflow Lead  | REQUIRED BEFORE PRODUCTION | UX acceptance                  |
| Data migration          | Production Data Migration Owner | REQUIRED BEFORE PRODUCTION | Reconciliation report          |
| Security review         | Application Security Owner      | REQUIRED BEFORE PRODUCTION | Threat model + security gate   |
| Product acceptance      | Job Import Product Owner        | REQUIRED BEFORE PRODUCTION | MVP acceptance                 |
| Production operations   | Platform Operations Owner       | REQUIRED BEFORE PRODUCTION | Runbook + alerts + rollback    |

No single owner may self-approve data migration and security review.

## Product decisions recorded

- One source belongs to one organization and one AgencyClient in MVP.
- First import creates drafts and requires explicit confirmation.
- Auto-apply is a separate, default-off capability.
- Manual edits take precedence until explicitly returned to source ownership.
- Canonical platform apply URL and external source/apply URLs are separate.
- Closing requires a complete successful snapshot or explicit vendor status.
- Generic HTML is operator-managed beta; browser rendering is out of MVP.

## Release blockers

- [ ] Named assignees recorded in the deployment/release system.
- [ ] Tenant/client ownership migration completed and reconciled.
- [ ] Destructive legacy preview removed.
- [ ] Direct-to-jobs crawler write path removed.
- [ ] Permission Matrix and object-level authorization tests pass.
- [ ] Shadow runs meet approved data-quality thresholds.
- [ ] Security review and runbook approved.
- [ ] Feature and connector kill switches exercised.

## Current implementation authorization

The team may implement Steps 1–24 against local, CI and staging environments. Production data mutation, production source crawling and enabling auto-apply remain prohibited until the release blockers above are cleared.

## Evidence links

- implementation plan: [`JOB_IMPORT_IMPLEMENTATION_PLAN_2026-09-16.md`](./JOB_IMPORT_IMPLEMENTATION_PLAN_2026-09-16.md);
- release checklist: [`JOB_IMPORT_RELEASE_CHECKLIST_2026-09-16.md`](./JOB_IMPORT_RELEASE_CHECKLIST_2026-09-16.md);
- source inventory: [`backend/src/fixtures/job-imports/source-inventory.json`](../../backend/src/fixtures/job-imports/source-inventory.json);
- staging seed: [`backend/src/seeds/job-import-staging.seed.ts`](../../backend/src/seeds/job-import-staging.seed.ts).
