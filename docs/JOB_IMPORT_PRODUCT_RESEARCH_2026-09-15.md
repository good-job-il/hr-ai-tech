# Product research: импорт вакансий из внешних источников

**Дата:** 15 сентября 2026  
**Область:** подключение карьерных страниц, ATS и job feeds; нормализация, проверка, синхронизация и публикация вакансий в Hire Israel  
**Роль документа:** целевое продуктовое видение, gap analysis и приоритизированный roadmap. Это не подтверждение production readiness.

## 1. Executive summary

Текущая реализация уже доказывает базовый технический сценарий: администратор может сохранить URL источника, запустить фоновую задачу, получить JSON или HTML, извлечь несколько полей вакансии и повторно обновить запись. Есть retries, persisted background jobs, timeout и базовая SSRF-защита.

Но для реальной ежедневной работы агентства этого недостаточно. Сейчас функция ближе к техническому crawler prototype, чем к управляемому продукту импорта. Главные проблемы находятся не в количестве поддержанных сайтов, а в контракте данных и пользовательском доверии:

- действие, названное preview, фактически создаёт и обновляет вакансии;
- источники не tenant-scoped и не связаны с конкретным `AgencyClient`;
- импорт пишет напрямую в таблицу jobs и обходит основной доменный workflow вакансии;
- внешний URL вакансии и публичный URL Hire Israel используют одно поле `apply_url`;
- `provider` сохраняется, но не выбирает реальную стратегию парсинга;
- нет полного snapshot reconciliation, поэтому исчезнувшие вакансии не закрываются;
- нет staging/review queue, provenance, confidence, правил перезаписи ручных изменений и безопасного rollback;
- UI обещает pagination/load more/enterprise system, хотя backend выполняет один и тот же single-page fetch;
- пользователю не показываются найденные вакансии и будущие изменения до применения.

Рекомендуемая продуктовая модель: **«подключить источник → увидеть и проверить sample → настроить mapping и правила → выполнить dry-run → одобрить изменения → автоматически синхронизировать → разбирать только исключения»**.

Ключевой принцип: система должна импортировать не «HTML со страницы», а **версионируемую внешнюю вакансию с происхождением каждого поля**, затем безопасно преобразовывать её во внутреннюю вакансию.

## 2. Какую пользовательскую задачу должна решать функция

### Основной Job To Be Done

> Когда клиент агентства публикует или меняет вакансии во внешней системе, я хочу автоматически и предсказуемо получить их в своём workspace, связать с правильным клиентом и ответственными сотрудниками, чтобы не копировать данные вручную и не опасаться дублей, неверных закрытий или потери своих правок.

### Персоны

1. **Agency Owner / Org Admin** — подключает источник, определяет политику импорта и отвечает за данные tenant-а.
2. **Recruitment Manager / Team Manager** — выбирает команду, recruiter-а, workflow и проверяет спорные изменения.
3. **Recruiter** — использует импортированные вакансии, видит происхождение данных и редактирует разрешённые поля.
4. **Platform Operations** — следит за состоянием connectors, ошибками, rate limits и качеством по всем tenant-ам, не получая права менять бизнес-данные без аудита.

### Что означает «удобно»

- подключение типового ATS занимает несколько минут и не требует знания CSS selectors;
- до первого изменения пользователь видит, что будет создано, обновлено, закрыто или пропущено;
- каждая ошибка объясняет причину и предлагает конкретное действие;
- ручные правки рекрутера не исчезают после следующей синхронизации;
- новые и изменённые вакансии попадают к правильному клиенту, команде и recruiter-у;
- нормальная работа происходит автоматически, а человек занимается только исключениями;
- из любой вакансии можно понять источник, время последней проверки и историю изменений.

## 3. Что реализовано сейчас

