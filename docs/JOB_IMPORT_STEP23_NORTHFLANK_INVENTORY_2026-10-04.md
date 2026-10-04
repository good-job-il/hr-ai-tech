# ✅ Шаг 23 / этап A — Northflank inventory

Дата: 2026-10-04. Цель: подключение из `backend/.env`, подтверждённое пользователем как используемая Northflank DB. Staging/production classification отдельно не подтверждена, поэтому обращались как к рабочей БД: **только READ ONLY / SELECT**, без migrations, UPDATE, repair, scheduler/apply.

Canonical target URL для проверки: `https://hr-ai.tech`. В текущем `.env` frontend/public URL указывает на `http://localhost:5173`; настройки не изменены.

Основной machine-readable before report: [validated inventory](JOB_IMPORT_INVENTORY_BEFORE_VALIDATED_2026-10-04.json). Первичный `JOB_IMPORT_INVENTORY_BEFORE_2026-10-04.json` **superseded**: он неправильно трактовал computed MySQL flag `"0"` как true и смешивал localhost platform publication с vendor URLs. После нормализации и regression tests inventory повторён read-only. Первичный отчёт оставлен для traceability, использовать его для repair нельзя.

## Counts

| Факт | Количество |
| --- | ---: |
| Все jobs | 434 |
| Soft-deleted jobs | 128 |
| Не soft-deleted jobs (все источники) | 306 |
| Import candidates, включая soft-deleted | 340 |
| Не soft-deleted import candidates | 212 |
| Import sources | 11 |
| Source records | 9 |
| Jobs с согласованной bidirectional record/source/tenant/client связью | 9 |
| Duplicate external-ID groups внутри tenant scope | 5 (10 jobs) |

Import candidate = source import/crawler/api **или** external_id/source_job_record_id присутствует. Поэтому это не 340 активных вакансий и не 340 доказанных legacy imports. Duplicate external ID — finding для review, не доказанный дубль и не разрешение merge.

## Findings

| Issue | Все import candidates | Не soft-deleted |
| --- | ---: | ---: |
| Source identity требует review | 331 | 203 |
| Organization + client link отсутствуют | 229 | 101 |
| Localhost platform public URL | 240 | 112 |
| Внешний apply URL / отсутствующая publication | 100 | 100 |
| Внешний URL ещё не сохранён в source record | 100 | 100 |
| Original URL в publication backup не перенесён в record | 129 | 1 |
| Повторяющийся external ID | 10 | 10 |

Rows пересекаются; их нельзя складывать как число разных jobs. Все 340 candidates имеют хотя бы одно finding, в том числе 9 уже связанных records из-за local platform URL.

Read-only aggregate уточнил origins: 240 `http://localhost:5173`, 100 `https://jobicy.com`; все 240 localhost URLs имеют platform `/jobs/{job_code}` path. Не следует копировать localhost public link в source record как vendor URL.

Все 26 AgencyClient relationships имеют `active`, связанная company не soft-deleted. Четыре scoped sources (8–11) имеют доступных клиентов и находятся в `draft`. Семь unscoped sources (1–7) уже `needs_attention`, не flagged как unsafe active; их ownership не угадывался и состояние не менялось.

Tenant FK/unique/CHECK присутствуют в actual constraint inventory: source organization/client FK, active ownership CHECK, source record tenant/external-key UNIQUE, scoped job/record/source FKs, unique job code и job-source-record. Эта проверка подтверждает наличие constraints; не повторяет destructive DDL и не доказывает каждый referential action — определения уже проверялись изолированными MySQL tests шага 22.

## Следующий безопасный этап

1. Подтвердить organization/AgencyClient/source identity для 101 live unscoped candidate; не назначать автоматически организации текущего пользователя.
2. Для 203 live candidates с неподтверждённой source identity собрать evidence/manifest, включая duplicate groups.
3. Сохранить 100 внешних source URLs и 1 live original URL из backup **до** canonical publication repair.
4. Восстановить 112 localhost public links и provision 100 отсутствующих publication через transaction-aware JobsService repair после review.
5. Не восстанавливать soft-deleted jobs и не менять open/closed/filled/draft. Before/after counts и состояние каждого repaired ID обязательны.

Этапы B/C/D в целом не отмечены готовыми: реальные backfill/repair и after reconciliation не выполнялись. Только этап A завершён.

Проверки инструмента после исправлений: 8 unit tests, targeted ESLint; backend build проверяется отдельно. Credentials/query secrets не попадают в отчёт.
