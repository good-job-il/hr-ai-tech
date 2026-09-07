# Hire Israel — Client

React/Vite client for Hire Israel. The NestJS API lives in the separate
[`good-job-il/hr-ai-tech-api`](https://github.com/good-job-il/hr-ai-tech-api)
repository.

## Local development

Prerequisites: Node.js 20+ and npm. Run the API locally on port `3001`, then:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The client is available at `http://localhost:5173`. By default it calls `/api`,
which the Vite development server proxies to `http://localhost:3001`.

Environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Browser-facing API base URL, including `/api`; defaults to `/api` locally |
| `VITE_API_PROXY_TARGET` | API origin used only by the local Vite proxy |

## Vercel deployment

Import this repository into Vercel and use the Vite defaults:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm ci`

Set `VITE_API_BASE_URL` for Production and Preview to the public API URL,
including the `/api` prefix:

```text
VITE_API_BASE_URL=https://your-api-host.example/api
```

After changing this variable, redeploy the client because Vite embeds it at
build time. The API must allow each Vercel deployment origin through CORS.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:tm4:frontend
npm run test:rm4:frontend
npm run test:r4:frontend
npm run build
```

GitHub Actions runs the same checks for pull requests and pushes to `main`.
