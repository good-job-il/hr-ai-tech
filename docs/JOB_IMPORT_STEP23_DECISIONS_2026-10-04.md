# Шаг 23 — выполненный repair и оставшиеся решения

> Обновление: пользователь подтвердил вариант 1; 102 scoped jobs уже архивированы без sync. См. [итоговый отчёт](JOB_IMPORT_STEP23_COMPLETION_2026-10-04.md). Ниже сохранён исторический контекст первого inventory; утверждения «не реализовано» и «нужен approval» для этих 102 записей больше не актуальны. Для unassigned/global группы approval на изменение не предоставлялся, данные оставлены без изменений.

## ✅ Что выполнено в Northflank

Подключение — `backend/.env`. Docker не запускался; использовалась ваша реальная Northflank DB.

- Jobs 428–436: localhost public link заменён на canonical `https://hr-ai.tech/jobs/{existing_job_code}` через новый transaction-aware JobsService command.
- Organization 3 / AgencyClient company 42 / source 11 / records 1–9 уже подтверждены FK. Клиент и источник не менялись.
- Job code, состояние draft и is_closed сохранены. Source/apply vendor URLs и normalized payload не изменялись; внешний URL не был перезаписан.
- Каждое изменение + audit — одна transaction, actor user 6 (active native admin), origin `job_import_migration`.
- Before/after: 434 jobs, 128 soft-deleted, 340 import candidates; единственные изменённые fingerprints — IDs 428–436. Ни один import-candidate ID не добавлен/удалён, ни один status/is_closed/is_deleted не изменён.
- Actual tenant unique/FK/CHECK присутствуют. Старые direct job-write paths запрещены regression tests; destructive compatibility cleanup не выполнялся.

Evidence: [before](JOB_IMPORT_INVENTORY_BEFORE_VALIDATED_2026-10-04.json), [repair journal](JOB_IMPORT_STEP23_REPAIR_RESULT_2026-10-04.jsonl), [after](JOB_IMPORT_INVENTORY_AFTER_2026-10-04.json), [shadow reconciliation](JOB_IMPORT_STEP23_SHADOW_RECONCILIATION_2026-10-04.json).

Проверки backend после реализации: **76 suites / 484 tests**, full ESLint и Nest build прошли. Shadow reconciliation engine выполнен на реальных before/after reports: `passed=true`, unexpected/lifecycle/ownership/count changes отсутствуют. [Review manifest с exact IDs](JOB_IMPORT_STEP23_REVIEW_MANIFEST_2026-10-04.json) содержит 203 live unresolved jobs; `approved=false`, business writes запрещены, soft-deleted cohort не восстанавливается.

Повторный запуск repair не должен дублировать audit: уже canonical publication возвращается без save. CLI имеет exact target boundary, native-admin check, bounded selection, durable journal, закрывает внешний URL/stale/legacy-backfilled lane; не bootstraps AppModule или scheduler.

## Что нельзя решить по данным автоматически

| Группа | Уже известные факты | Решение, которого не хватает |
| --- | --- | --- |
| 14 jobs | Org 1 `תעסוקה טובה`, client 16 `חברה אנונימית` | Реальный источник импорта либо подтверждение архивного legacy-import без синхронизации |
| 70 jobs | Та же org, client 17 `חברה מובילה` | То же |
| 18 jobs | Та же org, client 18 `חברה מובילה בהייטק` | То же |
| 100 Jobicy jobs | Source=crawler, отсутствуют organization и client, ссылки Jobicy, не soft-deleted | Глобальный job-board dataset, который не переносим в agency, или реальное подтверждённое назначение tenant/client |
| Job 222 | Source=import, title `English`, company label `שפיר מערכות`, state=open, organization/client отсутствуют | Владелец неизвестен. Нужен owner/client или разрешение оставить в unassigned review без sync |
| 128 soft-deleted jobs | Уже удалены логически; tenant/client неизвестны | Дополнительное решение не требуется: не восстанавливаем, не переassign, не меняем state |

Пять duplicate external-ID groups: 101/105, 106/148, 107/186, 139/150, 143/160. Не auto-merge; сохранить отдельные job identities при legacy archival migration.

У 102 scoped legacy jobs клиент уже доказан, но vendor/source identity не доказана. Назначить source по совпадению title/company или URL prefix означало бы придумать происхождение. Создание **архивного migration bucket** — отдельный безопасный вариант: это не ATS connector и не обещание resync; metadata явно сообщает «original source unknown». Этот вариант пока не реализован и не применён — требуется подтверждение такого product/data решения.

Семь unscoped legacy sources 1–7 уже `needs_attention` и не включены. Оставление записи в review не означает закрытие вакансии. Четыре новых источника 8–11 — draft с доступными client links; activation не выполнялась.

## Конкретно что нужно от пользователя

Если исходные ATS/source URLs известны: сообщить источник для каждой из трёх scoped client groups и реальный owner/client для unassigned jobs. IDs и названия приведены выше; пароль или SQL писать не нужно.

Если эти старые источники неизвестны, предложенный вариант ответа:

> 102 scoped вакансии — сохранить как архивный legacy-import без синхронизации; 100 Jobicy — оставить глобальными вне agency migration; №222 — оставить в unassigned review. Не закрывать и не удалять вакансии.

Это разрешит реализовать оставшуюся migration/review bookkeeping без фиктивного vendor identity или tenant assignment. После реализации: сохранить originals в защищённом migration/provenance storage, provision подтверждённые scoped publication, audit, повторить before/after и проверить ограничения. До этого общая галочка шага 23 не ставится.

## Для общей галочки

1. Все repaired scoped jobs имеют proven AgencyClient и publication; originals сохранены до замены ссылок.
2. Unresolved/global/deleted cohorts явно учтены в accepted reconciliation, а не приписаны клиенту или потеряны.
3. Jobs count/status до и после объяснимы, audit + rollback есть, constraints проверены.
4. Нет legacy write path; shadow checks не находят unexpected changes.

В локальном `backend/.env` добавлен `JOB_PUBLIC_BASE_URL=https://hr-ai.tech`; `FRONTEND_URL=http://localhost:5173` сохранён для local origin/CORS. Это предотвращает localhost publication при следующем запуске backend, который использует Northflank DB. Уже запущенный backend требуется перезапустить; текущий процесс и Northflank deployment из этой задачи не перезапускались. Для отремонтированных rows canonical URL уже записан. Доставка исправленных backend файлов/config в production — отдельный deployment action.
