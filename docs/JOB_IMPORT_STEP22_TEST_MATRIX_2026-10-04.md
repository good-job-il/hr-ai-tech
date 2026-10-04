# ✅ Job Imports — Step 22 test matrix

Дата: 2026-10-04. Оба release gate завершились с exit code 0. Проверки не обращались к рабочей базе за business mutations.

## Результаты

| Gate | Подтверждённый результат |
| --- | --- |
| Backend `npm run release:job-imports` | ESLint, 73 Jest suites / 468 tests, Nest build; затем 18 MySQL tests |
| Frontend `npm run release:job-imports` | ESLint, strict Hooks lint, TypeScript/API typecheck, 88 domain/hooks checks, Vite build; затем 14 Playwright tests |
| Real database | Отдельный MySQL 8.3 на loopback:33307; реальные миграции и SQL transactions |
| Browser | Chromium, отдельный Vite на loopback:5188; все API ответы из fixtures |

CI обновлён в `backend/.github/workflows/api-ci.yml` и `client/.github/workflows/client-ci.yml`. Backend CI использует MySQL 8.0; frontend CI устанавливает Chromium и сохраняет отчёт/trace при ошибке. Remote CI после push ещё не проверен. Docker compose ниже также ещё не запускался локально: здесь использован отдельный native MySQL, поскольку Docker daemon недоступен.

## Матрица и границы доказательства

| Область | Проверка | Уровень |
| --- | --- | --- |
| Normalize / validate / taxonomy / identity / checksum | JSON/privacy/HTML fragments, mixed Hebrew/English, URLs, aliases, source/tenant namespace, duplicates | Existing domain/connector unit suites |
| Diff / ownership / lifecycle | Three-way conflict, manual override, review policies, missing/full/partial/failed snapshots, filled/manual closed protection, circuit breaker | Domain/service suites; real SQL title override и create/update/close/reopen |
| Connector mapping / health | Generic JSON, JSON-LD, Greenhouse, Lever и поддержанные adapters; malformed/schema/large/pagination/error fixtures | Connector contract suites; real SQL Greenhouse board fixture |
| Migration / identity / staging | Legacy ambiguous source quarantine, job preservation, duplicate key, tenant composite FK, source deletion restriction, down/up operations migration | Real MySQL |
| Preview invariant | Два tenant-а, одинаковые IDs; jobs и applied SourceJobRecords не меняются, staging/run items сохраняются | Real MySQL, existing preview service suites |
| Apply / audit | Canonical client/draft/code/email/public URL; source URL не подменяет platform URL; duplicate apply; transaction failure после job/audit write откатывает всё; retry | Real JobsService + repositories + MySQL |
| Large / partial | 750 items / три страницы; failed middle page не доказывает full snapshot и не меняет jobs | Real persistence, fixture connector transport |
| Scheduler / worker | Atomic concurrent claim, duplicate enqueue, config mismatch, archived client, abandoned recovery, Retry-After, replay после восстановления клиента | Real queue/run persistence + BackgroundJobsService |
| Permissions / HTTP | Resource guard, view/run/review denial, tenant context, bounded pagination/batch, runtime injection, rejection reason, idempotency key | Real Nest HTTP guards/pipes; fixture domain service |
| Authentication / CSRF expectations | Cookie-only cross-origin mutation отвергнута, invalid/expired bearer отвергнут, role/org claims не заменяют server-owned context | Real JwtStrategy/JwtAuthGuard; fixture account repositories. Не отдельная cookie-CSRF защита: API требует bearer |
| SSRF / transport | Loopback/private/link-local/IPv6/mixed DNS, redirect public→private, pinned connection, limits/timeout/429/robots, secret redaction | Existing SafeHttpFetcher security suite, controlled network fixtures |
| Oversize / decompression | Response bytes, content type, compression/security rejection | Fetcher regression suites |
| Platform minimization | Separate native admin scope/allowlist, no raw payload/credentials, bounded metadata | Existing operations service/API safety suites |
| Frontend happy path | EN/HE source→client→connection→sample→mapping→dry-run→confirmation→apply; apply disabled до подтверждения, idempotency key | Real React in Chromium; stateful mock API |
| Frontend exception workflow | Stale conflict cannot approve, reject reason, URL filters preserved; sample failure/retry; pause/resume/explicit archive | Chromium + mock API |
| Provenance / XSS | Imported badge, source/manual field lock, external posting link, archived source не ломает edit; raw HTML только text, не DOM injection | Chromium + mock API; no real job save |
| Responsive / accessibility | EN/HE LTR/RTL, 320/768/1280, no horizontal action loss, keyboard wizard, labelled modal, focus trap, Escape/return focus | Chromium assertions; не полный WCAG audit/screen-reader certification |

