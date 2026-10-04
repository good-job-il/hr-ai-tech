# Job Imports — миграция существующих данных (шаг 23)

Статус: ✅ этап A выполнен на Northflank по `backend/.env`, read-only; затем publication repair применён к 9 proven jobs и подтверждён before/after. [Результаты inventory](JOB_IMPORT_STEP23_NORTHFLANK_INVENTORY_2026-10-04.md), [repair и оставшиеся решения](JOB_IMPORT_STEP23_DECISIONS_2026-10-04.md). Repair/accepted reconciliation для остальных legacy cohorts не завершён. Общая галочка шага 23 пока не ставится.

## Что уже существует

Миграция `1754200000000-JobImportPlatformDataModel` создала nullable ownership, source records/runs/items, tenant-scoped unique/FK и ownership CHECK для active sources. Миграция `1754000000000-ProvisionJobPublication` оставила backup исходных publication fields. Не создаём второй набор таблиц и не запускаем старые backfill вручную повторно.

Старый backfill использовал URL equality/prefix и существующие organization/client FK. Это не достаточная причина считать каждую source identity подтверждённой: inventory помечает records с `backfilled_from_legacy_job` для review. Ни display name, ни global external ID не являются доказательством клиента/источника.

## Этап A: read-only inventory

Из `backend` после выбора и проверки окружения:

```sh
npm run job-imports:inventory -- --host TARGET_HOST --port TARGET_PORT --database TARGET_DATABASE --public-base-url https://hr-ai.tech --output /ABSOLUTE/PATH/job-import-inventory-before.json
```

Все значения должны точно соответствовать нужной DB connection из `.env`; не копируйте placeholders как реальные настройки. Скрипт проверяет host/port/database **до подключения**, не bootstraps AppModule/scheduler, не запускает migrations/synchronize, использует read-only repeatable-read transaction. Рекомендуется отдельный SELECT-only DB user. Output создаётся с `wx` и mode `0600`: существующий отчёт не перезаписывается.

Отчёт содержит:

- количество всех jobs, soft-deleted jobs, import candidates, sources/records;
- bidirectional Job↔SourceJobRecord и source tenant/client FK consistency;
- duplicate external IDs **внутри tenant-а**; одинаковые IDs разных tenants не предлагаются к merge;
- missing/unavailable client, unsafe active source, publication missing/noncanonical;
- внешний URL, который ещё не сохранён в source record;
- исходный URL из publication backup, который ещё не перенесён;
- legacy backfill review markers и actual database constraints inventory;
- IDs, state/is_closed, fingerprints; без названий, descriptions, raw URLs/query secrets.

Скрипт **не исправляет** findings. Общий отчёт не экспортирует исходные URLs. Не стирайте token-bearing URL перед сохранением защищённого оригинала.

## Этапы B/C: после review before report

Нужен согласованный manifest: job/source IDs, organization ID, AgencyClient company ID, доказательство назначения и reviewer. Для отсутствующих source records сначала подтвердить source identity и external key. Если есть несколько кандидатов — оставить запись в review, не merge автоматически.

Порядок применения для подтверждённой записи:

1. Pause source и остановить конкурирующие apply; не переводить jobs в draft/open/closed.
2. Проверить свежие fingerprint/version/state относительно before report.
3. Сохранить внешний URL в SourceJobRecord; сохранить защищённый before backup. Для URL, уже заменённого старой publication migration, читать оригинал из backup table.
4. Привязать только подтверждённый AgencyClient в той же organization.
5. Provision code/email/platform URL через JobsService domain flow, не прямой SQL publication update. Не вызывать обычный job update без проверки ручных overrides.
6. Записать audit actor/reviewer/evidence и before/after; atomic job+record+audit repair требует отдельного transaction-aware command. Текущий `provisionPublication` не является таким batch repair command — не выдаём его за готовую миграцию.
7. Повторить inventory с новым output filename и сопоставить каждый changed ID. Количество jobs и terminal states должны сохраниться; unexplained differences блокируют следующий этап.

Добавлен узкий `job-imports:repair-publication` runner для proven scoped records с localhost publication; применён к IDs 428–436 с transaction/audit. Он **не допускает** repair vendor URLs/unscoped records/legacy URL-derived backfills. [Evidence и оставшиеся решения](JOB_IMPORT_STEP23_DECISIONS_2026-10-04.md). Универсальный backfill для неоднозначных records пока не добавлен: нужен accepted manifest, backup и rollback strategy.

## Этап D: constraints / shadow acceptance

- Сверить actual constraint inventory с migrations, исправить отсутствие constraints отдельной additive migration после очистки conflicts.
- Active sources обязаны иметь tenant и client; отсутствующие ownership не заполнять фиктивным клиентом ради CHECK.
- Проверить same-tenant unique identity/FK и ON DELETE RESTRICT; не удалять jobs каскадно.
- Legacy direct-write paths запрещены regression suite, но удаление compatibility fields/contracts требует shadow verification и отдельного решения, а не DROP columns сейчас.
- Общая галочка шага 23 возможна только после before/after reconciliation и отсутствия unexplained job count/state changes на выбранной среде.

## Тестирование инструментов

`legacy-import-inventory.spec.ts` проверяет FK conflict, tenant duplicate semantics, legacy backfill review, URL backup gap, invalid public configuration, redaction и отсутствие мутаций входных данных. Это unit coverage инструмента, не доказательство состояния production DB.
