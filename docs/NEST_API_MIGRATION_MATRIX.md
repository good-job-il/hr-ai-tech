# NestJS API migration matrix

Дата baseline: 2 августа 2026.

Этот документ фиксирует границу миграции с legacy compatibility API на явные frontend services.

| Domain / routes | Frontend service | NestJS API | Ownership/permission source | Target phase |
|---|---|---|---|---|
| Login, Register, Reset, AuthContext | `authService` | `/auth/*` | JWT strategy / RolesGuard | 3 |
| Agency onboarding | `organizationService` | `/organizations/onboard-agency` | current user + org type | 3 |
| Platform organizations | `organizationService` | `/organizations` | platform admin / scoped token | 3 |
| Platform users | `userService` | `/users` | UsersService RLS | 3 |
| Permission Matrix | `permissionService` | `/permission-matrices` | tenant + role | 3 |
| Role templates / aliases | `permissionService` | `/role-templates`, `/role-aliases` | tenant/template policy | 3 |
| Taxonomy | `taxonomyService` | `/taxonomy/*` | public read / admin mutation | 3 |
| Audit | `auditService` | `/audit-logs` | tenant + actor | 3 |
| Agency clients | `agencyClientService` | `/agency-clients` | staffing tenant | 2/5 |
| Jobs | `jobService` | `/jobs` | Job RLS | 2/4/5 |
| Candidates | `candidateService` | `/candidates` | Candidate RLS | 2/4/5 |
| Applications | `applicationService` | `/applications` | Application RLS | 2/4/5 |
| Public/candidate workflow | domain services | explicit domain routes | candidate/public rules | 4 |
| Employer/agency CRM | domain services | explicit domain routes | tenant/team/own RLS | 5 |
| Import/AI/legacy functions | import/matching services | domain use-case routes | backend orchestration | 6 |

## Baseline traffic contract

- Browser calls only `/api/*` for application data.
- Development `/api` proxy points to NestJS.
- Direct Base44 domain traffic is limited to legacy media URLs and must be removed in Phase 1.
- Any new `base44Client` import is rejected by `npm run check:legacy-api`.
- Unknown query filters are not allowed in new services; every filter must be declared in the service method type.

## Long-running/import ownership

| Process | Current owner | Final owner |
|---|---|---|
| Base44 one-time data migration | migration script | removed after signed-off export |
| Resume import | compatibility function controller | NestJS ImportModule + persistent job |
| Career crawling | compatibility function controller | NestJS ImportSource adapter/job |
| Vendor imports | legacy UI calls, incomplete backend routes | NestJS vendor adapters or hidden feature |
| Matching/scoring | compatibility function controller | NestJS MatchingModule |
| Audit/timeline | mixed frontend RPC/backend | backend transaction event |

## Verification

Run `npm run audit:legacy-api` for counts and `npm run check:legacy-api` for the CI boundary.
