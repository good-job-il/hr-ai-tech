# Пошаговый план реализации импорта вакансий

**Дата:** 16 сентября 2026  
**Основание:** [`JOB_IMPORT_PRODUCT_RESEARCH_2026-09-15.md`](./JOB_IMPORT_PRODUCT_RESEARCH_2026-09-15.md)  
**Цель:** превратить существующий crawler prototype в tenant-safe продукт импорта вакансий с preview, staging, diff, review, применением через job domain workflow и безопасной синхронизацией.

## 1. Результат, к которому должен привести план

Пользователь агентства должен пройти следующий путь:

1. Открыть раздел импорта вакансий.
2. Выбрать AgencyClient и вставить URL либо выбрать ATS.
3. Проверить соединение и увидеть распознанный тип источника.
4. Посмотреть sample нормализованных вакансий без изменения рабочих данных.
5. Настроить defaults и правила синхронизации.
6. Получить dry-run с группами create/update/close/skip/review.
7. Подтвердить импорт в drafts.
8. Наблюдать состояние автоматических синхронизаций.
9. Разбирать только ошибки, конфликты и low-confidence записи.
10. В любой вакансии видеть источник, последнюю синхронизацию и защищённые ручные изменения.

## 2. Зафиксированные решения для MVP

Чтобы реализация не блокировалась на продуктовых развилках, MVP строится со следующими defaults:

| Решение                  | MVP default                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Принадлежность источника | Один `ImportSource` принадлежит одному organization и одному `AgencyClient`                         |
| Первичная публикация     | Новые вакансии создаются как `draft`                                                                |
| Первый запуск            | Только dry-run и явное подтверждение                                                                |
| Повторные синхронизации  | Автоматически применяются только безопасные source-owned изменения                                  |
| Ручные правки            | После ручного изменения поле не перезаписывается без review                                         |
| Apply flow               | Canonical Hire Israel URL остаётся в `jobs.apply_url`; внешние URLs хранятся отдельно               |
| Закрытие                 | Только после полного успешного snapshot или explicit vendor status                                  |
| HTML missing             | Proposed default: два полных успешных missing observations и grace period; значение конфигурируемое |
| Manual `filled/closed`   | Никогда не reopening автоматически                                                                  |
| Первые connectors        | Generic JSON, JSON-LD, Greenhouse, Lever                                                            |
| Generic HTML             | Operator-managed beta, не self-service MVP                                                          |
| Browser rendering        | Не входит в MVP                                                                                     |
| Credentials              | Только encrypted secret reference, не в source JSON/logs                                            |

Если одно из этих решений меняется, это нужно сделать до проектирования соответствующей таблицы/API, а не во время реализации UI.

## 3. Общая последовательность

```text
Safety freeze
  → contracts and permissions
  → database foundation
  → tenant-safe source CRUD
  → connector SDK and secure fetch
  → read-only preview/staging
  → diff and domain apply
  → reconciliation and field ownership
  → worker/scheduler hardening
  → API completion
  → agency UI
  → connectors
  → shadow rollout
  → production rollout
```

До завершения staging и domain apply нельзя добавлять новые production scrapers: они закрепят неправильную direct-to-jobs модель.

---

## ✅ Шаг 0. Подготовить delivery boundary

**Статус: выполнено 16 сентября 2026.** Добавлены default-off feature flags и platform-admin override contract, зафиксированы scope/роли/запрещённые действия и accountable owners, подготовлены release checklist и operational ticket, безопасный non-production seed для staging organization с двумя AgencyClient, а также inventory из 12 публичных source references с детерминированными локальными fixtures. Backend/frontend contracts покрыты тестами; production guard seed-а проверен.

Артефакты:

- [`JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md`](./JOB_IMPORT_DELIVERY_BOUNDARY_2026-09-16.md);
- [`JOB_IMPORT_OPERATIONAL_TICKET_2026-09-16.md`](./JOB_IMPORT_OPERATIONAL_TICKET_2026-09-16.md);
- [`JOB_IMPORT_RELEASE_CHECKLIST_2026-09-16.md`](./JOB_IMPORT_RELEASE_CHECKLIST_2026-09-16.md);
- [`backend/src/fixtures/job-imports/source-inventory.json`](../../backend/src/fixtures/job-imports/source-inventory.json);
- [`backend/src/seeds/job-import-staging.seed.ts`](../../backend/src/seeds/job-import-staging.seed.ts).

### Цель

Зафиксировать scope, владельцев и способ безопасного включения функции.

### Работы

- Создать feature flags:
  - `job_imports_enabled` — видимость раздела для tenant-а;
  - `job_imports_auto_apply_enabled` — разрешение scheduled apply;
  - `job_imports_html_beta_enabled` — доступ к generic HTML beta.
- Назначить владельцев:
  - backend import platform;
  - frontend workflow;
  - data migration;
  - security review;
  - product acceptance;
  - production operations.
- Зафиксировать список поддержанных ролей:
  - `org_admin`: полный source management;
  - `recruitment_manager`: view/run/review, без credentials и destructive configuration по умолчанию;
  - `team_manager`: view/review только назначенных источников, если это войдёт в MVP;
  - `recruiter`: provenance read-only;
  - platform support: cross-tenant health metadata без raw payload/credentials и только с отдельным permission.
- Подготовить отдельную staging organization и минимум двух AgencyClient для E2E.
- Собрать 10–20 реальных обезличенных source URLs и fixtures.

### Артефакты

- release checklist;
- владельцы в operational ticket;
- feature-flag contract;
- test tenants и fixture inventory.

### Критерий завершения

Команда одинаково понимает MVP, роли, rollout и запрещённые до production действия.

---

## ✅ Шаг 1. Немедленно сделать текущую функцию безопасной

**Статус:** выполнено 2026-09-16.

Реализованный safety boundary:

- `POST /import-sources/preview` и ручной source run возвращают `501` и не вызывают crawler/queue;
- scheduler не запускает legacy sources, а уже поставленная legacy-задача завершается как `failed` без записи вакансий;
- create source по умолчанию создаёт выключенный источник без расписания;
- public update DTO принимает только editable-поля и отклоняет runtime counters/status/log/retry metadata;
- поиск существующей вакансии по `external_id` и `apply_url` всегда включает `organization_id`, а crawler без organization запрещён;
- orphaned legacy UI не подключён к production routes; execution controls заблокированы, unsupported promises/providers удалены, добавлено safety-warning;
- добавлены backend regression-тесты safety boundary и frontend static safety contract.

### Цель

Устранить действия, которые могут незаметно изменить или повредить данные до большой переработки.

### Backend

- Отключить текущий `POST /import-sources/preview` либо временно вернуть `501/feature disabled`.
- Не вызывать `crawlCareerPage` из preview endpoint.
- Запретить public update DTO изменять:
  - `last_sync`;
  - `last_sync_status`;
  - `last_error`;
  - counters;
  - logs;
  - retry metadata.
- Временно отключить scheduled source execution, если source нельзя однозначно связать с tenant и клиентом.
- Добавить guard: crawler не обновляет job другой organization даже до полной миграции.
- Запретить direct update по глобальному `external_id` или `apply_url` без organization scope.

### Frontend

- Убрать обещания «без сохранения», «все страницы» и неработающие provider capabilities.
- Не подключать orphaned pages к production navigation на этом шаге.
- Если UI нужен для разработчиков, показывать его только под dev flag и с заметным предупреждением о read-only состоянии.

### Тесты

- Preview request не меняет число/содержимое jobs.
- Update source DTO отклоняет runtime fields.
- Source run не может обновить job другой organization.
- Scheduler не запускает legacy unscoped source.

### Критерий завершения

Ни одно действие с названием preview/test не изменяет рабочие вакансии; cross-tenant update невозможен.

---

## ✅ Шаг 2. Зафиксировать доменные и API-контракты

**Статус:** выполнено 2026-09-16.

Результат:

- строгие Zod-схемы являются единым runtime/TypeScript source of truth для connector, source, run, snapshot, lifecycle, action, error, ownership и canonical normalized job;
- `NormalizedSourceJob` разделяет employment type/work mode, хранит structured locations, constraints, taxonomy, experience, skills, salary, source URLs/status/dates, field provenance/confidence и SHA-256 checksum;
- typed import errors имеют стабильный machine code, retry metadata и безопасный scalar context;
- Permission Matrix расширена отдельным deny-by-default resource `job_imports` с actions `view/create/update/run/review/manage_credentials/archive`;
- backend resource guard защищает source CRUD и run/preview endpoints; frontend получил только UX helper `canResource`;
- partial resource permission update не сбрасывает существующие global/resource permissions;
- контракт и правила совместимости зафиксированы в [`JOB_IMPORT_DOMAIN_API_CONTRACT_2026-09-16.md`](./JOB_IMPORT_DOMAIN_API_CONTRACT_2026-09-16.md).

### Цель

Определить типы и lifecycle до создания таблиц и UI.

### Работы

Создать backend domain types:

- `ConnectorType`;
- `ConnectorCapability`;
- `ImportSourceState`;
- `ImportRunMode = preview | apply`;
- `ImportRunStatus = pending | running | completed | partial | failed | cancelled`;
- `SnapshotCompleteness = full | incremental | partial | failed`;
- `SourceJobLifecycle`;
- `ImportAction = create | update | close | reopen | skip | review | error`;
- `ImportErrorCode`;
- `FieldOwnership`;
- `NormalizedSourceJob`.

Зафиксировать canonical `NormalizedSourceJob`:

- external key;
- title, source company label;
- description;
- employment type и work mode отдельно;
- locations и remote applicant constraints;
- category/domain/specialization;
- seniority/experience;
- required/preferred skills;
- salary/currency/period;
- source posting/apply URLs;
- source status;
- posted/updated/valid-through dates;
- provenance/confidence по полям;
- raw checksum.

Зафиксировать typed errors, например:

- `AUTH_REQUIRED`;
- `SOURCE_FORBIDDEN`;
- `ROBOTS_DENIED`;
- `RATE_LIMITED`;
- `UNSUPPORTED_FORMAT`;
- `PARSER_CHANGED`;
- `MAPPING_INVALID`;
- `PARTIAL_SNAPSHOT`;
- `CLIENT_UNAVAILABLE`;
- `DUPLICATE_CONFLICT`;
- `SECURITY_REJECTED`.

### Permission Matrix

Добавить отдельный resource `job_imports` с actions:

- `view`;
- `create`;
- `update`;
- `run`;
- `review`;
- `manage_credentials`;
- `archive`.

Backend guard является источником истины; frontend permissions только управляют UX.

### Критерий завершения

Контракты согласованы, сериализуются без `any`, имеют unit tests и используются как основа следующих миграций.

---

## ✅ Шаг 3. Создать новую модель данных

**Статус:** выполнено 2026-09-16.

Результат:

- `import_sources` получил lifecycle/configuration/health/scheduling/assignment поля, tenant/client ownership и индексы; состояние `active` невозможно без organization и canonical AgencyClient;
- созданы tenant-scoped `source_job_records`, `job_import_runs` и `job_import_run_items` с composite foreign keys, typed JSON payloads, confidence/validation metadata и воспроизводимым before/after/diff;
- identity внешней вакансии закреплена unique constraint `(organization_id, import_source_id, external_key)`, а cross-tenant связи run/record/job блокируются базой данных;
- `jobs.source_job_record_id` добавлен как nullable unique composite FK; `jobs.external_id` оставлен только для legacy compatibility, canonical `jobs.apply_url` миграция не переписывает;
- внешний posting/apply URL хранится в source record и доступен через защищённый `GET /jobs/:id/import-provenance` без выдачи raw payload;
- backfill назначает ownership и создаёт staging record только при доказуемой связи source URL + external key + существующий AgencyClient; для ранее канонизированных `jobs.apply_url` используется сохранённый original URL из publication backup; ambiguous/unmatched sources становятся `needs_attention`, доказуемые — безопасно `paused`;
- удаление source заменено архивированием; FK используют `RESTRICT`, поэтому source/archive flow не удаляет существующие jobs;
- migration `1754200000000-JobImportPlatformDataModel` проверена на MySQL 8 в цикле `up → down → legacy fixtures → up`, включая collision, ambiguous ownership и cross-tenant negative tests.
- URL backfill явно нормализует mixed `utf8mb4_bin`/`utf8mb4_unicode_ci` comparisons; migration resume guard безопасно продолжает повторный запуск после уже закоммиченной MySQL DDL-фазы `import_sources`.

