# Staffing Agency — Фаза 1: tenant isolation и authorization

Дата реализации: 2 августа 2026

## Реализованные границы

- Agency ownership использует `user.id` в `recruiter_id`, `assigned_to`, `team_manager_id`, `recruitment_manager_id`.
- `organization_id` обязателен для импортов и создаваемых ими Candidate/Application/Document/Timeline записей.
- Org Admin и Recruitment Manager получают organization scope; Team Manager — `team_manager_id=user.id`; Recruiter — `recruiter_id/assigned_to=user.id`.
- Frontend scope уменьшает выборку, но не считается security boundary; RLS остаётся окончательной проверкой.
- Team Manager может открывать только `/agency/team/*`; прямые organization-wide URL возвращают Unauthorized.
- Recruitment Manager не может открыть write-capable organization settings.
- Platform Admin без scoped tenant/impersonation context не проходит `requiredOrgTypes`.
- Permission Matrix ограничена текущим `org_type`; после сохранения runtime cache инвалидируется.
- Org Admin читает global templates своего `org_type`, но создаёт и изменяет только overrides своей организации.
- Create/update/delete и pipeline stage actions скрываются или блокируются согласно effective Permission Matrix на подключённых экранах.
- CV preview/download проверяет tenant и role ownership на backend.
- Импорт, duplicate detection и обработка резюме используют tenant-scoped service-role запросы; unscoped platform admin отклоняется.
- Pipeline, candidate list, Permission Matrix и Role Settings различают 403 и реальное отсутствие данных.

## Миграция legacy email ownership

Функция: `migrateAgencyOwnershipIds`.

Она обрабатывает `Candidate`, `Application`, `Job`, `Interview`, `CompensationPlan`, `CandidateImportBatch`, работает только внутри scoped `organization_id` и доступна Org Admin или scoped platform admin.

1. Сначала вызвать с `{ "dry_run": true }`.
2. Проверить `unresolved`: каждый email должен соответствовать User текущего tenant.
3. Исправить отсутствующих пользователей/назначения.
4. Вызвать с `{ "dry_run": false }`.
5. Повторить dry-run; ожидается `fields_changed: 0`.

Функция идемпотентна: значения, уже содержащие ID, не изменяются. Commit-run записывает AuditLog.

Для NestJS/MySQL аналогичная структурная миграция находится в
`backend/src/migrations/1752100000000-AgencyOwnershipScope.ts`. Перед применением
нужна резервная копия базы и rehearsal на staging:

```bash
cd backend
npm run migration:show
npm run migration:run
```

Миграция добавляет manager ownership к jobs/import batches, переводит
`Interview.recruiter_id` в integer ID и backfill-ит доступные связи через `users`.
Она не запускается автоматически при сборке.

## Автоматическая проверка access contract

Команда:

```bash
npm run test:agency-access
```

Проверяются organization, team и own scope, cross-tenant denial, cross-team denial, чужой recruiter record и отсутствие неявного platform-admin доступа.

## Ограничения следующей итерации

- Реальный browser E2E требует четырёх авторизованных тестовых аккаунтов и запущенного backend.
- SQL/Base44 ownership migrations подготовлены, но намеренно не применялись к пользовательской базе автоматически.
- Старые записи без `organization_id` намеренно не подхватываются автоматически: для них нужна отдельная контролируемая tenant attribution migration.
- Employer email ownership остаётся только в legacy company/employer flows и не используется как agency ownership.
