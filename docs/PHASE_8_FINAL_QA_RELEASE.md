# Фаза 8. Финальный QA и выпуск

Дата проверки: 16 августа 2026.

## Решение

Release candidate прошёл все доступные автоматизированные проверки и не имеет runtime-, build- или data-path зависимости от Base44. Production deployment намеренно не подписан: внешний browser provider вернул пустой список браузеров, а отзыв provider credentials, production egress и backup/restore могут быть подтверждены только владельцем целевой инфраструктуры. Эти четыре подтверждения сделаны обязательным защищённым release-sign-off gate.

## Что проверено

- `npm run release:verify`: Phase 0–8 static gates, production dependency audit, lint, typed API и JSX compile checks, frontend/backend builds, 4 Jest suites и 23 unit tests.
- Fresh MySQL: 13/13 migrations и taxonomy seed.
- Upgrade MySQL: изолированная pre-upgrade schema, representative candidate data, backfill canonical ownership, проверка сохранности данных и 13/13 migrations; fixture database удаляется после теста.
- API E2E: OpenAPI schemas/security; auth/login/refresh rotation/logout; public/candidate; employer ownership; agency client → job → candidate → pipeline → hire; platform workspace enter/exit; cross-tenant/role isolation; file upload/download; SMTP delivery; CORS; stable AI score; background-job idempotency, automatic/manual retry и tenant isolation; health, request IDs и operational counters.
- Polling failure boundary: активный frontend не использует SSE/WebSocket; polling-контуры обрабатывают ошибки, сохраняют страницу/stale state, показывают recoverable error и очищают timers.
- Network deny fixture запрещает `*.base44.com` для fetch/http/https/net, в том числе при запуске QA API.
- Production dependency audit: 0 high/critical у frontend и backend.
- Repository boundary: отсутствуют Base44 SDK, shim, legacy tree, runtime URLs, entity/function compatibility contracts и tracked local env files.
- High-confidence secret scan: private keys, AWS access keys, GitHub/OpenAI/Slack token patterns.

## Исправления, найденные во время QA

- Публичная регистрация ограничена ролями `candidate`, `employer`, `org_admin`; `organization_id` формируется сервером, privileged staff создаётся через invitations.
- Удалены неиспользуемые и неограниченные application-pipeline endpoints.
- Password-reset token больше не пишется в лог и передаётся через backend-owned email service.
- Backend lint стал реальным non-mutating gate; добавлен Jest runner и unit tests.
- Добавлены `/api/health`, database/background-job probes, `X-Request-Id` и безопасные structured 4xx/5xx events.
- Добавлены operational counters для HTTP 4xx/5xx, auth failures, import failures/enqueued jobs и queue retries.
- Employer job/company ownership и company staff endpoints теперь server-scoped; списки пользователей закрыты от candidate/employer ролей.
- Уязвимый `xlsx` заменён на ExcelJS; обновлены NestJS 11, bcrypt 6, multer 2, Nodemailer 9 и React Router 7; неиспользуемый ReactQuill удалён.

## Остаточные риски и обязательные действия выпуска

1. Выполнить browser matrix на Node 20: public/candidate/employer/agency/admin, desktop/mobile, RTL/LTR, navigation, upload и polling/retry. В текущей сессии browser provider вернул `[]`, поэтому подменять эту проверку другим браузерным инструментом нельзя.
2. Подтвердить owner-side отзыв Base44 credentials и блокировку Base44 domains на egress/DNS уровне; локальный репозиторий принципиально не может доказать состояние внешнего провайдера и production network policy.
3. Backend audit оставляет 2 moderate finding в транзитивном `uuid` ExcelJS. Уязвимые v3/v5/v6 buffer overloads приложением не вызываются; high/critical release gate проходит. Обновить после выпуска совместимой версии ExcelJS.
4. `npm run typecheck:js:strict` сохраняет исторический JS backlog и пока не является release gate; основной `npm run typecheck` проходит typed API и compile проверку всего JSX.
5. Перед production применить обычный backup/restore drill, migrations и smoke/E2E в целевой инфраструктуре. Workflow `.github/workflows/production-release-signoff.yml` потребует все четыре значения `*_VERIFIED`/`*_REVOKED`/`*_BLOCKED=true` в защищённом environment `production`.

## Команды воспроизведения

```bash
npm ci
npm ci --prefix backend
npm run release:verify

npm --prefix backend run migration:run
npm --prefix backend run seed:taxonomy
npm --prefix backend run build
npm --prefix backend run start:prod

# В другом терминале
npm run test:phase-8-api

# В protected production environment, только после внешних проверок
npm run release:attest
```