### Цель

Добавить tenant ownership, staging, runs и воспроизводимый diff.

### 3.1 Изменить `import_sources`

Добавить:

- `organization_id` — required после backfill;
- `employer_company_id` — canonical AgencyClient company;
- `connector_type` и `connector_version`;
- `state` (`draft`, `active`, `paused`, `needs_attention`, `archived`);
- `configuration` JSON без secrets;
- `credential_reference` nullable;
- `publish_policy`;
- assignment defaults;
- closing policy/grace settings;
- locale/timezone;
- `last_attempt_at`, `last_success_at`, `next_run_at`;
- `health_state`, `health_error_code`;
- configuration/mapping version.

Добавить indexes по organization, client, state, next run.

### 3.2 Создать `source_job_records`

Поля:

- tenant/source identity;
- `external_key`;
- normalized payload JSON;
- raw snapshot reference/checksum;
- source posting/apply URLs;
- field provenance/confidence;
- validation issues;
- lifecycle;
- linked `job_id`;
- `first_seen_at`, `last_seen_at`;
- `last_seen_successful_run_id`;
- consecutive missing count;
- source/manual state metadata.

Unique constraint: `(organization_id, import_source_id, external_key)`.

### 3.3 Создать `job_import_runs`

Поля:

- organization/source/requested-by;
- mode/status/snapshot completeness;
- connector, mapping и configuration versions;
- cursor/pages/items/HTTP metrics;
- counts create/update/close/reopen/skip/review/error;
- started/completed timestamps;
- typed error и retry metadata;
- confirmation/apply metadata.

### 3.4 Создать `job_import_run_items`

Поля:

- run/source-record/job IDs;
- proposed action;
- normalized candidate;
- before/after/diff JSON;
- validation issues;
- confidence;
- resolution/status;
- applied transaction/timestamp;
- reviewer and review reason.

### 3.5 Связь с jobs

- Canonical `jobs.apply_url` оставить platform public URL.
- Внешние URLs хранить в `source_job_records` и возвращать в job provenance API.
- При необходимости быстрого join добавить nullable `source_job_record_id` в jobs с unique FK.
- Не использовать `jobs.external_id` как новую глобальную identity; оставить только для legacy compatibility и постепенно вывести из импортной логики.

### Migration strategy

1. Создать nullable ownership columns и новые таблицы.
2. Попытаться backfill source organization/client только при однозначной связи.
3. Неоднозначные legacy sources перевести в `paused/needs_attention`.
4. Backfill source records для уже импортированных jobs только при доказуемом source identity.
5. Не угадывать AgencyClient по display name автоматически без review.
6. После reconciliation сделать ownership not-null для активных sources.
7. Добавить down migration, не удаляющую существующие jobs.

### Тесты

- constraints и indexes;
- tenant/source external-key collision;
- rollback migration;
- ambiguous legacy source pauses safely;
- delete/archive source не удаляет jobs каскадно.

### Критерий завершения

Любая внешняя запись имеет tenant-scoped identity и может существовать в staging без создания Job.

---

## ✅ Шаг 4. Переписать ImportSource CRUD с tenant boundary

**Статус:** выполнено 2026-09-17.

Результат:

- agency CRUD принимает authenticated user и во всех чтениях/изменениях ограничивает source по `organization_id`; Team Manager дополнительно видит только назначенные ему или его команде sources;
- create требует canonical AgencyClient и connector type, всегда создаёт inert `draft`, не принимает runtime/state/scheduling fields и не включает расписание;
- update использует закрытый DTO, проверяет client/team/manager/recruiter ownership и увеличивает `configuration_version`;
- pause/resume/archive оформлены отдельными state commands; delete является recoverable archive, а resume требует активного AgencyClient и завершённого подтверждённого apply-run;
- credential reference изменяется только отдельным endpoint с `job_imports.manage_credentials`; API никогда не возвращает сам reference, а legacy secret-like keys в configuration маскируются в ответе;
- role ceilings закрепляют Org Admin как единственного полного управляющего, Recruitment Manager — `view/run/review`, Team Manager — `view/review`, Recruiter — read-only независимо от ошибочно расширенной tenant matrix;
- platform-support health endpoint отделён от agency CRUD, доступен только в native platform-admin context и возвращает фиксированную metadata projection без URL/configuration/credentials/logs/raw payload;
- disabled manual run сначала проверяет tenant/source access; legacy crawler больше не может обновить runtime metadata source из другой organization;
- regression-набор покрывает cross-tenant read/run/update, archived client activation, confirmed-run gate, DTO/runtime/secret rejection, credential redaction, support projection и permission contracts.

### Цель

Сделать управление источниками безопасным для agency workspace.

### Backend

- Все service methods принимают current user/context.
- Query всегда содержит organization scope.
- Create:
  - проверяет `job_imports.create`;
  - проверяет AgencyClient в той же organization;
  - создаёт source в `draft`;
  - не принимает runtime fields;
  - не активирует расписание до первого подтверждённого run.
- Update:
  - закрытый DTO только для user-editable configuration;
  - проверяет client/assignment ownership;
  - увеличивает configuration version;
  - sensitive changes требуют manage-credentials permission.
- Archive вместо hard delete.
- Отдельные commands: pause, resume, reconnect credentials.
- Platform-support endpoint отделить от agency CRUD.

### API

- `GET /import-sources`;
- `GET /import-sources/:id`;
- `POST /import-sources`;
- `PATCH /import-sources/:id`;
- `POST /import-sources/:id/pause`;
- `POST /import-sources/:id/resume`;
- `DELETE /import-sources/:id` означает recoverable archive либо заменить на explicit archive endpoint.

### Тесты