| Область | Текущее состояние | Оценка |
|---|---|---|
| Сохранённые источники | URL, имя, provider, интервал, active flag, counters, последние status/error/logs | Базовая основа |
| Выполнение | persisted background job, atomic claim, retries/backoff, recovery, расписание | Хорошая техническая основа, нужна tenant isolation и worker hardening |
| JSON | корневые массивы `jobs`, `data`, `results`; несколько aliases полей; Jobicy-style payload | Узкий generic mapper, не полноценный Jobicy connector |
| HTML | ссылки `<a>` с эвристикой URL/title | Только первый листинг, без detail enrichment |
| Нормализация | очистка inline text/description, plausible-title filter | Полезная защита, но не полный validation contract |
| Безопасность URL | HTTP(S), DNS lookup, private/link-local rejection, ручная проверка redirects, timeout | Нуждается в усилении, но правильное начало |
| Синхронизация | create/update по `external_id` или `apply_url` | Нет source/tenant namespace, diff и reconciliation |
| Мониторинг | last status/error, накопительные counters, короткий log | Недостаточно для операционной диагностики |
| UX | список источников, quick scan, запуск, edit/delete, sync all | Нет безопасного onboarding, preview данных и review queue |

Тесты покрывают успешный Jobicy-style JSON mapping, отбрасывание privacy-like title и базовую фильтрацию HTML-ссылок. Не покрыты контрактные fixtures реальных ATS, pagination, closing/reopening, tenant collisions, partial runs, manual overrides и end-to-end workflow.

## 4. Критические gaps в текущей реализации

### P0. Preview не является preview

`POST /import-sources/preview` вызывает тот же `crawlCareerPage`, который сохраняет вакансии. Quick Scan может менять production-данные ещё до создания источника и без подтверждения пользователя.

**Что изменить:** разделить `discover/preview` и `apply`. Preview должен возвращать только sample, warnings, detected connector, mapped fields и prospective diff. Любая запись — только после явного подтверждения или запуска утверждённого source policy.

### P0. Нет tenant и client ownership у ImportSource

В `ImportSourceEntity` нет `organization_id` и `employer_company_id`; CRUD ищет записи только по `id`; scheduler берёт все активные sources и выполняет их от имени первого активного platform admin. Это не соответствует agency workflow и создаёт риск неверной принадлежности данных.

**Что изменить:** каждый источник обязан принадлежать organization и, для agency, каноническому `AgencyClient`. Все read/write/run операции должны проходить tenant RLS и permission guard. Нужны отдельные platform-support permissions без неявного impersonation.

### P0. Импорт обходит JobsService

Crawler использует `jobRepo.create/save` напрямую. Поэтому он не гарантирует:

- актуальный `AgencyClient` и `employer_company_id`;
- assignments и scope команды;
- единый validation contract;
- canonical company fields;
- job code, email alias и public URL;
- audit/domain events.

**Что изменить:** connector никогда не должен сохранять `JobEntity` напрямую. Он создаёт `SourceJobRecord`; отдельный application service валидирует и применяет изменения через единый job domain workflow в транзакции.

### P0. Две разные ссылки смешаны в `apply_url`

Crawler записывает в `apply_url` URL внешней вакансии, тогда как job publication использует это поле для canonical public URL Hire Israel. Следующая синхронизация может перезаписать canonical link, а миграция publication — уничтожить source apply link.

**Что изменить:** разделить минимум на:

- `source_posting_url` — исходная карточка вакансии;
- `source_apply_url` — внешний application flow, если его нужно сохранять;
- `public_apply_url` — canonical URL Hire Israel;
- `apply_destination_policy` — внутренний apply, redirect к источнику или оба варианта.

### P0. Дедупликация не scoped

Поиск существующей вакансии по `external_id`/`apply_url` не ограничен source и organization. Одинаковый ID разных ATS или повторное подключение общего источника несколькими tenant-ами могут дать collision или обновление чужой записи.

**Что изменить:** уникальный ключ `(organization_id, import_source_id, external_key)`. Cross-source duplicate detection должна быть отдельной вероятностной функцией, которая предлагает merge, а не молча обновляет запись.

### P0. Provider не является connector-ом

