# Job Imports — monitoring и operations

## Delivery / безопасное включение

Новая migration: `1754800000000-JobImportOperations` (alerts, idempotent operations, monitor heartbeat). Она не меняет jobs/sources/permissions/feature flags. Down удаляет только новые operational tables; перед rollback экспортировать alerts/operations, если историю нужно сохранить. Migration в рабочую БД в рамках реализации не запускалась.

1. Проверить pending migrations и backup, применить миграцию уполномоченным оператором.
2. `JOB_IMPORT_OPERATIONS_USER_IDS=...`: явно разрешённые **native platform admin IDs**. Impersonated admin и tenant roles не допускаются. Дополнительно требуется backend permission `manage_settings`; agency `job_imports.view` не даёт cross-tenant доступ.
3. После миграции включить `JOB_IMPORT_ALERTS_ENABLED=true` на backend, где работает Nest scheduler. Scanner каждые 5 минут; advisory lock сериализует scanner instances на одном MySQL server. По умолчанию выключен, чтобы deployment не пытался писать в отсутствующие таблицы.
4. Проверить `/platform/operations/job-imports`: monitor enabled, свежий last scan, metrics, alerts, product events. Отдельные API: `GET /platform-support/job-imports/{metrics,alerts,analytics}`. Metrics/analytics: `hours=1..168` (default 24); alerts: `page`, `limit<=100`.
5. Подключить существующий production log drain/alert manager к structured log `event=job_import_alert`, critical → on-call; warning → operations inbox. `job_import_alert_scan_failed` и отсутствие heartbeat >15 минут — отдельная monitoring outage. Внешний Slack/email/pager канал автоматически не создаётся: routing/получатели должны быть согласованы Operations.
6. На изолированном staging tenant воспроизвести parser regression двух sources одной версии; проверить alert, read-only pause preview, подтверждённую pause, блок queued runs/новых apply items, успешный replay после исправления. На production массовые mutations для QA запрещены.

## Метрики и определения

- Run statuses/mode и connector/version, average/max duration, list pages, raw items, HTTP attempts/observed bytes/duration, retry count и rate-limit failures.
- `success` означает завершённый scan, а не успешную публикацию. Preview никогда не меняет jobs. Partial учитывается отдельно; apply результаты видны в items.
- HTTP telemetry учитывает detail/redirect запросы в run budget; bytes — наблюдаемые ответы, не размер недочитанного body. Robots cache/service checks остаются в общих HTTP counters. При failed later page сохраняется telemetry уже полученных страниц и выполненных запросов. Run telemetry относится к последней попытке; retry/rate-limit counters сохраняются между попытками.
- Quality denominator — число staged run items в окне создания runs; quarantine = proposed `error`, duplicate = validation code с `DUPLICATE`, conflicts = manual override/current job conflict codes. Это доли observations, не уникальных вакансий.
- Proposed closes берутся из pre-breaker reconciliation safety metadata; applied closes — item `close` со status `applied`. Эти значения не означают, что все предложения разрешены к выполнению.
- Metrics группируются по connector/version (runs также по mode), без source URLs, names, raw/normalized payload, credentials и actor email. Freshness исключает draft/paused/archived/manual-only sources.
- SQL aggregates вычисляются по persistent tables, не сбрасываются при рестарте. История ограничивается выбранным временным окном. При большом объёме следить за latency и EXPLAIN на staging; materialized rollups — отдельная оптимизация, не скрытое ограничение первых N records.

## Alerts / thresholds

