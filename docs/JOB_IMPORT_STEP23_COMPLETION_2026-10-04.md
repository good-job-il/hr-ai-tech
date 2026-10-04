# ✅ Шаг 23 — завершение миграции подтверждённых agency-вакансий

Дата: 4 октября 2026. База: реальная Northflank из `backend/.env`. Docker и дополнительная MySQL не запускались. Пользователь подтвердил вариант 1: 102 вакансии с доказанными tenant/client сохранить как архивный legacy-import без синхронизации.

## Результат

| Показатель | До | После |
| --- | ---: | ---: |
| Все jobs | 434 | 434 |
| Soft-deleted jobs | 128 | 128 |
| Import sources | 11 | 14 |
| Source job records | 9 | 111 |
| Подтверждённые agency import jobs с provenance | 9 | 111 |

Ранее исправлены publication URLs вакансий 428–436. Теперь 102 scoped legacy jobs обработаны одной транзакцией через JobsService: сохранены оригинальные данные/URL, добавлены source records, восстановлены canonical company/publication fields. Существующие job codes, organization/client, state, is_closed и is_deleted сохранены. Исходные title/description не переписывались; normalization применяется к архивному staging snapshot.

Созданы три архивных источника organization 1: source 12 / client company 16 (14 jobs), source 13 / client 17 (70), source 14 / client 18 (18). Все `archived`, без connector, credentials и расписания; closing policy disabled. Original source identity явно `unknown`. Это migration buckets, не ATS adapters; никакого resync или vendor last successful sync не заявляется.

Identity — tenant/source + `legacy-job:{job_id}`. Пять групп совпадающих legacy external IDs не объединялись. Lifecycle source record `quarantined` отмечает неизвестное происхождение, но не меняет статус Job. Protected original snapshots доступны только в storage, не возвращаются provenance API и не экспортируются в отчёты. В edit UI показывается исторический snapshot, поля доступны для ручного редактирования; кнопка восстановления sync отсутствует и backend также запрещает этот command для legacy archives.

## Исключения — без изменений, без выдуманного ownership

- 100 global Jobicy jobs и job 222 остаются без tenant/client, вне новой agency sync. Их перенос, назначение или закрытие не были разрешены и не выполнялись.
- 128 soft-deleted import jobs не восстанавливались и не переназначались.
- Семь прежних unscoped sources уже disabled/needs_attention; активация не выполнялась. Sources 8–11 остаются draft.
- Остальные 94 non-import jobs не затрагивались.

Итого 340 import candidates = 111 подтверждённых agency jobs + 101 live unassigned/global + 128 soft-deleted. Значение inventory `jobs_requiring_review=239` включает 229 unassigned/deleted записей и 10 предупреждений о legacy duplicate IDs; это не 239 неудачных миграций. Назначение оставшихся global/unassigned records — отдельное решение, не скрытый автоматический backfill.

## Проверки и evidence

- [План exact IDs/checksums](JOB_IMPORT_STEP23_LEGACY_ARCHIVE_PLAN_2026-10-04.json), [commit journal](JOB_IMPORT_STEP23_LEGACY_ARCHIVE_RESULT_2026-10-04.jsonl), [повторный запуск](JOB_IMPORT_STEP23_LEGACY_ARCHIVE_REPLAY_2026-10-04.jsonl).
- [Actual read-only verification](JOB_IMPORT_STEP23_LEGACY_ARCHIVE_VERIFICATION_2026-10-04.json): `passed=true`, originals 102/102; Job audit 102 + ImportSource audit 3, повторный запуск не добавил audit. Проверены canonical publication, disabled sources, checksums, содержимое originals и сохранение остальных job fields.
- [After inventory](JOB_IMPORT_INVENTORY_AFTER_LEGACY_ARCHIVE_2026-10-04.json), [shadow reconciliation](JOB_IMPORT_STEP23_ARCHIVE_SHADOW_RECONCILIATION_2026-10-04.json): changed IDs ровно 102 allowlisted; unexpected changes, count/lifecycle/ownership changes отсутствуют. Предыдущие actual tenant FK/unique/CHECK подтверждены в [первом отчёте](JOB_IMPORT_STEP23_DECISIONS_2026-10-04.md).
- Backend: lint/build, **78 suites / 495 tests** passed. Frontend: полный `release:job-imports` passed, включая lint/hooks/typecheck/build/domain tests и **16 Playwright tests** (fixture-backed API, EN/HE, 320/768/1280, keyboard, archive provenance). Browser tests не являются новым production E2E run.
- Транзакция обеспечивает rollback при ошибке до commit; originals сохранены. Автоматическая отмена уже committed migration не запускалась. Деструктивный cleanup legacy columns и запуск старого crawler запрещены; regression tests исключают direct job-write paths.

Критерий шага 23 выполнен для доказанного agency scope, с явным exception inventory: количество jobs объяснимо, неизвестный tenant/client никому не присвоен, никаких автоматических закрытий. Это не подтверждение готовности последующего shadow rollout (шаг 24).

Deployment backend/client и перезапуск текущих процессов не выполнялись. Чтобы видеть новое архивное provenance в работающем UI, нужны обновлённые backend/client процессы; сами связи и publication уже записаны в Northflank. `JOB_PUBLIC_BASE_URL=https://hr-ai.tech` локально отделён от development FRONTEND_URL; настройки production deployment требуют отдельной проверки.