- org A не читает/не запускает/не меняет source org B;
- archived client блокирует activation и объясняет проблему;
- recruiter не создаёт source;
- runtime fields не принимаются;
- platform support не получает secret/raw payload без отдельного scope.

### Критерий завершения

CRUD проходит RLS/permissions, source всегда принадлежит правильной organization и AgencyClient.

---

## ✅ Шаг 5. Ввести Connector SDK

**Статус:** выполнено 2026-09-17.

Результат:

- создан независимый `JobImportConnector` contract для `detect`, `validateConfig`, `discover`, `fetchPage`, `map`, `identify` и `classifyHealth`;
- сетевой доступ передаётся connector-у через `ConnectorTransport`, поэтому adapter не импортирует `fetch`, TypeORM repositories, Job entity, UI или role context;
- `ConnectorRegistryService` регистрирует adapters по canonical type, блокирует дубликаты, ранжирует detection и отдаёт immutable connector type/version metadata для каждого будущего run;
- capabilities объявляются кодом и валидируются closed schema; Generic JSON честно объявляет `full_snapshot` и conditional `incremental_sync`, не обещая pagination/detail/closure/salary/auth/webhook;
- Generic JSON `1.0.0` реализует config validation, detection, discovery, conditional headers, raw page/snapshot metadata, canonical mapping в `NormalizedSourceJob`, deterministic checksum/identity и typed health errors;
- временный legacy JSON mapper вызывается только как pure mapping bridge одного raw item и не получает доступ к persistence;
- ImportSource create/update получает connector version из registry и не сохраняет неизвестную либо невалидную adapter configuration;
- добавлены immutable Jobicy/results fixtures и reusable contract tests на интерфейс, raw immutability, normalized schema, metadata, capabilities, version, registry, rate-limit/network classification и отсутствие запрещённых зависимостей.

### Цель

Заменить условные эвристики версионируемыми адаптерами с объявленными capabilities.

### Структура

Создать отдельный модуль, например:

```text
backend/src/modules/job-imports/
  connectors/
    connector.interface.ts
    connector-registry.service.ts
    generic-json/
    json-ld/
    greenhouse/
    lever/
    generic-html/
  domain/
  entities/
  dto/
  services/
  controllers/
```

Connector contract:

```text
detect(input)
validateConfig(config)
discover(config)
fetchPage(cursor, conditionalHeaders)
map(rawItem)
identify(candidate)
classifyHealth(error)
```

### Правила

- Connector не импортирует TypeORM repository jobs.
- Connector не знает о UI и ролях.
- Connector возвращает raw items, normalized candidates и snapshot metadata.
- Capabilities объявляются кодом: pagination, full snapshot, detail fetch, closure status, salary, authentication, webhook.
- Connector version сохраняется в каждом run.
- Каждому connector-у нужны immutable fixtures и contract tests.

### Критерий завершения

Generic JSON работает через общий interface; старый mapper можно вызвать внутри adapter-а только как временную реализацию.

---

## Шаг 6. Выделить безопасный HTTP Fetcher

### Цель

Сделать все обращения к внешним URL централизованными, ограниченными и наблюдаемыми.

### Работы

- Вынести fetching из `JobCrawlerService`.
- Разрешить только HTTP/HTTPS и утверждённые ports.
- Проверять hostname/IP на каждом redirect.
- Защититься от DNS rebinding на уровне фактического соединения/egress boundary.
- Ограничить:
  - redirects;
  - timeout;
  - response bytes;
  - decompression ratio;
  - content types;
  - pages/items per run;
  - per-domain concurrency и requests/time.
- Добавить robots.txt policy для crawler connectors.
- Использовать идентифицируемый User-Agent.
- Поддержать `ETag`, `If-Modified-Since`, `429 Retry-After`.
- Redact credentials/query secrets из logs.
- Разделить vendor API allowlist и arbitrary URL policy.
- Добавить metrics: response status, bytes, latency, rate-limit events.

### Тесты

- loopback/private/link-local/IPv6/mixed DNS;
- redirect public → private;
- oversized response;
- redirect loop;
- unsupported content type;
- timeout/429/5xx;
- secret redaction;
- robots denied.

### Критерий завершения

Ни один connector не использует прямой `fetch`; все сетевые запросы проходят одну security boundary.

---

## Шаг 7. Реализовать настоящий read-only preview

### Цель

Дать пользователю возможность безопасно проверить источник и sample.

### Flow

1. Draft source уже содержит tenant/client ownership.
2. `POST /import-sources/:id/runs` с `mode=preview` создаёт ImportRun.
3. Worker выполняет discover/fetch/map/validate.
4. Сохраняются run и staging/run items.
5. Ни один Job и SourceJobRecord applied state не меняется.
6. UI получает sample, capabilities, warnings и proposed mapping.

### Preview response

- detected connector и confidence;
- source metadata;
- declared capabilities/limitations;
- sample records;
- validation/quality summary;
- pagination/full-snapshot status;
- typed errors;
- прогноз create/update/close/review — если есть существующие records;
- `job_changes_applied: false` как явный invariant: run/staging metadata сохраняется, но рабочие вакансии не меняются.

### Тесты

- Снимок таблиц jobs до/после preview идентичен.
- Повторный preview idempotent относительно business data.
- Preview не активирует расписание.
- Ошибка одной item не превращает run в full successful snapshot.

### Критерий завершения

Quick Scan можно безопасно использовать в staging и production: он не создаёт и не обновляет вакансии.

---

## Шаг 8. Реализовать validation, identity и diff engine

### Цель

До применения точно определить, что произойдёт с каждой внешней записью.

### Pipeline

1. Safe decode/parse.
2. Extract.
3. Sanitize/normalize.
4. Map external enums в internal taxonomy.
5. Validate required/cross-field rules.
6. Calculate external key и checksum.
7. Match source-scoped record.
8. Detect probable cross-source duplicates отдельно.
9. Compare source candidate, source record и current job.
10. Produce field-level diff and proposed action.

### Правила identity