Значения `career_page`, `paginated`, `load_more`, `org_system`, `custom` влияют только на label в UI. Backend всегда делает один HTTP fetch и выбирает generic JSON либо anchor parser. UI утверждает, что «автоматически просканирует все страницы», но код явно ограничен одной страницей.

**Что изменить:** provider должен ссылаться на версионируемый connector type и определять discovery, auth, pagination, mapping, rate limit и reconciliation semantics. Пока стратегия не реализована, её нельзя показывать как рабочую опцию.

### P0. Нет безопасного closing reconciliation

`closed` всегда равен нулю. Исчезнувшие или закрытые во внешнем источнике вакансии остаются открытыми. Но автоматически закрывать всё отсутствующее после одной ошибки тоже опасно.

**Что изменить:** закрытие разрешено только после успешного полного snapshot или явного vendor status. Для HTML fallback использовать configurable grace period и минимум два успешных последовательных missing observations. Partial/failed run никогда не закрывает вакансии.

### P0. Конфигурация компании не сохраняется

Frontend предлагает `company_name`, но DTO/entity такого поля не имеют. Scheduled run использует `source.name` как company name. Пользователь видит настройку, которая не становится источником истины.

**Что изменить:** удалить фиктивное поле и связать source с AgencyClient; отображаемое название компании всегда брать из канонического клиента. При необходимости сохранить `source_company_label` только как исходное значение/provenance.

### P0. Клиент может менять системные counters/status

Update DTO принимает `last_sync`, status, errors, counters, logs и retry metadata. Эти поля должны принадлежать worker-у, а не CRUD API.

**Что изменить:** закрытый user-editable DTO и отдельный internal repository/service для runtime state. Все административные override-действия — отдельными командами с audit reason.

## 5. Целевая стратегия источников

Использовать каскад от наиболее надёжного к наименее надёжному:

1. **Официальный ATS API или webhook.** Greenhouse Job Board API отдаёт публичные jobs, стабильный ID, content, departments/offices; Lever Postings API — ID, pagination, plain/HTML descriptions, workplace type, salary и hosted/apply URLs; SmartRecruiters Posting API — active postings, pagination, location, employment и experience fields.
2. **Авторизованный feed:** JSON/XML/RSS/Atom/SFTP/object storage. Полезен для job boards и закрытых корпоративных систем.
3. **`schema.org/JobPosting` JSON-LD на detail pages.** Это стандартный набор полей для title, dates, employer, location, employment type, salary, remote eligibility и validity.
4. **Статический HTML adapter** с list discovery и обязательным detail enrichment.
5. **Контролируемый browser-rendered adapter** для JS-only сайтов. Только как fallback из-за стоимости, нестабильности и повышенного security surface.
6. **Custom connector SDK** для редких систем после того, как существует стабильный adapter contract.

Auto-detection должна распознавать ATS по hostname, URL pattern, script markers и network/public endpoint hints, но пользователь всегда видит найденную стратегию и может подтвердить её.

## 6. Целевая архитектура данных

### 6.1 ImportSource

Минимальные поля:

- `id`, `organization_id`, `employer_company_id`;
- `connector_type`, `connector_version`, encrypted credential reference;
- source URL / board token / company slug;
- locale и timezone источника;
- schedule, rate-limit policy, active/paused state;
- publish policy: auto-publish, review required, drafts only;
- defaults: team, recruiter, manager, compensation plan, taxonomy mapping;
- closing policy и grace period;
- `last_attempt_at`, `last_success_at`, `next_run_at`, `health_state`;
- mapping version и configuration version.

### 6.2 SourceJobRecord — обязательный staging layer

- source-scoped external key;
- raw payload snapshot или object-storage reference, checksum и fetched timestamp;
- normalized candidate payload;
- source posting/apply URLs;
- source created/updated/expiry dates;
- field-level provenance and confidence;
- validation issues;
- lifecycle: `discovered`, `valid`, `needs_review`, `applied`, `ignored`, `missing`, `closed`, `quarantined`;
- linked internal `job_id`;
- last seen successful run и consecutive missing count.