### Новые test entry points

- `backend/src/modules/job-imports/job-import-http.e2e.spec.ts`: 15 HTTP boundary tests.
- `backend/src/modules/job-imports/job-import-auth.e2e.spec.ts`: 5 JWT/authentication tests.
- `backend/test/job-imports.mysql-e2e.ts`: 18 real persistence/domain/worker tests.
- `client/e2e/job-imports/workflow.spec.mjs`: 14 browser tests.
- `client/e2e/job-imports/fixture.mjs`: stateful API fixture; unknown API requests получают 501, внешние origins блокируются, запросы не уходят в настоящий backend.

## Безопасный локальный запуск

Нужны установленные project dependencies, Docker Compose и Chromium. Запускайте из указанных каталогов. Эта конфигурация создаёт **только временную тестовую БД**, не использует production compose.

Из `backend`:

```sh
docker compose -p hire-job-import-tests -f compose.job-import-test.yml up -d --wait
NODE_ENV=test JOB_IMPORT_TEST_DB_HOST=127.0.0.1 JOB_IMPORT_TEST_DB_PORT=33307 JOB_IMPORT_TEST_DB_NAME=job_import_e2e JOB_IMPORT_TEST_DB_USER=job_import_test JOB_IMPORT_TEST_DB_PASSWORD=local-e2e-only npm run release:job-imports
```

MySQL suite требует explicit test variables, `NODE_ENV=test`, loopback host, имя `job_import_e2e` и **пустую** БД. При отсутствующих настройках или существующих таблицах падает, а не пропускает тесты. `DB_*` из рабочего `.env` не используются как fallback. Production datasource импортируется для metadata/entities/migrations; подключение создаётся отдельно с test-only credentials.

После проверки остановите отдельный test project:

```sh
docker compose -p hire-job-import-tests -f compose.job-import-test.yml down
```

Данные находятся в tmpfs: остановка уничтожает **только временные test fixtures**. Перед повторным полным SQL suite нужен новый пустой test container. Не запускайте suite на staging/production database и не удаляйте там таблицы ради тестов.

Из `client`:

```sh
npx playwright install chromium
npm run release:job-imports
```

Необходим свободный port 5188. Vite запускается и останавливается самим Playwright; тесты не используют текущий browser login или production account. CI дополнительно устанавливает OS dependencies через `playwright install --with-deps chromium`.

Для отдельных suites:

```sh
# backend: HTTP/JWT
npm run test:job-import:e2e
# backend: MySQL, с теми же explicit test env variables
npm run test:job-import:mysql
# client: browser
npm run test:job-import:e2e
```

## Что этот gate не утверждает

- Browser mock API и SQL domain integration проверяются раздельно; это не единый live browser→AppModule→vendor end-to-end deployment.
- External vendor доступность, DNS/egress production infrastructure и credentials rotation проверяются отдельно от deterministic fixture tests.
- Real SQL operations heartbeat/pause/recovery/replay не подтверждают доставку оповещений внешнему on-call получателю. Staging acceptance шага 21 остаётся отдельной задачей.
- Не выполнялись production rollout, cleanup реальных legacy данных или migration inventory шага 23.
- Зелёные security regressions не заменяют penetration test или независимый security review.
