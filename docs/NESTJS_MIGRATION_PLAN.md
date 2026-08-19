# 🗺️ Migration Plan: Base44 → NestJS + MySQL + TypeORM

> Generated: June 30, 2026

## ⚠️ Important Note First

The project is **not Next.js** — it is a **Vite + React SPA** with `react-router-dom`. The `package.json` confirms: `"vite": "^6.1.0"`, `"react-router-dom": "^6.26.0"`. The migration plan below accounts for this correctly.

---

## 1. Current Architecture Overview

### 1.1 How the Frontend Uses Base44 Today

The frontend has **134+ files** that use the Base44 SDK directly. There are **three categories** of Base44 calls:

**A) Entity CRUD** (pattern: `base44.entities.EntityName.method()`)

| Method                             | Description                            |
| ---------------------------------- | -------------------------------------- |
| `.list()`                          | Fetch all records                      |
| `.filter(conditions, sort, limit)` | Fetch with filter                      |
| `.get(id)`                         | Fetch by ID                            |
| `.create(data)`                    | Create record                          |
| `.update(id, data)`                | Update record                          |
| `.delete(id)`                      | Delete record                          |
| `.subscribe(...)`                  | Real-time subscription (Notifications) |

**B) Auth** (pattern: `base44.auth.method()`)

| Method                               | Description         |
| ------------------------------------ | ------------------- |
| `me()`                               | Get current user    |
| `loginViaEmailPassword(email, pass)` | Login               |
| `loginWithProvider(provider)`        | OAuth login         |
| `logout()`                           | Logout + redirect   |
| `register(data)`                     | Register new user   |
| `updateMe(data)`                     | Update current user |
| `resetPasswordRequest(email)`        | Send reset link     |
| `resetPassword(token, pass)`         | Reset password      |
| `verifyOtp(otp)`                     | OTP verification    |
| `setToken(token)`                    | Set access token    |

**C) Functions** (pattern: `base44.functions.invoke('name', params)`)

| Function Name                                       | What It Does                         |
| --------------------------------------------------- | ------------------------------------ |
| `getDashboardStats`                                 | Dashboard statistics                 |
| `smartSearch`                                       | Full-text search candidates/jobs     |
| `getJobRecommendations`                             | AI recommendations for job           |
| `getRecommendedJobs`                                | Recommended jobs for candidate       |
| `scoreApplication`                                  | AI scoring of application            |
| `extractAndTranslateResume`                         | Parse + translate resume with AI     |
| `parseResumeBatch`                                  | Batch parse resumes                  |
| `importCandidatesFromFile`                          | Import candidates from file          |
| `importResumeFiles`                                 | Import resume ZIP                    |
| `createBulkCandidates`                              | Bulk create candidates               |
| `validateImportBatch`                               | Validate import batch                |
| `detectDuplicateAdvanced`                           | Detect duplicate candidates          |
| `deleteCandidate`                                   | Soft delete candidate                |
| `sendCandidateToEmployer`                           | Send candidate to employer           |
| `createApplicationTimeline`                         | Create timeline event                |
| `createCandidateTimeline`                           | Create candidate timeline event      |
| `createAuditLog`                                    | Write audit log                      |
| `createCompanyNotification`                         | Send notification                    |
| `crawlCareerPage`                                   | Crawl employer career page           |
| `importAlljobs`                                     | Import all job sources               |
| `importElbit / importJobicy / importNovolog / etc.` | External job import                  |
| `loadTaxonomy`                                      | Load domain/role/specialization data |
| `updateCompanyProfile`                              | Update company profile data          |
| `getLocationFromIP`                                 | Get user location from IP            |
| `setUserRole`                                       | Set user role                        |

---

## 2. All 39 Entities (Database Tables)