Raw payload нужен не для вечного хранения, а для воспроизводимости mapping и поддержки. Следует задать retention, redact secrets/PII и не сохранять лишние page assets.

### 6.3 ImportRun и ImportRunItem

Run хранит connector/mapping/config versions, полноту snapshot, cursor/pages, HTTP metrics, итоговые counts и typed failure. RunItem хранит diff для каждой вакансии: before/after, решение, warnings и applied transaction reference.

Это позволяет:

- повторить mapping на старом payload без нового crawling;
- объяснить пользователю каждое изменение;
- безопасно retry только failed items;
- откатить конкретный run;
- измерять качество connector-а.

### 6.4 Field ownership

Для каждого поля нужна политика:

- **source-owned** — обновляется из источника;
- **platform-owned** — job code, public URL, internal state metadata;
- **user-owned** — recruiter/team, notes, compensation plan;
- **source-until-manually-edited** — после ручной правки блокируется от автоматической перезаписи;
- **review-on-conflict** — изменение попадает в queue.

В UI рядом с полем показывать provenance и действие «вернуть синхронизацию с источником».

## 7. Canonical job contract

До применения в jobs каждая запись проходит один общий pipeline:

1. decode и safe parse;
2. extract source fields;
3. sanitize HTML с явным allowlist либо преобразовать в безопасную структуру;
4. normalize whitespace/entities/locale;
5. map external enums в internal taxonomy;
6. validate required fields и cross-field constraints;
7. calculate quality score/confidence;
8. detect exact identity и probable duplicates;
9. generate diff;
10. apply через JobsService/domain command.

### Обязательные поля

- правдоподобный title;
- canonical AgencyClient/company;
- хотя бы одна понятная location/work-mode модель;
- полный description либо явный статус `incomplete`;
- employment type отдельно от work mode;
- source identity и source posting URL;
- возможность подать заявку;
- source status/expiry либо evidence для reconciliation.

### Рекомендуемые поля

- responsibilities, requirements, required/preferred skills;
- seniority и years of experience;
- department/domain/specialization;
- salary min/max/currency/period;
- multiple locations и applicant location requirements для remote;
- language;
- date posted, valid through;
- hiring volume/headcount;
- recruiter/team defaults;
- compensation plan mapping.

Employment type и remote нельзя смешивать. Внешние источники также обычно моделируют workplace отдельно; одна вакансия может быть full-time и remote одновременно.

## 8. Рекомендуемый UX

### 8.1 Wizard подключения источника

**Шаг 1 — источник.** Пользователь вставляет URL или выбирает ATS. Система auto-detects connector и показывает, что именно найдено.

**Шаг 2 — клиент и доступ.** Обязательный AgencyClient, при необходимости credentials/OAuth, проверка разрешений. Credentials никогда не возвращаются в UI после сохранения.

**Шаг 3 — проверка соединения.** Показать HTTP/API result, robots/policy outcome, найденное число вакансий, pagination capability и ограничения connector-а.

**Шаг 4 — sample preview.** Таблица 10–20 записей с title, company, location, employment, work mode, dates и warnings. Возможность открыть raw/source view рядом с normalized view.

**Шаг 5 — mapping и defaults.** Сопоставить taxonomy, team/recruiter, compensation plan, язык, publish и overwrite policy. Система предлагает mapping, но не скрывает uncertainty.

**Шаг 6 — dry-run diff.** Отдельные группы: будет создано, обновлено, закрыто, пропущено, требует review. Никаких записей до подтверждения.

**Шаг 7 — запуск.** «Импортировать как drafts» — безопасный default для нового connector-а. Auto-publish становится доступен после успешного first run и проверки качества.

### 8.2 Operations dashboard

Карточка источника должна отвечать за пять секунд на вопросы:

- работает ли источник сейчас;
- когда была последняя успешная синхронизация и следующая попытка;
- свежи ли данные;
- сколько вакансий создано/изменено/закрыто/пропущено/на review;
- что нужно сделать человеку.

