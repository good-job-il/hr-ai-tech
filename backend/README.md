# Hire Israel — NestJS Backend

Replaces the Base44 BaaS backend with a proper **NestJS + MySQL + TypeORM** stack.

## Stack

- **Framework:** NestJS v10
- **Database:** MySQL 8.0 via TypeORM 0.3
- **Auth:** JWT (access + refresh tokens) via `@nestjs/jwt` + Passport
- **Validation:** `nestjs-zod` + Zod (no class-validator)
- **API Docs:** Swagger UI at `/api/docs`
- **Scheduler:** `@nestjs/schedule` for cron jobs

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker + Docker Compose

### 2. Setup

```bash
# From project root
cd backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit .env — set your JWT secrets!

# Start MySQL only
docker-compose up mysql -d

# Wait for MySQL to be healthy, then run migrations
npm run migration:run

# Seed taxonomy reference data
npm run seed:taxonomy

# Start in dev mode (hot reload)
npm run start:dev
```

The API is now available at **http://localhost:3001/api**
Swagger docs: **http://localhost:3001/api/docs**

### 3. With Docker (full stack)

```bash
docker-compose --profile full up -d
```

### 4. With Adminer (DB GUI)

```bash
docker-compose --profile dev up adminer -d
# Open http://localhost:8080
# Server: mysql, User: hire_user, Password: hire_pass, DB: hire_israel
```

---

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default: 3306) |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Access token secret (**change in prod!**) |
| `JWT_REFRESH_SECRET` | Refresh token secret (**change in prod!**) |
| `JWT_EXPIRES_IN` | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: 7d) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) |

---

## Migrations

```bash
# Run all pending migrations
npm run migration:run

# Generate a new migration (after editing entities)
npm run migration:generate --name=AddCandidates

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## API Endpoints (Phase 1)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Logout (revoke refresh token) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (org-scoped) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List organizations |
| GET | `/api/organizations/:id` | Get organization |
| POST | `/api/organizations` | Create organization (admin) |
| PATCH | `/api/organizations/:id` | Update organization |
| DELETE | `/api/organizations/:id` | Delete organization (admin) |

### Taxonomy (all public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/taxonomy` | Load all taxonomy at once |
| GET | `/api/taxonomy/domains` | All domains |
| GET | `/api/taxonomy/domains/:id` | Get domain |
| GET | `/api/taxonomy/roles?domain_id=1` | Roles (filtered by domain) |
| GET | `/api/taxonomy/specializations?role_name=X` | Specializations |
| GET | `/api/taxonomy/work-modes` | Work modes |
| GET | `/api/taxonomy/employment-types` | Employment types |
| GET | `/api/taxonomy/experience-levels` | Experience levels |

---

## Auth Flow

### Login
```http
POST /api/auth/login
{ "email": "user@example.com", "password": "secret" }

Response:
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": { "id": "...", "email": "...", "role": "recruiter", ... }
  }
}
```

### Authenticated Requests
```http
GET /api/users
Authorization: Bearer <access_token>
```

### Refresh
```http
POST /api/auth/refresh
{ "refresh_token": "eyJ..." }
```

---

## Filtering & Pagination

All list endpoints support:

```
GET /api/candidates?page=1&limit=20&sort=created_date&order=DESC
GET /api/candidates?filter[status]=active&filter[organization_id]=abc-123
```

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "status": 200,
  "timestamp": "2026-06-30T12:00:00.000Z"
}
```

---

## Project Structure

```
src/
├── main.ts                    # App bootstrap
├── app.module.ts              # Root module
├── auth/                      # JWT auth module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/            # JWT + Local passport strategies
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   └── dto/                   # Zod DTOs for auth
├── common/
│   ├── decorators/            # @CurrentUser, @Roles, @Public
│   ├── entities/              # BaseEntity (id + timestamps)
│   ├── enums/                 # UserRole, OrgType
│   ├── filters/               # Global exception filter
│   ├── interceptors/          # TransformInterceptor (response envelope)
│   └── utils/                 # pagination, filter-parser, rls utils
├── database/
│   ├── database.module.ts     # TypeORM async config
│   └── typeorm.config.ts      # DataSource for CLI migrations
├── migrations/                # TypeORM migration files
├── seeds/                     # Data seed scripts
└── modules/
    ├── users/                 # User entity + CRUD
    ├── organizations/         # Organization entity + CRUD
    └── taxonomy/              # Domain, Role, Specialization, WorkMode, etc.
```

---

## Connecting the Frontend

Update the frontend proxy or `VITE_API_BASE_URL` to point to:
```
http://localhost:3001/api
```

The frontend's `BaseRepository` (`src/api/repositories/baseRepository.ts`) already sends requests to `/api/*` via axios — it works out of the box once the backend is running.

For Base44 compatibility, update `src/api/base44Client.js` with the shim (Phase 5).

---

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Foundation: Auth, Users, Organizations, Taxonomy |
| 2 | 🔜 Next | Candidates, Jobs, Applications, Interviews, Messages, Notifications, Companies |
| 3 | 🔜 | Compensation, Audit, CommunicationLog, Permissions, ImportSources |
| 4 | 🔜 | AI functions, Import, Cron jobs |
| 5 | 🔜 | Frontend migration (Base44 shim → direct HTTP) |
| 6 | 🔜 | Testing, data migration, cutover |