| #   | Entity                   | Key Fields                                                                                                                                                                                                                                                                            | Multi-Tenant | Soft Delete |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| 1   | **User**                 | role, organization_id, phone, team_manager_id, recruitment_manager_id, display_role_name                                                                                                                                                                                              | via org      | No          |
| 2   | **Organization**         | name, org_type (staffing_agency\|organization), status, settings (JSON), plan, contact_email, logo_url                                                                                                                                                                                | self         | No          |
| 3   | **Candidate**            | full_name, email, phone, location, domain_id, role_id, specialization_id, experience_years, desired_salary_min/max, resume_url, skills (array), languages (array), status, source, recruiter_id, team_manager_id, organization_id, import_batch_id, parsing_status, conversion_status | ✅ org_id    | ✅          |
| 4   | **Job**                  | title, company, location, salary_min/max, type (full/part/daily/remote), description, employer_company_id, organization_id, domain_id, role_id, seniority, required_skills/preferred_skills (arrays), is_closed, is_anonymous, job_code, views, applications_count                    | ✅ org_id    | ✅          |
| 5   | **Application**          | job_id, candidate_id, organization_id, status (new→hired pipeline), match_score, match_reason, resume_url, source, recruiter_id, team_manager_id, employer_company_id, assigned_to, notes                                                                                             | ✅ org_id    | ✅          |
| 6   | **Interview**            | organization_id, application_id, candidate_id, job_id, date, time, type, stage, status, duration_minutes, feedback, rating, recommendation, recruiter_id                                                                                                                              | ✅ org_id    | No          |
| 7   | **Message**              | application_id, sender_email, sender_role, content, is_read                                                                                                                                                                                                                           | No           | No          |
| 8   | **Notification**         | organization_id, recipient_email, type, title, content, metadata (JSON), is_read                                                                                                                                                                                                      | ✅ org_id    | No          |
| 9   | **Company**              | name, industry, initials, color, logo_url, job_count                                                                                                                                                                                                                                  | No           | ✅          |
| 10  | **CandidateNote**        | candidate_id, candidate_email, author_email, author_name, author_role, content, visibility, is_pinned, note_type, related_application_id                                                                                                                                              | No           | No          |
| 11  | **CandidateProfile**     | user_email, full_name, phone, location, title, summary, skills (arr), experience_years, education (JSON), experience (JSON), desired_salary_min/max, job_type, categories (arr), is_public, is_open_to_work, resume_url                                                               | No           | No          |
| 12  | **CandidateDocument**    | organization_id, candidate_id, doc_type, filename, file_url, original_file_url, docx_url, file_size, is_latest_cv, conversion_status, parsing_status, parsed_data (JSON), import_batch_id                                                                                             | ✅ org_id    | No          |
| 13  | **CandidateTag**         | candidate_id, tag, color, added_by                                                                                                                                                                                                                                                    | No           | No          |
| 14  | **CandidateTimeline**    | organization_id, candidate_id, event_type, description, performed_by, metadata (JSON), is_visible_to_candidate                                                                                                                                                                        | ✅ org_id    | No          |
| 15  | **ApplicationTimeline**  | organization_id, application_id, event_type, previous_value, new_value, description, performed_by, performed_by_role                                                                                                                                                                  | ✅ org_id    | No          |
| 16  | **ApplicationPipeline**  | employer_id, name, order, color                                                                                                                                                                                                                                                       | No           | No          |
| 17  | **CandidateImportBatch** | batch_name, source_file, file_type, imported_by, total_records, successful_imports, failed_imports, status, error_log (JSON), processing_started/completed_at                                                                                                                         | No           | No          |
| 18  | **CandidateAccess**      | candidate_id, owner_organization_id, accessor_organization_id, access_type, granted_by, granted_at, expires_at                                                                                                                                                                        | No           | No          |
| 19  | **CompensationPlan**     | organization_id, job_id, client_name, total_fee, warranty_period_days, recruiter_id, team_manager_id, recruiter_compensation, recruiter_compensation_type, notes                                                                                                                      | ✅ org_id    | No          |
| 20  | **CommunicationLog**     | organization_id, candidate_id, channel, direction, sender_email, subject, content, status, related_application_id                                                                                                                                                                     | ✅ org_id    | No          |
| 21  | **AuditLog**             | organization_id, actor_user_id, actor_email, actor_role, entity_type, entity_id, entity_label, action, metadata (JSON), ip_address, user_agent                                                                                                                                        | ✅ org_id    | No          |
| 22  | **ImportSource**         | name, provider, url, interval_hours, is_active, last_sync, last_sync_status, jobs_added, logs (JSON)                                                                                                                                                                                  | No           | No          |
| 23  | **JobAlert**             | user_email, keywords, location, category, job_type, salary_min, frequency, is_active, last_sent                                                                                                                                                                                       | No           | No          |
| 24  | **SavedJob**             | user_email, job_id, job_title, company                                                                                                                                                                                                                                                | No           | No          |
| 25  | **Staff**                | company_id, full_name, email, phone, role (hiring_manager/team_manager/recruiter), manager_email                                                                                                                                                                                      | No           | No          |
| 26  | **Domain**               | domain_id (PK), name                                                                                                                                                                                                                                                                  | No           | No          |
| 27  | **Role**                 | role_id (PK), domain_id, domain_name, name                                                                                                                                                                                                                                            | No           | No          |
| 28  | **Specialization**       | specialization_id (PK), role_name, name                                                                                                                                                                                                                                               | No           | No          |
| 29  | **WorkMode**             | mode_id (PK), name                                                                                                                                                                                                                                                                    | No           | No          |
| 30  | **EmploymentType**       | type_id (PK), name                                                                                                                                                                                                                                                                    | No           | No          |
| 31  | **ExperienceLevel**      | level_id (PK), name                                                                                                                                                                                                                                                                   | No           | No          |
| 32  | **PermissionMatrix**     | organization_id, org_type, role_key, is_template, permissions (JSON)                                                                                                                                                                                                                  | ✅ org_id    | No          |
| 33  | **Position**             | company_email, title, department, description, required_experience, skills (arr), salary_min/max, is_active                                                                                                                                                                           | No           | No          |
| 34  | **CompanyReview**        | company_id, company_name, reviewer_email, reviewer_name, rating_overall, rating_salary, rating_management, rating_worklife, title, pros, cons, is_anonymous                                                                                                                           | No           | No          |
| 35  | **RoleAlias**            | alias (PK), canonical_role                                                                                                                                                                                                                                                            | No           | No          |
| 36  | **RoleTemplate**         | organization_id, org_type, system_role_key, display_name, parent_role_key, hierarchy_level, permissions_template_id, is_active                                                                                                                                                        | No           | No          |
| 37  | **EmployerTimeline**     | employer_email, event_type, description, metadata (JSON)                                                                                                                                                                                                                              | No           | No          |
| 38  | **UserPositionAccess**   | company_email, user_email, user_name, user_type, position_ids (arr), can_review_applications, can_schedule_interviews                                                                                                                                                                 | No           | No          |
| 39  | **SalaryData**           | job_title, category, location, salary_avg, salary_min, salary_max, sample_count, year                                                                                                                                                                                                 | No           | No          |