Health states: `Healthy`, `Running`, `Needs review`, `Degraded`, `Auth required`, `Parser broken`, `Paused`. Не смешивать last attempt и last success. Накопительные counters дополнить результатом последнего run и периодными trends.

Действия: preview, run now, pause, edit settings, review changes, retry failed items, clone, archive. Delete источника должен объяснять судьбу уже импортированных jobs и предлагать recoverable archive.

### 8.3 Review queue

- фильтры по source/client/issue/action/confidence;
- side-by-side source → normalized → current job;
- inline correction и сохранение mapping rule;
- batch approve/reject/ignore;
- probable duplicate merge/link;
- отдельное подтверждение массового закрытия;
- причина quarantine и конкретный fix;
- сохранение позиции, filters и selection после retry.

### 8.4 Job page

На вакансии показать badge «Imported», источник, last synced, source link, sync status и историю. Рядом с source-owned fields — provenance. Manual override должен быть видимым и обратимым.

### 8.5 Errors и уведомления

Ошибка должна иметь typed category и next action:

- credentials expired → Reconnect;
- robots/policy denied → Pause / contact source owner;
- rate limited → automatic retry time;
- layout/parser changed → Review sample / update adapter;
- mapping invalid → Fix mapping;
- partial snapshot → Retry, no jobs closed;
- client archived → choose replacement client;
- duplicate conflict → open review queue.

Уведомлять не о каждом успешном run, а о meaningful events: источник стал stale, auth истёк, массовый diff превышает threshold, появились review items, run окончательно failed.

## 9. Reconciliation и lifecycle

Для каждого run сначала определить его полноту:

- `full_snapshot` — можно делать missing comparison;
- `incremental` — применяются только явные события/update timestamps;
- `partial` — изменения можно принять, закрытия запрещены;
- `failed` — никаких бизнес-изменений.

Рекомендуемые правила:

- новый external key → create draft/review/auto-publish по policy;
- тот же key и новый content hash → field-level diff;
- тот же key без изменений → только `last_seen_at`;
- explicit closed/expired → close/hold по mapping policy;
- missing в одном полном HTML snapshot → mark suspected missing;
- missing в двух полных успешных snapshots после grace period → предложить/выполнить close;
- снова появился → reopen только если текущий state был source-driven; заполненную (`filled`) или вручную закрытую вакансию не открывать автоматически;
- source paused/failed → внутренние вакансии не менять.

Перед применением аномального diff нужен circuit breaker, например: если исчезло больше заданной доли активных jobs или count резко упал, run переводится в review и ничего массово не закрывает.

## 10. Connector contract

Каждый connector должен реализовать один контракт:

```text
detect(input) -> capability/confidence
validateConfig(config) -> errors/warnings
discover(config) -> metadata/capabilities
fetchPage(cursor, conditionalHeaders) -> raw items/next cursor/snapshot status
map(rawItem, mappingVersion) -> SourceJobCandidate
identify(candidate) -> stable external key
health(error/run) -> typed state and recovery action
```

Capabilities объявляются явно: pagination, detail fetch, incremental sync, closure events, salary, remote, multiple locations, authentication, webhooks. UI строится по capability, а не по свободной строке provider.

### Первые connectors

1. Generic JSON feed с настраиваемыми root path и aliases.
2. `schema.org/JobPosting` JSON-LD.
3. Greenhouse Job Board.
4. Lever Postings.
5. SmartRecruiters Posting.
6. Ashby Job Postings.
7. Generic static HTML list + detail.

Приоритет конкретных ATS нужно подтвердить аналитикой URLs реальных клиентов, а не предположением команды.

## 11. Security, policy и reliability

### Обязательно

- tenant-scoped authorization на source, run, raw payload и результирующие jobs;
- encrypted secrets с rotation/revocation, без credentials в logs;
- SSRF defense на каждый redirect и фактическое соединение, защита от DNS rebinding;
- разрешены только HTTP(S), ограничения ports, response size, content type, redirects и decompression ratio;
- egress controls/isolated worker для browser rendering;
- HTML sanitization и безопасное отображение raw content;
- robots.txt (`RFC 9309`), идентифицируемый User-Agent, rate limit и per-domain concurrency;
- проверка условий использования и разрешения на импорт для каждого коммерческого источника;
- audit log: кто создал source, изменил policy, запустил/подтвердил run, выполнил override;
- retention policy для raw snapshots и logs;
- idempotency и transactional apply;
- dead-letter queue/replay после исчерпания retries;
- не закрывать вакансии при partial/failed run.

