# Job Import domain and API contract

**Status:** accepted foundation contract  
**Date:** 2026-09-16  
**Runtime source of truth:** `backend/src/modules/job-imports/domain/job-import.contracts.ts`

## Contract rules

- API payloads use `snake_case` and JSON-safe primitives only.
- Runtime validation and TypeScript types come from the same strict Zod schemas.
- Unknown fields are rejected at the job-import boundary.
- Timestamps are ISO 8601 strings with timezone offsets; domain payloads never expose JavaScript `Date` objects.
- `raw_checksum` is a lowercase SHA-256 hex digest.
- Source URLs are provenance fields and must never replace the platform's canonical public job URL.
- `employment_type` and `work_mode` are independent fields. A job can be `full_time` and `remote` simultaneously.
- Missing mapped values are represented explicitly with `null` or an empty collection, not omitted keys.

## Lifecycle enums

| Contract | Values |
| --- | --- |
| `ConnectorType` | `generic_json`, `json_ld`, `greenhouse`, `lever`, `generic_html` |
| `ImportSourceState` | `draft`, `active`, `paused`, `needs_attention`, `archived` |
| `ImportRunMode` | `preview`, `apply` |
| `ImportRunStatus` | `pending`, `running`, `completed`, `partial`, `failed`, `cancelled` |
| `SnapshotCompleteness` | `full`, `incremental`, `partial`, `failed` |
| `SourceJobLifecycle` | `discovered`, `active`, `suspected_missing`, `closed`, `reopened`, `quarantined`, `ignored` |
| `ImportAction` | `create`, `update`, `close`, `reopen`, `skip`, `review`, `error` |
| `FieldOwnership` | `platform`, `user`, `source_until_edited`, `review_on_conflict` |

Connector capabilities are explicit flags: pagination, detail fetch, incremental sync, closure events, salary, remote constraints, multiple locations, authentication and webhooks. The UI must render capabilities from this contract rather than infer them from a provider name.

## Canonical normalized job

`NormalizedSourceJob` contains:

- stable `external_key`;
- normalized title, source company label and description;
- separate employment type and work mode;
- structured locations and remote applicant constraints;
- category, domain, specialization, seniority and experience;
- required and preferred skills;
- structured salary, currency and period;
- source posting and apply URLs;
- source status and source timestamps;
- field-level ownership, connector provenance, source path and confidence;
- deterministic raw checksum.

The normalized object is a source candidate, not a writable `JobEntity`. A later apply service must translate it through the canonical Jobs domain workflow.

## Typed errors

`ImportError` has a stable code, safe human-readable message, retryability, optional retry delay and scalar diagnostic context. Supported codes are:

- `AUTH_REQUIRED`, `SOURCE_FORBIDDEN`, `ROBOTS_DENIED`, `RATE_LIMITED`;
- `UNSUPPORTED_FORMAT`, `PARSER_CHANGED`, `MAPPING_INVALID`, `PARTIAL_SNAPSHOT`;
- `CLIENT_UNAVAILABLE`, `DUPLICATE_CONFLICT`, `SECURITY_REJECTED`;
- `NETWORK_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`, `INTERNAL_ERROR`.

Raw payloads, credentials and job descriptions must not be placed in error context.

## Permission resource

Job import authorization is stored separately under `permissions.resources.job_imports`:

| Action | Meaning |
| --- | --- |
| `view` | Read sources, runs, health and provenance allowed by scope |
| `create` | Create a source in draft state |
| `update` | Change non-secret source configuration |
| `run` | Start preview/apply runs according to feature and source policy |
| `review` | Resolve review items and approve an apply operation |
| `manage_credentials` | Create, rotate or remove credential references |
| `archive` | Archive a source; this is the destructive configuration permission |

All resource actions default to denied when an old permission record has no `resources` object. Backend guards and tenant scope are authoritative. Frontend checks may hide or disable controls but never grant access.

## Compatibility boundary

- Existing flat permissions remain unchanged.
- Legacy permission records are normalized with all `job_imports` actions set to `false`.
- Platform administrators receive the complete resource permission set through the existing privileged backend path.
- Legacy source execution remains disabled by the Step 1 safety freeze until tenant/client migrations and the preview/apply pipeline exist.