- Primary: vendor stable ID.
- Fallback: canonical source posting URL.
- Последний fallback: connector-specific deterministic fingerprint.
- Identity всегда namespaced source + tenant.
- Изменение fallback key не должно автоматически создавать дубль: отправлять в duplicate review.

### Validation outcomes

- valid and safe to apply;
- valid but requires review;
- incomplete/quarantined;
- duplicate candidate;
- invalid with actionable issues.

### Тесты

- одинаковые external IDs разных tenant/source;
- title/privacy/JSON fragments;
- HTML entities и mixed Hebrew/English;
- employment type + remote одновременно;
- missing/invalid URLs;
- taxonomy aliases;
- unchanged checksum;
- probable duplicate не merge автоматически.

### Критерий завершения

Для каждой item существует объяснимое действие и воспроизводимый field-level diff.

---

## Шаг 9. Реализовать единый Apply Service через JobsService

### Цель

Применять подтверждённые изменения, не обходя бизнес-правила вакансий.

### Работы

- Создать `JobImportApplyService`.
- Для create использовать domain command/метод JobsService, который гарантирует:
  - organization;
  - AgencyClient/employer company;
  - canonical company fields;
  - assignments;
  - validation;
  - draft state;
  - job code;
  - apply email;
  - canonical public URL;
  - audit/domain events.
- Для update использовать отдельный import-aware domain command, а не repository save.
- JobsService не должен принимать source public URL как `apply_url`.
- Применение одной item — транзакция: Job + SourceJobRecord + RunItem + audit.
- Idempotency: повторное применение resolved item не создаёт вторую Job.
- Batch apply сохраняет item-level результаты; одна ошибка не скрывает остальные.
- Поддержать retry failed items.

### Тесты

- imported agency job имеет client и publication fields;
- source URL не заменяет canonical `apply_url`;
- duplicate apply idempotent;
- invalid assignment не создаёт job;
- transaction rollback при ошибке source-record update;
- audit actor/source/run присутствуют.

### Критерий завершения

В проекте не остаётся production path, где connector/crawler напрямую пишет в jobs.

---

## Шаг 10. Добавить field ownership и защиту ручных правок

### Цель

Не позволить следующей синхронизации молча уничтожить работу recruiter-а.

### Работы

- Определить ownership map по умолчанию:
  - platform: publication fields, internal IDs;
  - user: assignments, compensation plan, internal notes;
  - source-until-edited: title, description, location, employment/work mode, skills;
  - review-on-conflict: state и критические taxonomy changes.
- При ручном изменении source-synced поля создавать override metadata.
- Diff engine сравнивает source baseline, current source и current job, а не только два значения.
- UI показывает lock/provenance.
- Действие «возобновить синхронизацию поля» удаляет override с audit entry.
- Bulk reset требует review permission и подтверждение.

### Тесты

- ручной title не перезаписывается;
- неизменённое source-owned поле обновляется;
- reset override снова разрешает update;
- manual state `filled/closed` защищён;
- audit хранит actor и before/after.

### Критерий завершения

Любая пропущенная source-правка объяснима существующим override или review policy.

---

## Шаг 11. Реализовать reconciliation create/update/close/reopen

### Цель

Безопасно синхронизировать полный lifecycle вакансий.

### Правила

- `full_snapshot`: разрешён missing comparison.
- `incremental`: только explicit events/updated items.
- `partial`: create/update допустимы по policy, closing запрещён.
- `failed`: никаких business changes.
- Explicit vendor closed/expired может предлагать close.
- Первое missing observation → suspected missing.
- Следующее полное успешное missing после grace period → close proposal/auto-close по policy.
- Reappearance → reopen только source-closed job без manual/filled terminal state.
- Paused/failed source ничего не закрывает.

### Circuit breaker

Перевести run в review, если:

- количество полученных jobs резко ниже baseline;
- предложено массовое закрытие выше configured threshold;
- parser вернул множество новых validation failures;
- изменился connector mapping/version без подтверждения;
- snapshot не доказан как полный.

### Тесты

- > 500 items с pagination;
- failed middle page;
- 0 items из ранее большого source;
- два missing snapshots;
- explicit close;
- reappear после source close;
- filled/manual closed не reopening;
- circuit breaker blocks apply.

### Критерий завершения

Сбой, partial response или parser regression не способен массово закрыть вакансии.

---

## Шаг 12. Перестроить background processing и scheduler

### Цель

Сохранить существующие сильные стороны очереди, но запускать её в правильном tenant/source контексте.

### Работы

- Background payload содержит `organization_id`, `source_id`, `run_id`, mode и config version.
- Scheduler не ищет «первого admin».
- Scheduled run использует source organization/system actor с явным audit identity.
- Atomic claim и recovery сохранить.
- Разделить retryable и permanent typed errors.
- Учитывать `Retry-After`.
- После max attempts переводить run в failed/dead-letter состояние.
- Добавить manual replay failed run/items.
- Per-domain concurrency и global worker limits.
- Не запускать два apply run одного source одновременно.
- Configuration version mismatch отменяет устаревший queued run.
- Рассчитывать `next_run_at` после completion, а не только по last sync.

### Тесты

- concurrent workers;
- duplicate enqueue/idempotency;
- source paused while queued;
- configuration changed while queued;
- abandoned run recovery;
- permanent security error не retry бесконечно;
- tenant context не зависит от user account availability.

### Критерий завершения

Scheduled run воспроизводим, tenant-safe и не зависит от случайного активного admin.

---

## Шаг 13. Завершить backend API для UI

### Цель

Предоставить frontend полный typed workflow без чтения internal tables.

### Endpoints

- source CRUD/pause/resume/archive;
- `POST /import-sources/:id/discover`;
- `POST /import-sources/:id/runs` с explicit mode;
- `GET /import-sources/:id/runs`;
- `GET /import-runs/:id`;
- `GET /import-runs/:id/items` с pagination/filtering;
- `POST /import-runs/:id/apply`;
- `POST /import-run-items/:id/approve`;
- `POST /import-run-items/:id/reject`;
- `POST /import-run-items/:id/retry`;
- batch resolve endpoint с ограничением размера;
- `GET /jobs/:id/import-provenance`;
- connector catalog/capabilities endpoint;
- tenant health aggregation endpoint;
- platform operations health endpoint без business payload по умолчанию.