Текущая DNS/private-IP проверка полезна, но одна проверка перед `fetch` не является полным SSRF boundary. Для arbitrary user-supplied URLs OWASP рекомендует многослойную защиту; в production предпочтителен allowlist для известных ATS и изолированный egress для generic crawler.

## 12. Accessibility, localization и responsive UX

- все строки — EN/HE translation keys, включая connector errors и logs summary;
- LTR/RTL следует активному языку, URL/code/raw payload остаются LTR внутри локального контейнера;
- даты, числа, валюты и relative time форматируются locale-aware;
- wizard/dialog использует общий accessible Dialog, focus trap, Escape и return focus;
- status передаётся текстом и icon, не только цветом;
- tables на узких экранах заменяются карточками или disclosure rows;
- действия icon-only имеют accessible names;
- progress доступен screen reader через умеренный `aria-live`, без шума от каждого item;
- keyboard-friendly batch selection и сохранение focus после действия.

## 13. Метрики продукта

### North-star

**Доля импортированных вакансий, которые дошли до рабочего состояния без ручного исправления обязательных полей и без последующего инцидента синхронизации.**

### Activation

- median time от Add source до valid dry-run;
- connection success rate с первой попытки;
- доля sources, завершивших first import;
- abandon rate по шагам wizard.

### Data quality

- valid required-field rate;
- title/company/location/work-mode accuracy по human review sample;
- quarantine и duplicate rates;
- доля low-confidence fields;
- manual corrections на 100 imported jobs;
- число source-overwrite incidents ручных полей;
- false close/reopen rate.

### Reliability

- run success rate по connector version;
- freshness SLA и stale-source count;
- p50/p95 run duration;
- recovery after retry;
- parser-break incidents и mean time to detect/resolve;
- percentage full vs partial snapshots.

### Efficiency/business

- recruiter minutes на 100 вакансий;
- доля изменений, обработанных автоматически;
- active healthy sources на tenant;
- импортированные jobs с applicants/interviews/placements;
- application conversion по internal vs external apply policy.

Целевые проценты нужно установить после baseline. Не следует объявлять произвольные targets до сбора 2–4 недель telemetry и ручной оценки качества.

### События аналитики

`source_add_started`, `connector_detected`, `connection_tested`, `preview_completed`, `mapping_changed`, `dry_run_reviewed`, `first_import_confirmed`, `run_completed`, `run_failed`, `review_item_resolved`, `manual_override_created`, `source_paused`, `auth_reconnected`.

Каждое событие содержит tenant-safe IDs, connector/version, duration, counts и error category, но не raw descriptions или credentials.

## 14. Приоритетный roadmap

### Release 0 — восстановить доверие и границы данных (P0)

- сделать preview полностью read-only;
- добавить organization/client ownership и permission/RLS;
- убрать runtime fields из публичного update DTO;
- разделить source/public apply URLs;
- source-scoped identity и unique constraint;
- проводить apply через единый JobsService/domain workflow;
- сохранить SourceJobRecord/ImportRun/RunItem и diff;
- запретить закрытия без full successful snapshot;
- убрать/скрыть неработающие provider options и ложное обещание all pages;
- migrations и reconciliation для уже импортированных records;
- security/audit regression tests.

**Exit gate:** preview не меняет БД; два tenant-а могут подключить один источник без collision; каждая созданная agency job имеет client, job code и canonical public URL; failed/partial run не закрывает jobs.

### Release 1 — безопасный self-service workflow (P1)