---

## 3. Roles and Permissions Summary

**10 system roles:**

```
super_admin          → platform-wide, sees only platform data (Organizations, AuditLog, PermissionMatrix)
admin                → platform operator, global access to all data
org_admin            → full access within their organization
recruitment_manager  → full org access within their organization
team_manager         → own team only (team_manager_id = userId)
recruiter            → own records only (recruiter_id = userId)
hr_manager           → full org access (company HR org_type)
internal_recruiter   → own records only
employer             → external client, sees only employer_company_id data
candidate            → public jobs + own applications/profile
```

**Multi-tenant isolation:** Every sensitive entity has `organization_id` which must be enforced at the query level (NestJS guard/interceptor or TypeORM subscriber).

---

## 4. Proposed NestJS Backend Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts          ← login, register, logout, me, refresh, reset
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── rls.guard.ts
│   │   └── dto/
│   │       ├── login.dto.ts             ← Zod + nestjs-zod
│   │       ├── register.dto.ts
│   │       └── reset-password.dto.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts
│   │   │   └── audit-log.interceptor.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   └── utils/
│   │       ├── rls.utils.ts
│   │       └── pagination.utils.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   └── typeorm.config.ts
│   │
│   ├── modules/
│   │   ├── users/
│   │   ├── organizations/
│   │   ├── candidates/
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── interviews/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── companies/
│   │   ├── compensation/
│   │   ├── audit/
│   │   ├── communication/
│   │   ├── taxonomy/
│   │   ├── permissions/
│   │   ├── import/
│   │   ├── salary/
│   │   └── functions/
│   │
├── migrations/
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 5. API Endpoint Mapping