### Общие требования

- pagination envelopes;
- typed DTOs и error codes;
- permission guards на каждом endpoint;
- audit для mutations;
- idempotency keys для run/apply/batch actions;
- API docs/OpenAPI;
- server-side filtering/search.

### Критерий завершения

Frontend может реализовать весь workflow, не используя legacy crawler contracts и не вычисляя бизнес-решения в браузере.

---

## Шаг 14. Сформировать frontend information architecture

### Цель

Подключить функцию в agency workspace без смешения с импортом кандидатов.

### Routes

Предлагаемая структура:

- `/agency/import` — hub или существующий candidate import;
- `/agency/import/jobs` — sources dashboard;
- `/agency/import/jobs/new` — onboarding wizard;
- `/agency/import/jobs/:sourceId` — source detail/runs/settings;
- `/agency/import/jobs/runs/:runId` — dry-run/review result;
- `/platform/operations/job-imports` — platform health, отдельный support view.

### Navigation

- Сохранить существующий candidate import.
- Сделать `Import` parent с children `Candidates` и `Jobs` либо добавить явный `Job sources` item.
- Показывать пункт только при `job_imports.view` и feature flag.

### Cleanup

- Выбрать одну каноническую реализацию вместо текущих дублирующих `ImportJobs.jsx` и `employer/ImportSources.jsx`.
- `ImportMonitoring.jsx` не подключать отдельно: его полезные элементы перенести в новый dashboard/platform operations view.
- Удалить или архивировать orphaned components после feature parity.

### Критерий завершения

Пользователь понимает различие между импортом кандидатов и вакансий; маршрут доступен только правильным ролям.

---

## Шаг 15. Реализовать onboarding wizard

### Цель

Провести пользователя от URL до подтверждённого первого dry-run без технических знаний.

### Шаги UI

1. **Source:** URL или выбор ATS, connector auto-detection.
2. **Client:** обязательный AgencyClient и проверка его доступности.
3. **Connection:** capabilities, ограничения, auth/robots/status.
4. **Sample:** таблица source → normalized, warnings и raw view.
5. **Mapping/defaults:** taxonomy, team/recruiter, schedule, publish/closing/overwrite policy.
6. **Dry-run:** create/update/close/skip/review группы.
7. **Confirmation:** импорт в drafts и активация расписания.

### UX требования

- состояние каждого шага сохраняется на backend draft source;
- refresh/back не теряет прогресс;
- нельзя активировать source без valid client и успешного preview;
- errors имеют action, а не только текст;
- показывать limitations connector-а;
- destructive/mass actions требуют summary и confirmation;
- cancel оставляет recoverable draft или предлагает archive.

### Тесты

- happy path keyboard-only;
- invalid URL;
- archived client;
- auth required;
- unsupported source;
- preview empty/partial;
- refresh/return to wizard;
- EN/HE и LTR/RTL.

### Критерий завершения

Новый org admin способен подключить поддержанный источник без инструкций разработчика и до apply видит полный эффект.

---

## Шаг 16. Реализовать Sources Dashboard и Source Detail

### Цель

Дать операционное понимание состояния источников.

### Dashboard

- health cards: Healthy, Running, Needs review, Degraded, Auth required, Paused;
- last attempt отдельно от last success;
- next run и freshness;
- counts последнего run и trends;
- filters/search/pagination;
- действия preview, run, pause, settings, review, archive;
- notifications только для meaningful events.

### Source detail

- configuration и capabilities;
- linked client/default assignments;
- run history;
- health timeline;
- latest changes;
- review count;
- audit events;
- retry/reconnect/pause actions;
- archive consequence summary.

### Критерий завершения

За несколько секунд пользователь понимает, работает ли source и требуется ли действие.

---

## Шаг 17. Реализовать Review Queue

### Цель

Обрабатывать исключения быстрее, чем вручную пересоздавать вакансии.

### Возможности

- server-side filters по source/client/action/issue/confidence;
- side-by-side source, normalized и current job;
- field-level diff;
- approve/reject/ignore;
- inline correction;
- «сохранить как mapping rule» только для разрешённых transforms;
- duplicate link/merge review;
- отдельное подтверждение bulk close;
- batch actions с лимитом и idempotency;
- retry failed item;
- сохранение filters/page/selection после mutation.

### Safety

- probable duplicates не merge автоматически;
- mass close всегда показывает affected jobs;
- stale item пересчитывается перед apply;
- если job изменён после dry-run, item возвращается в conflict review.

### Критерий завершения

Пользователь способен объяснить и разрешить каждое исключение, не переходя в БД или logs.

---

## Шаг 18. Добавить provenance в Job UI

### Цель

Сделать происхождение и синхронизацию понятными в обычном workflow вакансий.

### Работы

- Badge `Imported`.
- Source/client и external posting link.
- Last successful sync и health.
- Field provenance/lock indicator в edit form.
- Manual override confirmation.
- Действие «возобновить sync для поля».
- Import history/audit timeline.
- Ссылка на source/run/review item.
- Недоступный/архивный source отображается явно, не ломая job edit.

### Критерий завершения

Recruiter понимает, какие поля можно редактировать и что произойдёт при следующей синхронизации.

---

## Шаг 19. Реализовать MVP connectors

### 19.1 Generic JSON

- configurable root path;
- mapping aliases;
- pagination modes только если явно настроены;
- relative/absolute URL handling;
- stable identity selection;
- full vs partial snapshot proof;
- fixture для текущего Jobicy-style payload без заявления о полноценном Jobicy adapter.

### 19.2 JSON-LD `JobPosting`

- extraction с detail pages;
- hiring organization;
- employment types;
- locations/multiple locations;
- remote applicant requirements;
- salary;
- date posted/valid through;
- identifier/url;
- validation против видимого detail content там, где возможно.

### 19.3 Greenhouse

- board-token discovery/validation;
- list jobs с content;
- stable posting ID;
- office/department/location;
- description sanitization;
- pagination/capability согласно API;
- source/apply URLs;
- full snapshot reconciliation.