- connection wizard, sample table, mapping/defaults;
- dry-run diff и explicit confirmation;
- drafts/review-first policy;
- operations dashboard и typed actionable errors;
- review queue, batch actions, manual field locks;
- last attempt/last success/next run/staleness;
- notifications и circuit breaker;
- EN/HE, RTL, accessibility и responsive states.

**Exit gate:** новый пользователь самостоятельно подключает поддержанный source и понимает каждое предстоящее изменение до применения.

### Release 2 — API-first coverage (P1)

- Generic JSON + JSON-LD connectors;
- Greenhouse, Lever, SmartRecruiters и Ashby adapters;
- pagination/cursors, detail enrichment, conditional requests;
- vendor fixtures/contract tests и connector versioning;
- full reconciliation, expiration и reopen semantics;
- per-source rate limits и health SLO.

**Exit gate:** fixtures >500 jobs импортируются полностью; изменения и closures воспроизводимы; parser regression одного connector-а не влияет на другие.

### Release 3 — controlled long tail (P2)

- generic list/detail HTML connector;
- browser-rendered connector в изолированном worker;
- selector/mapping studio для trained operators;
- webhook/incremental modes, где доступны;
- custom connector SDK и certification checklist;
- AI-assisted field suggestions только с deterministic validation, confidence и human review;
- connector catalog с capability/health history.

**Exit gate:** custom/JS-heavy sources не ухудшают безопасность и предсказуемость основной системы.

## 15. Что не следует делать сейчас

- не добавлять десятки site-specific scrapers поверх текущего direct-to-jobs crawler;
- не включать auto-close до snapshot completeness и circuit breaker;
- не использовать LLM как единственный parser или validator;
- не выдавать selector builder обычному recruiter-у как основной UX;
- не обещать pagination/load more без реального capability;
- не смешивать candidate application ingestion с job ingestion в первом релизе;
- не хранить API keys непосредственно в source row или logs;
- не считать успешным run, который обработал часть страниц и оставил item errors;
- не переписывать ручные правки без field ownership policy.

## 16. Исследования с пользователями до фиксации scope

1. Провести 6–8 интервью: agency owner, recruitment manager и recruiter из малых и средних агентств.
2. Собрать обезличенный список 30–50 реальных source URLs и определить долю ATS/API/JSON-LD/static/JS-only.
3. Разобрать текущий ручной процесс: кто создаёт клиента, кто исправляет поля, кто решает закрыть вакансию.
4. Usability test wizard на 5 пользователях: подключить source, найти mapping warning, предотвратить массовое закрытие.
5. Human-labelled benchmark минимум из 200 вакансий на EN/HE и mixed content.
6. Shadow runs без записи 2–4 недели для baseline качества и стабильности.
7. Проверить, хотят ли агентства internal application flow, redirect к клиенту или policy per source/job.

### Ключевые вопросы

- Какие ATS реально используют клиенты в Израиле?
- Может ли один source соответствовать нескольким AgencyClient или всегда одному?
- Кто владеет title/description после ручного улучшения recruiter-ом?
- Как интерпретировать исчезновение вакансии: hold, closed или archived?
- Нужна ли модерация каждой новой вакансии или только low-confidence изменений?
- Какие SLA свежести важны: час, 6 часов, сутки?
- Требуются ли закрытые feeds с credentials и IP allowlisting?
- Где должен завершаться application flow и как измеряется attribution?

## 17. Definition of Done для полноценной функции

Функцию можно считать готовой к широкому использованию, когда одновременно выполнены условия:

- источник tenant-scoped, permissioned и привязан к каноническому клиенту;
- preview/dry-run гарантированно не меняет бизнес-данные;
- пользователь видит sample и полный diff до первого apply;
- импорт использует единый job validation/publication/assignment workflow;
- external identity уникальна внутри source и tenant;
- source/public URLs разделены;
- поддержанный connector читает все страницы и detail data;
- employment type и work mode разделены;
- manual overrides защищены от тихой перезаписи;
- full reconciliation корректно обрабатывает create/update/close/reopen;
- partial/failed run не вызывает массовых закрытий;
- есть review queue, typed errors, retry/replay и audit trail;
- EN/HE, RTL, accessibility и mobile states проверены;
- fixtures и E2E покрывают минимум два tenant-а, >500 records, duplicate IDs, pagination, provider layout change и failed middle page;
- telemetry показывает качество, freshness и incident guardrails;
- operational owner и runbook назначены, alerts и SLO действуют.