| Code | Условие | Действие |
|---|---|---|
| SOURCE_STALE | Последний success/создание старше max(24h, 2×interval), scheduled active source | Проверить worker, очередь, next run и error |
| AUTH_REQUIRED | Последний run требует auth | Rotate/reconnect credentials |
| REPEATED_PARSER_FAILURE | ≥3 parser/mapping/format/partial errors за 24h и последний run всё ещё имеет такой error | Pause affected version, исправить fixture/parser |
| CONNECTOR_FAILURE_SPIKE | ≥5 terminal runs за час, ≥50% failed/partial, ≥2 affected sources | Проверить version regression; critical on-call |
| ANOMALOUS_EMPTY_SNAPSHOT | Последний usable scan содержит 0 items, full-success baseline за 30 дней ≥20 | Не подтверждать closes; pause/review |
| DEAD_LETTER_RUN | Dead-letter за последние 24h | Разобрать permanent/retryable reason, replay после исправления |
| HIGH_REVIEW_QUARANTINE_RATE | ≥10 staged items за 24h, (review+error)/items ≥30% | Mapping/quality review, не bulk approve |

Alerts имеют stable key: tenant+source+code или connector+version+code. Повторный scan обновляет evidence/last_seen без повторного log event. После исчезновения условия alert resolved; recurrence снова выдаёт log event. Scanner commit предшествует уведомлению, lock освобождается после commit. Log delivery не является transactional outbox: crash между commit и log может потерять внешнее уведомление, поэтому alerts API/heartbeat должны также опрашиваться внешним монитором. Alert не закрывает jobs и не auto-pauses sources.

## Диагностика connector errors

1. Сопоставить connector type/version, organization/source/run IDs, typed code, status/completeness, page/item counts и config/mapping versions. Pause selector учитывает source version и последнюю run version той же configuration: stale source metadata после deploy не скрывает затронутый source. Всегда проверить affected summary.
2. `AUTH_REQUIRED` → credentials; `RATE_LIMITED` → Retry-After/domain limits; `SECURITY_REJECTED` → проверить URL/egress policy, **не обходить SSRF boundary**; `PARSER_CHANGED/MAPPING_INVALID` → immutable fixture и connector contract tests.
3. Не копировать tokenized URLs, secrets или raw candidates в incident ticket/logs. Raw sample смотреть только через tenant workflow с нужной permission, а не cross-tenant health endpoint.

## Pause exact connector version

1. Read-only `POST /platform-support/job-imports/pause-connector/preview`:

```json
{"connector_type":"generic_json","connector_version":"1.0.0"}
```

Можно добавить `organization_id` для одного tenant. Результат содержит только IDs/state/config version, affected count и consequence. Если >500, разбить по organization; не игнорировать лимит.

2. Подтвердить точную версию, tenants и количество в incident. Затем `POST /platform-support/job-imports/pause-connector`:

```json
{"connector_type":"generic_json","connector_version":"1.0.0","expected_count":2,"confirm":true,"reason":"Confirmed parser regression INC-123","idempotency_key":"incident-123-pause-v1"}
```

3. Changed count → 409, повторить preview и получить новое подтверждение. Exact idempotency replay возвращает прежний result; reuse key с другим payload/actor → 409. Источники paused, schedule cleared, config version incremented, tenant audit записан в той же transaction. Jobs не удаляются и не закрываются. Source row locks сериализуют pause с новой apply-item transaction; уже committed item не откатывается, in-flight item завершится до pause commit.
4. Проверить source state и очередь. Оставшиеся queued runs отменяются существующим worker из-за paused/version mismatch. Running read-only scan может закончиться, но не может применить jobs после pause. Нельзя обещать отмену уже отправленного внешнего HTTP request.

## Replay / mapping migration / parser recovery