### 19.4 Lever

- site discovery/validation;
- pagination `skip/limit`;
- posting ID;
- plain description preferred для normalization, HTML retained only where needed;
- team/department/location/commitment/workplace type;
- salary where available;
- hosted/apply URLs;
- full snapshot reconciliation.

### Для каждого connector-а

- fixtures happy/empty/malformed/changed schema/large set;
- contract tests;
- rate-limit handling;
- capability declaration;
- mapping version;
- health/error classification;
- documentation для пользователя и operations.

### Критерий завершения

Каждый connector одинаково проходит preview → diff → apply → resync → close/reopen lifecycle.

---

## Шаг 20. Локализация, адаптивность и доступность

### Работы

- Все строки и typed errors в EN/HE translation files.
- Активный язык управляет page direction.
- URL/code/raw payload локально остаются LTR.
- Locale-aware date/number/currency/relative time.
- Общий accessible Dialog/AlertDialog.
- Focus trap, Escape, return focus.
- Visible labels для search/select; accessible names для icon actions.
- Status не только цветом.
- Responsive cards/disclosure вместо широкой таблицы.
- Keyboard batch selection.
- Умеренный `aria-live` для run progress.
- Контраст и reduced-motion проверка.

### Тесты

- automated accessibility smoke;
- keyboard walkthrough;
- 320/768/1280 widths;
- EN LTR и HE RTL;
- mixed Hebrew/English source values;
- long errors и URLs.

### Критерий завершения

Весь основной workflow доступен с клавиатуры, читаем в EN/HE и не теряет actions на узком экране.

---

## Шаг 21. Наблюдаемость, аналитика и operations

### Backend metrics

- run success/failure/partial;
- connector/version;
- run duration/pages/items/bytes;
- rate limits/retries;
- quality/quarantine/duplicate rates;
- proposed/applied closes;
- freshness/stale sources;
- circuit-breaker events;
- manual override conflicts.

### Product analytics

Добавить события из research:

- source creation funnel;
- connector detection;
- preview and dry-run;
- first confirmed import;
- review resolution;
- manual override;
- pause/reconnect/failure.

### Alerts

- source stale сверх SLA;
- auth required;
- repeated parser failure;
- connector-wide failure spike;
- anomalous empty snapshot;
- dead-letter run;
- high review/quarantine rate.

### Runbook

- диагностика connector errors;
- pause all sources конкретного connector version;
- replay run;
- migrate mapping version;
- restore after parser fix;
- incident procedure для false close/cross-tenant suspicion;
- credentials rotation.

### Критерий завершения

Operations обнаруживает системный parser regression раньше пользователей и может безопасно остановить affected connector.

---

## Шаг 22. Полная тестовая матрица

### Unit

- normalizers/validators;
- connector mapping fixtures;
- identity/fingerprint;
- diff;
- ownership;
- reconciliation;
- health/error mapping.

### Integration

- migrations/constraints;
- tenant permissions;
- preview no-write invariant;
- staging persistence;
- JobsService apply transaction;
- background retries/recovery;
- reconciliation/circuit breaker;
- audit.

### E2E backend

- два tenant-а подключают один ATS board;
- одинаковые external IDs;
- > 500 jobs и pagination;
- failed middle page;
- source changes during queued run;
- create/update/close/reopen;
- manual override;
- archived client;
- rate limited source;
- migration legacy records.

### E2E frontend

- create source → preview → mapping → dry-run → apply;
- review conflict;
- retry error;
- pause/resume/archive;
- provenance on job;
- permission-denied states;
- responsive/EN/HE/keyboard.

### Security

- SSRF suite;
- credentials/log redaction;
- authorization object-level tests;
- raw HTML/XSS rendering;
- oversized/decompression responses;
- mass-action CSRF/idempotency expectations;
- platform support data minimization.

### Критерий завершения

Release gate запускает backend build/lint/tests, frontend build/lint/typecheck/domain tests и новый job-import E2E suite.

---

## Шаг 23. Миграция существующих данных

### Этап A — inventory

- Посчитать legacy import sources/jobs.
- Определить organization/client только по надёжным FK/evidence.
- Найти duplicate external IDs, missing clients, external URLs в `apply_url`, jobs без publication.
- Сформировать reconciliation report до изменения данных.

### Этап B — additive migration

- Создать новые nullable columns/tables.
- Backfill однозначные sources и source records.
- Неоднозначные sources pause + migration error state.
- Скопировать внешний URL в source record до восстановления canonical publication URL.

### Этап C — domain repair

- Привязать подтверждённый AgencyClient.
- Provision canonical job code/email/public URL через существующий domain flow.
- Не открывать/закрывать jobs автоматически при migration.
- Сохранить report before/after.

### Этап D — constraints

- Включить required ownership для active sources.
- Добавить unique/FK constraints.
- Удалить legacy write paths только после shadow verification.

### Критерий завершения

Количество jobs объяснимо до/после; ни одна неоднозначная запись не была автоматически приписана клиенту или закрыта.

---

## Шаг 24. Shadow rollout

### Цель

Проверить качество на реальных источниках без изменения jobs.

### Работы

- Включить sources для internal/staging tenant-ов в preview-only mode.
- Выполнять scheduled shadow runs 2–4 недели.
- Сравнивать результаты с source и ручной выборкой.
- Измерять required-field accuracy, duplicates, false updates, false close proposals, run success и freshness.
- Исправлять mapping через новые connector versions.
- Провести usability test wizard/review queue.
- Утвердить baseline и rollout thresholds.

### Критерий завершения

Нет unexplained cross-tenant/duplicate/close incidents; качество и reliability соответствуют утверждённым thresholds.

---

## Шаг 25. Поэтапный production rollout

### Wave 1 — internal operators

- Только Generic JSON/JSON-LD/Greenhouse/Lever.
- Только drafts.
- Каждый run требует review.
- Малое число источников.

### Wave 2 — selected agencies

- Self-service wizard.
- Первый run review обязателен.
- Safe updates можно auto-apply.
- Closing остаётся review-first.