## 18. Рекомендуемый MVP

Если нужно быстро дать реальную ценность, MVP следует ограничить **Generic JSON, JSON-LD, Greenhouse и Lever**, одним AgencyClient на source, импортом в drafts, обязательным first-run review и безопасным full-snapshot reconciliation. Это покроет структурированные источники и создаст правильную платформу для дальнейших adapters.

Generic HTML и browser rendering лучше не включать в self-service MVP. Их можно временно обслуживать как operator-managed beta с явной маркировкой ограничений.

## 19. Источники и основания рекомендаций

### Внутренние

- [`backend/src/modules/functions/services/job-crawler.service.ts`](../../backend/src/modules/functions/services/job-crawler.service.ts)
- [`backend/src/modules/functions/services/job-import-mapper.ts`](../../backend/src/modules/functions/services/job-import-mapper.ts)
- [`backend/src/modules/functions/services/background-jobs.service.ts`](../../backend/src/modules/functions/services/background-jobs.service.ts)
- [`backend/src/modules/import-sources/import-source.entity.ts`](../../backend/src/modules/import-sources/import-source.entity.ts)
- [`backend/src/modules/import-sources/import-sources.service.ts`](../../backend/src/modules/import-sources/import-sources.service.ts)
- [`backend/src/modules/jobs/jobs.service.ts`](../../backend/src/modules/jobs/jobs.service.ts)
- [`client/src/pages/admin/ImportJobs.jsx`](../src/pages/admin/ImportJobs.jsx)
- [`client/src/pages/employer/ImportSources.jsx`](../src/pages/employer/ImportSources.jsx)
- [`client/docs/PHASE_6_FUNCTIONS_AI_IMPORT_JOBS.md`](./PHASE_6_FUNCTIONS_AI_IMPORT_JOBS.md)
- [`client/docs/IMPORT_PROCESS_OWNERS.md`](./IMPORT_PROCESS_OWNERS.md)

### Внешние первичные источники

- [Schema.org — JobPosting](https://schema.org/JobPosting): canonical field model, включая location, remote eligibility, qualifications, salary и dates.
- [Google Search Central — JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting): требования к актуальности, `validThrough`, remote jobs, canonical URLs и доступному application flow.
- [Greenhouse — Job Board API](https://docs.greenhouse.io/job-board.html): публичные jobs, IDs, content, offices/departments, application fields и pay transparency.
- [Lever — Postings API](https://github.com/lever/postings-api): pagination, stable posting IDs, plain/HTML descriptions, workplace type, salary и hosted/apply URLs.
- [SmartRecruiters — Posting API endpoints](https://developers.smartrecruiters.com/docs/endpoints): active postings, offset/limit, detail endpoint и structured taxonomy/location fields.
- [Ashby — jobPosting.list](https://developers.ashbyhq.com/reference/jobpostinglist): официальный endpoint job postings.
- [IETF RFC 9309 — Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html): стандарт обработки robots.txt crawler-ами.
- [OWASP — SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html): defense-in-depth для server-side fetching пользовательских URLs.

## 20. Итоговое продуктовое решение

Не развивать текущую функцию как коллекцию парсеров. Сначала превратить её в **безопасную import platform с staging, diff, provenance, review и reconciliation**, затем добавлять connectors по фактическому спросу клиентов.

Пользователь должен доверять трём обещаниям:

1. **«Я увижу изменения до применения».**
2. **«Система не потеряет мои ручные правки и не закроет вакансии из-за сбоя».**
3. **«Каждая вакансия окажется у правильного клиента и ответственных людей».**

Если эти обещания выполнены, расширение coverage становится управляемой инженерной задачей. Без них каждый новый parser увеличивает риск и операционную нагрузку.