1. Зафиксировать affected version и baseline, pause перед deploy. После исправления adapter восстановить выбранные источники **в draft**, без запуска schedule: `POST /platform-support/job-imports/restore-to-draft`, body `{pause_idempotency_key, source_ids, confirm:true, reason, idempotency_key}`. Не более 100 IDs; только источники исходной incident-pause операции с неизменённой paused/config version. Изменённые после pause источники требуют отдельного tenant review (409), не force restore. Старые onboarding discovery/preview references очищаются, wizard возвращается к проверке client; новая preview обязательна.
2. Исправить adapter и immutable fixtures; bump connector version при parser change. После restore-to-draft mapping/defaults менять только через tenant source PATCH (configuration version увеличивается, изменение configuration/connector повышает mapping version на сервере), не прямым SQL в jobs. Не передавать runtime `mapping_version` в public DTO.
3. Для новой версии проверить nullable/ambiguous ownership, actual AgencyClient и assignments. Старая queued configuration не должна исполняться. Обновить source configuration через штатный API, чтобы source.connector_version соответствовал установленному adapter.
4. Read-only preview; full snapshot proof, expected volume/quality и field diff. Circuit breaker снимается только review workflow с summary affected jobs, не через изменение internal JSON в БД.
5. `POST /import-runs/:id/replay` с новым idempotency key или новый preview при mapping change. Failed item: `POST /import-run-items/:id/retry` с review permission. Replay не означает apply.
6. Подтверждённый apply drafts; затем tenant resume через `POST /import-sources/:id/resume`, только если client доступен и выполнен подтверждённый run. Нет массового автоматического resume.

## False close / cross-tenant suspicion

1. Incident commander останавливает affected version(s)/tenants через подтверждённую pause. Сохранить run IDs, typed errors, audit timestamps, backup references; не публиковать raw/credentials.
2. Не выполнять global `external_id`/`apply_url` updates и не исправлять ownership по display name. Проверить `(organization_id, source_id, external_key)` и canonical client.
3. False close восстанавливать через JobsService/domain UI после проверки provenance, source-close reason, manual overrides и manual filled/closed terminal state. Нельзя массово reopen всех closed jobs или откатывать jobs SQL без review.
4. Cross-tenant suspicion: security owner проверяет RLS/permissions/domain commands и affected tenants на изолированном snapshot. До подтверждённого containment не resume/apply.
5. Restore после parser fix — staged read-only diff + targeted review + audited domain mutation. Сообщения клиентам и backup restore требуют отдельного согласования.

## Credentials rotation

1. Pause source; rotate/revoke credential у vendor/secret manager, проверить старый credential revoked. Для incident-paused source использовать restore-to-draft перед reconnect. Для штатной tenant pause ранее подтверждённого source сначала установить Manual only (`interval_hours=0`), затем явный resume для диагностического preview; scheduler не запустится. Не включать прежний interval до успешной проверки.
2. Секрет хранить в secret store; `credential_reference` — ссылка, не секрет. Tenant command `POST /import-sources/:id/reconnect-credentials` доступен только `manage_credentials`.
3. Connection/discovery и preview, затем подтверждение и resume. Не передавать secrets через operations reason/logs или source configuration JSON.

## Product analytics contract

Server-persisted events: `source_add_started` (draft создан, не просто открыта форма), `connector_detected`, `connection_tested` (успешный discover), `mapping_changed`, `dry_run_reviewed` (persisted переход wizard на confirmation), `review_item_resolved` (approve/reject), `manual_override_created`, `source_paused`, `auth_reconnected`.

`preview_completed` и `run_failed` вычисляются из terminal runs; `run_completed` = завершённый apply attempt, независимо от item errors; `first_import_confirmed` = первое confirmed_at на source, не первая успешная публикация. События не выдумываются для прошлых audit без product_event. Счётчики показывают events, не уникальных пользователей/конверсии; `review_item_resolved` считает items, включая batch resolution, но не повторный idempotent replay или промежуточную correction/link. Нет браузерного raw-payload analytics и передачи данных стороннему провайдеру.

## Verification boundary

Unit/contract/regression проверки используют fake repositories/query runners и fixtures. Живые SQL aggregates, scanner heartbeat, alert-manager delivery, массовая pause и replay требуют staging acceptance после migration. Production alerts/operations не включены автоматически и production jobs не использовались для этих mutations.