| Frontend Call                                | NestJS Endpoint                           |
| -------------------------------------------- | ----------------------------------------- |
| `base44.entities.Candidate.list()`           | `GET /api/candidates`                     |
| `base44.entities.Candidate.filter({...})`    | `GET /api/candidates?filter[field]=value` |
| `base44.entities.Candidate.get(id)`          | `GET /api/candidates/:id`                 |
| `base44.entities.Candidate.create(data)`     | `POST /api/candidates`                    |
| `base44.entities.Candidate.update(id, data)` | `PATCH /api/candidates/:id`               |
| `base44.entities.Candidate.delete(id)`       | `DELETE /api/candidates/:id`              |
| `base44.functions.invoke('name', params)`    | `POST /api/functions/name`                |
| `base44.auth.me()`                           | `GET /api/auth/me`                        |
| `base44.auth.loginViaEmailPassword(e, p)`    | `POST /api/auth/login`                    |
| `base44.auth.register(data)`                 | `POST /api/auth/register`                 |
| `base44.auth.logout()`                       | `POST /api/auth/logout`                   |
| `base44.auth.resetPasswordRequest(email)`    | `POST /api/auth/forgot-password`          |
| `base44.auth.resetPassword(token, pass)`     | `POST /api/auth/reset-password`           |
| `base44.auth.updateMe(data)`                 | `PATCH /api/auth/me`                      |

### Response Format

```json
// Single item:
{ "data": {...}, "status": 200 }

// List:
{
  "data": [...],
  "pagination": {
    "page": 1, "limit": 20, "total": 100,
    "totalPages": 5, "hasNextPage": true, "hasPrevPage": false
  }
}
```

---

## 6. Frontend Changes Required

### Files that need to be replaced/updated

| File                                          | Change Required                                |
| --------------------------------------------- | ---------------------------------------------- |
| `src/api/base44Client.js`                     | Replace with compatibility shim                |
| `src/lib/AuthContext.jsx`                     | Replace `base44.auth.*` with JWT HTTP calls    |
| `src/lib/app-params.js`                       | Remove Base44 token handling                   |
| `src/api/client/httpClient.ts`                | Remove Base44 SDK auth interceptor             |
| All 134 files with `base44.entities.*`        | Replace with BaseRepository OR use shim        |
| All files with `base44.functions.invoke(...)` | Replace with HTTP `POST /api/functions/{name}` |
| `src/pages/Login.jsx`                         | Replace auth calls                             |
| `src/pages/Register.jsx`                      | Replace auth calls                             |
| `src/pages/ForgotPassword.jsx`                | Replace auth calls                             |
| `src/pages/ResetPassword.jsx`                 | Replace auth calls                             |

### Compatibility Shim Strategy

Instead of touching 134 files, create a `base44` shim in `src/api/base44Client.js` that:

- Maps `base44.entities.X.list()` → `GET /api/x`
- Maps `base44.entities.X.filter(cond)` → `GET /api/x?filter[k]=v`
- Maps `base44.entities.X.get(id)` → `GET /api/x/:id`
- Maps `base44.entities.X.create(data)` → `POST /api/x`
- Maps `base44.entities.X.update(id, data)` → `PATCH /api/x/:id`
- Maps `base44.entities.X.delete(id)` → `DELETE /api/x/:id`
- Maps `base44.auth.*` → `/api/auth/*`
- Maps `base44.functions.invoke(name, params)` → `POST /api/functions/:name`