### Wave 3 — general availability

- Scheduled synchronization.
- Policy-driven auto-close только для доказанных full-snapshot connectors.
- SLA/alerts/support runbook действуют.
- Feature rollback проверен.

### Rollback

- Feature flag скрывает UI и останавливает новые runs.
- Sources переходят в paused без изменения jobs.
- Applied jobs не удаляются.
- Конкретный connector version можно отключить отдельно.
- False changes восстанавливаются через run item before/after и audit, а не массовым database rollback.

### Критерий завершения

Функция доступна целевой аудитории, имеет operational ownership, измеряемое качество и безопасный kill switch.

---

## 4. Рекомендуемое разбиение на PR

Чтобы review оставался управляемым, работу лучше вести отдельными изменениями:

| PR  | Содержание                                                                 | Зависимость     |
| --- | -------------------------------------------------------------------------- | --------------- |
| 1   | Safety freeze: destructive preview, DTO runtime fields, cross-tenant guard | Нет             |
| 2   | Domain contracts, error taxonomy, permissions                              | PR 1            |
| 3   | DB entities/migrations: source ownership, runs, records, items             | PR 2            |
| 4   | Tenant-safe ImportSource CRUD и archive/pause                              | PR 3            |
| 5   | Connector SDK + secure HTTP fetcher                                        | PR 2            |
| 6   | Preview/staging pipeline + Generic JSON                                    | PR 3, 4, 5      |
| 7   | Validation/identity/diff engine                                            | PR 6            |
| 8   | Apply Service через JobsService                                            | PR 7            |
| 9   | Field ownership + reconciliation + circuit breaker                         | PR 8            |
| 10  | Worker/scheduler hardening + API completion                                | PR 9            |
| 11  | Frontend routes/API/types/navigation                                       | PR 10           |
| 12  | Onboarding wizard + dry-run                                                | PR 11           |
| 13  | Dashboard/source detail/review queue                                       | PR 12           |
| 14  | Job provenance/manual override UI                                          | PR 13           |
| 15  | JSON-LD + Greenhouse + Lever connectors                                    | PR 6–10         |
| 16  | i18n/RTL/responsive/accessibility                                          | PR 12–14        |
| 17  | Observability, migration tooling, shadow rollout gate                      | Все основные PR |

PR 5 можно выполнять параллельно с PR 3–4 после фиксации контрактов. Connector adapters можно разрабатывать параллельно только после стабилизации SDK и shared contract tests.

## 5. Milestones и точки ручной проверки

### Milestone A — безопасный foundation

Включает шаги 0–4.

Проверка:

- preview не пишет jobs;
- source tenant/client scoped;
- permissions дают 403 при прямом HTTP;
- legacy ambiguous sources paused.

### Milestone B — технический vertical slice

Включает шаги 5–9 и один Generic JSON fixture.

Проверка:

- создать draft source через API;
- выполнить preview;
- увидеть staging/diff;
- подтвердить одну item;
- получить draft job с client, code и canonical URL;
- повторить apply без дубля.

### Milestone C — безопасная синхронизация

Включает шаги 10–13.

Проверка:

- source change обновляет незаблокированное поле;
- manual edit сохраняется;
- partial run не закрывает job;
- full missing sequence создаёт close proposal;
- circuit breaker останавливает массовое закрытие.

### Milestone D — пользовательский MVP

Включает шаги 14–20.

Проверка через UI:

- onboarding без dev tools;
- preview/sample/mapping/diff;
- import drafts;
- review conflicts;
- dashboard/health;
- provenance на job;
- EN/HE, keyboard и mobile.

### Milestone E — production readiness

Включает шаги 21–25.

Проверка:

- alerts/runbook;
- security suite;
- data migration report;
- shadow run baseline;
- feature/connector kill switches;
- selected-tenant rollout.

## 6. Что входит в MVP, а что откладывается

### В MVP

- tenant/client ownership;
- safe preview и staging;
- Generic JSON, JSON-LD, Greenhouse, Lever;
- dry-run/diff/review;
- draft creation через JobsService;
- field ownership;
- safe reconciliation;
- dashboard, wizard, review queue и provenance;
- EN/HE, RTL, accessibility;
- audit, metrics, alerts и controlled rollout.

### После MVP

- SmartRecruiters/Ashby и другие adapters по реальному спросу;
- OAuth marketplace installations;
- webhooks/incremental sync;
- generic HTML self-service;
- headless browser rendering;
- selector studio;
- custom connector SDK для клиентов;
- AI-assisted mapping;
- external application submission integrations.

## 7. Финальный Definition of Done

Функция считается реализованной, когда:

- preview гарантированно read-only;
- каждый source, run, record и job tenant-scoped;
- source привязан к каноническому AgencyClient;
- внешняя identity source-scoped;
- connector не пишет в jobs напрямую;
- create/update проходят единый domain workflow;
- canonical public URL не смешивается с source URL;
- пользователь видит sample и diff до apply;
- ручные изменения не перезаписываются молча;
- partial/failed run не закрывает jobs;
- close/reopen работают по доказуемым правилам;
- review queue и typed recovery actions доступны в UI;
- permissions действуют и в UI, и при прямом HTTP;
- поддержанные connectors проходят одинаковые contract tests;
- > 500 records и pagination проверены;
- EN/HE, RTL, accessibility и responsive UX проверены;
- legacy data migration имеет reconciliation report;
- telemetry, alerts, runbook и kill switches готовы;
- shadow и selected-tenant rollout завершены без критических инцидентов.

## 8. Первый практический спринт

Начинать следует не с UI и не с нового ATS adapter-а, а с этого набора:

1. Отключить destructive preview.
2. Закрыть runtime fields в update DTO.
3. Добавить organization/client scope и guards.
4. Зафиксировать normalized job/error/connector contracts.
5. Создать migrations для ImportSource ownership, ImportRun, SourceJobRecord и RunItem.
6. Реализовать read-only preview на одном Generic JSON fixture.
7. Доказать автоматическим тестом, что preview не меняет jobs.

После этого можно безопасно строить остальную функцию, не увеличивая риск для существующих вакансий.
