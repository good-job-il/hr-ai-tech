# Hire Israel

Hire Israel is a React/Vite frontend backed by the NestJS API in `backend/`.

## Local development

Prerequisites: Node.js 20+, npm, Docker and Docker Compose.

```bash
npm install
cp .env.example .env.local

cd backend
npm install
cp .env.example .env
docker compose up mysql -d
npm run migration:run
npm run seed:taxonomy
npm run start:dev
```

In another terminal, from the repository root:

```bash
npm run dev
```

The frontend is served at `http://localhost:5173`; its `/api` requests are proxied to `VITE_API_PROXY_TARGET` (default `http://localhost:3001`). Swagger is available at `http://localhost:3001/api/docs`.

## Verification

```bash
npm run release:verify
```

The Phase 8 environment suite additionally requires a clean MySQL database and a
built API:

```bash
cd backend
npm run migration:run
npm run seed:taxonomy
npm run build && npm run start:prod

# From the repository root, while the API is running:
npm run test:phase-8-api
```

The release gate rejects high or critical production dependency vulnerabilities.
Historical migration audits and phase sign-off records are stored in `docs/`.