---

## 7. Authentication Architecture

### New JWT Flow

```
POST /api/auth/register        → { accessToken, refreshToken, user }
POST /api/auth/login           → { accessToken, refreshToken, user }
POST /api/auth/refresh         → { accessToken }
POST /api/auth/logout          → 200 OK
GET  /api/auth/me              → UserProfile
PATCH /api/auth/me             → UserProfile
POST /api/auth/forgot-password → 200 OK
POST /api/auth/reset-password  → 200 OK
```

- **Access token**: 15 min, JWT
- **Refresh token**: 7 days, stored hashed in DB
- **JWT Payload**: `{ sub: userId, email, role, organization_id }`

---

## 8. MySQL Database Design Notes

- Array fields → `JSON` column type
- Object fields → `JSON` column type
- Soft delete → manual `is_deleted + deleted_at` (keeping Base44 field names)
- IDs → `VARCHAR(36)` with `@PrimaryGeneratedColumn('uuid')`
- Timestamps → `created_date`, `updated_date` (kept for frontend compatibility)

---

## 9. Migration Phases

### Phase 1 — Backend Foundation ✅ (in progress)

- NestJS project + TypeORM + MySQL
- docker-compose.yml, .env.example
- Auth module (JWT)
- UsersModule, OrganizationsModule
- CommonModule (RLS, transform, error handling, ZodValidationPipe)
- TaxonomyModule (Domain, Role, Specialization, WorkMode, EmploymentType, ExperienceLevel)

### Phase 2 — Core Entity CRUD

- CandidatesModule (+ notes, tags, documents, timeline, import batches)
- JobsModule (+ saved jobs, alerts)
- ApplicationsModule (+ timeline, pipeline)
- InterviewsModule
- MessagesModule
- NotificationsModule
- CompaniesModule

### Phase 3 — Advanced Modules

- CompensationModule
- AuditLogModule
- CommunicationLogModule
- PermissionsModule
- ImportSourcesModule
- FunctionsModule (dashboard stats, audit log, timeline events)

### Phase 4 — AI & Import Functions

- Smart search
- Resume parsing
- Candidate import (file + batch)
- Job import services (external sources + cron)
- AI scoring + recommendations

### Phase 5 — Frontend Migration

- Base44 compatibility shim
- AuthContext.jsx → JWT
- Remove `@base44/sdk` dependency
- Data migration scripts

### Phase 6 — Testing & Cutover

- E2E testing
- Data migration dry run
- DNS/proxy cutover

---

## 10. Risks and Mitigations

| Risk                         | Severity | Mitigation                                 |
| ---------------------------- | -------- | ------------------------------------------ |
| 134 files use Base44 SDK     | HIGH     | Compatibility shim                         |
| Auth mechanism change        | HIGH     | Keep localStorage key, same response shape |
| Complex serverless functions | HIGH     | Migrate in phases                          |
| Real-time subscriptions      | MEDIUM   | Replace with polling or SSE                |
| Array/JSON fields in MySQL   | MEDIUM   | JSON column type (MySQL 5.7+)              |
| OAuth providers              | MEDIUM   | Passport.js strategies (Phase 3)           |
| File uploads (resumes)       | MEDIUM   | MulterModule + local/S3                    |
| Cron jobs (external imports) | MEDIUM   | `@nestjs/schedule` with `@Cron()`          |
| Data migration from Base44   | HIGH     | Export scripts + migration tooling         |
| Multi-tenant RLS             | HIGH     | RLS interceptor + service-level filtering  |

---

## 11. Summary: Scope of Work

| Area               | Backend Files       | Frontend Files               |
| ------------------ | ------------------- | ---------------------------- |
| Auth               | ~10                 | 2 (AuthContext + httpClient) |
| Core entities (39) | ~195 (5 per entity) | 0 (with shim) or 134 (clean) |
| Functions (27+)    | ~30                 | 0 (with shim)                |
| Common/infra       | ~15                 | 0                            |
| **Total**          | **~250**            | **2–136**                    |
