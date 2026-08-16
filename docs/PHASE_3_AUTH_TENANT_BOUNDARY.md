# Phase 3 — Auth, Organization and Platform/Admin boundary

Date: 13 August 2026.

## Implemented boundary

- Auth UI and `AuthContext` use `authService` for login, registration, profile, password reset, refresh, logout and workspace enter/exit.
- JWT storage is application-owned (`access_token`, `refresh_token`); Base44 and generic legacy token aliases are no longer read or written. Existing browser sessions using the removed key must sign in once again.
- Organization, user, permission matrix, role template, role alias, taxonomy and audit calls use explicit typed services.
- Taxonomy verification reads `/taxonomy`; it no longer crosses the compatibility `/functions/loadTaxonomy` route.
- Role aliases expose only the list/create routes implemented by NestJS, rather than guessed generic CRUD routes.
- Platform pages are under the `superAdminOnly` route boundary. Workspace tokens remain short-lived and tab-scoped, and cannot refresh.
- An organization administrator cannot change platform-owned `org_type`, `status` or `plan` fields.
- Audit actor and tenant attribution are derived from the authenticated backend user. They are absent from the browser create contract.
- Creating role aliases requires the platform `admin` role; reads remain public by policy.

## OAuth policy

OAuth is disabled for Phase 3. The supported authentication policy is email/password plus application-owned access/refresh JWTs. No OAuth buttons or provider redirects are exposed by auth UI, and no Base44 provider flow is retained. A future OAuth implementation must terminate in NestJS, issue the same application JWT pair and receive its own threat model and integration tests before UI exposure.

## Automated gate

The retired Phase 3 verification script performed API-only TypeScript contract tests and verified:

- no Phase 3 UI imports the shim or raw HTTP transport;
- no Base44 auth/organization surface remains in the shim or token storage;
- the complete auth lifecycle is present;
- taxonomy does not call compatibility function routes;
- audit identity and organization platform fields are server-owned;
- Platform routes retain the `superAdminOnly` boundary.

The gate runs in `.github/workflows/legacy-api-boundary.yml`.

## Runtime acceptance still requiring an environment

The repository has no supplied running test environment or role credentials, so the browser E2E criterion was not executed here. Before operational sign-off, run login/register/reset, agency onboarding, platform organization/user CRUD, workspace enter/exit, permission/role edits, taxonomy verification and audit viewing while requests to `*.base44.com` are blocked. Use the role/account matrix in `API_TRAFFIC_BASELINE.md`.
