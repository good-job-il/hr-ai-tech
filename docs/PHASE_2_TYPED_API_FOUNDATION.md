# Phase 2 typed frontend API foundation

Verified: 13 August 2026.

## Delivered boundary

The frontend now has a typed, explicit NestJS API path for the four reference domains:

| Domain         | Service                  | Query/Create/Update source                                                | Backend contract                     |
| -------------- | ------------------------ | ------------------------------------------------------------------------- | ------------------------------------ |
| Agency clients | `agencyClientService.ts` | `AgencyClientQuery`, `CreateAgencyClientInput`, `UpdateAgencyClientInput` | `Query/Create/UpdateAgencyClientDto` |
| Jobs           | `jobService.ts`          | `JobQuery`, `CreateJobInput`, `UpdateJobInput`                            | `Query/Create/UpdateJobDto`          |
| Candidates     | `candidateService.ts`    | `CandidateQuery`, `CreateCandidateInput`, `UpdateCandidateInput`          | `Query/Create/UpdateCandidateDto`    |
| Applications   | `applicationService.ts`  | `ApplicationQuery`, `CreateApplicationInput`, `UpdateApplicationInput`    | `Query/Create/UpdateApplicationDto`  |

Every service declares a literal endpoint. There is no dynamic entity name, endpoint guessing, generic `.filter()` payload or legacy shim import in `src/api/services` and `src/api/hooks`.

## Shared behavior

- `HttpClient` unwraps only the standard response envelope and preserves paginated responses.
- Falsy response values such as `false`, `0` and an empty string are no longer replaced through truthy `||` fallback.
- GET caching now stores key and value in the correct order and can return cached falsy values.
- `ResourceService<TEntity, TQuery, TCreate, TUpdate>` keeps entity, query and mutation contracts separate.
- Generic resources default create/update payloads to `never`; a service must declare mutation DTO types before TypeScript consumers can mutate it.
- `listPage()` returns pagination metadata; compatibility `list()` returns only records for existing migrated screens.
- The obsolete generic `BaseRepository`, arbitrary `filters` map and guessed bulk endpoints were removed.
- Central query-key factories distinguish list/detail scopes.
- Typed React Query hooks provide list/detail queries and centralized mutation invalidation for all four reference domains.

## Contract gates

Run:

```bash
npm run release:verify
```

The gate performs a strict API-only TypeScript build and verifies:

- query fields exactly match the corresponding NestJS Zod DTO fields;
- create fields exactly match the backend create DTO schemas;
- unsupported filters, enum values, ownership fields and incomplete create payloads fail compile-time type tests;
- reference services use explicit endpoints and do not import `base44Client`;
- pagination, response-envelope handling, query keys and invalidation remain present;
- the unsafe generic repository/filter surface cannot be restored.

The check runs in the legacy/API boundary GitHub Actions workflow.

## Scope boundary

This phase builds the replacement foundation. It does not claim that every existing screen has migrated to it; those consumers remain scheduled in Phases 4–6 and are frozen by the Phase 0 legacy-call baseline.
