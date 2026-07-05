# Base44 → MySQL Data Migration

This document describes how to migrate **real production data** out of the
live Base44 backend (app id `6a00f4b05ae5180d66425437`) into the local/
production MySQL database used by the NestJS backend.

The tool lives at `backend/src/scripts/migrate-from-base44.ts` and is run via:

```bash
cd backend
npm run migrate:base44
```

## 1. Prerequisites

1. The NestJS backend's MySQL database must already exist and have all
   migrations applied:
   ```bash
   npm run migration:run
   npm run seed:taxonomy   # only if NOT using --include-taxonomy
   ```
2. You need credentials for a Base44 user with **`admin` or `super_admin`**
   role in the live app — regular org-scoped roles won't see other
   organizations' data due to Base44's own RLS rules.

## 2. Configure credentials

Add to `backend/.env` (never commit real credentials):

```dotenv
BASE44_SERVER_URL=https://base44.app
BASE44_APP_ID=6a00f4b05ae5180d66425437

# Option A — email/password login (script logs in automatically)
BASE44_EMAIL=admin@yourcompany.com
BASE44_PASSWORD=********

# Option B — already have a valid access token (skips login)
# BASE44_ACCESS_TOKEN=eyJhbGciOi...
```

## 3. Dry run first

Always dry-run first to see what would be fetched/written without touching
the database:

```bash
npm run migrate:base44 -- --dry-run
```

This authenticates, fetches every entity from Base44, and prints a summary
table (fetched counts) without writing anything.

## 4. Run the real migration

```bash
npm run migrate:base44
```

- The script is **idempotent** — it performs
  `INSERT ... ON DUPLICATE KEY UPDATE` per record (matched by the original
  Base44 `id`), so it's safe to re-run (e.g. to pick up new records before a
  final cutover).
- Original `id`, `created_date`, `updated_date` and all other field values
  are preserved as-is — the MySQL schema was designed to mirror Base44's
  field names 1:1, so no per-field remapping is needed for the vast majority
  of entities.
- Useful flags:
  - `--only=Job,Candidate,Application` — migrate a subset (comma-separated
    Base44 entity names, case-sensitive, matching the names in
    `base44/entities/*.jsonc`).
  - `--page-size=200` — Base44 API page size (default 200).
  - `--include-taxonomy` — also migrate Domain/Role/Specialization/WorkMode/
    EmploymentType/ExperienceLevel. Skipped by default since these are
    static reference tables already populated by `npm run seed:taxonomy`;
    only needed if the live app has custom entries beyond the fixed seed
    list.

## 5. ⚠️ Passwords are NOT migrated

Base44's authentication system is separate from its entity data API and
**never exposes password hashes**. Every migrated `User` row gets a random,
cryptographically unguessable `password_hash` placeholder — nobody can log
in with their old password.

After migration, the script writes a CSV report to
`backend/migration-reports/migrated-users-<timestamp>.csv` listing every
migrated user's email + role. **Every migrated user must use "Forgot
Password" (`POST /api/auth/forgot-password`) to set a new password before
they can log in.** Plan a communication (email blast) to affected users as
part of the cutover.

## 6. Order of entities migrated

Parents are migrated before children for readability (no FK constraints
exist in the schema, so strict ordering isn't required for integrity):

Organization → User → Company → Staff → CompanyReview → Position →
UserPositionAccess → RoleAlias → RoleTemplate → PermissionMatrix →
Candidate → CandidateProfile → CandidateImportBatch → CandidateAccess →
CandidateNote → CandidateTag → CandidateTimeline → CandidateDocument →
Job → JobAlert → SavedJob → Application → ApplicationTimeline →
ApplicationPipeline → Interview → Message → Notification →
CompensationPlan → CommunicationLog → EmployerTimeline → AuditLog →
ImportSource → SalaryData

## 7. Troubleshooting

- **`Table "x" not found in database`**: run `npm run migration:run` first.
- **`Base44 API error 401`**: check `BASE44_EMAIL`/`BASE44_PASSWORD` or
  `BASE44_ACCESS_TOKEN` are valid and the user has admin rights.
- **`Base44 API error 429`**: the script automatically retries with
  backoff (up to 4 attempts); if it still fails, re-run later or lower
  `--page-size`.
- Per-record errors (bad data, missing PK, etc.) are collected and printed
  in the final summary rather than aborting the whole run — check the
  "Errors detail" section of the output.

