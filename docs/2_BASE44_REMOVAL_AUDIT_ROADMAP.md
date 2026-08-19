# Аудит и roadmap полного удаления Base44

Дата аудита: 2 августа 2026.

## 1. Цель

Полностью удалить из проекта runtime-зависимость, compatibility API, структуру вызовов, инфраструктурные ресурсы и бизнес-логику Base44.

Целевая система:

```text
React frontend
  ├── typed domain services
  ├── React Query hooks
  └── HTTP/SSE/WebSocket client
            │
            ▼
NestJS REST API
  ├── Auth and authorization
  ├── domain modules
  ├── application services
  ├── integrations
  └── background jobs
            │
            ▼
MySQL + application-owned file storage
```

После завершения frontend не должен знать о Base44 entities, functions, integrations, service roles или Base44 SDK conventions. NestJS становится единственной backend-системой и единственным источником бизнес-правил.

## Статус реализации

Обновлено: 16 августа 2026.

| Фаза | Статус                                                                         | Реализовано                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | Завершена для кода; runtime capture ожидает окружение                          | Автоматический inventory, замороженный per-file baseline вызовов и `.filter()` contracts, CI boundary с проверкой PR-base, route/DTO/permission/test matrix, владельцы import/migration процессов и запрет расширения `ENTITY_CONFIG`. Runtime traffic baseline требует запущенного тестового окружения и четырёх ролевых аккаунтов.                                                                                                                                                                            |
| 1    | Завершена для runtime-кода; требуется operational sign-off                     | Все внешние Base44 assets удалены, CSP использует явный network/image allowlist, неподдерживаемый OAuth отсутствует, `asServiceRole` удалён из shim. Универсальный email endpoint и browser-authored email payload удалены; письма Application/Interview формируются backend domain services. Migration tooling требует явный `--allow-legacy-network`. Локальные env исключены из Git. Владелец секретов должен подтвердить data reconciliation, отозвать credentials и выполнить network-blocked browser E2E. |
| 2    | Завершена и защищена CI                                                        | `HttpClient` безопасно распаковывает envelopes и сохраняет pagination; `ResourceService<TEntity,TQuery,TCreate,TUpdate>` разделяет контракты; AgencyClient/Job/Candidate/Application имеют точные query/create/update types, централизованные list/detail keys и React Query hooks. Удалены unsafe `BaseRepository`, arbitrary filter map и guessed bulk routes. API-only TypeScript и service↔NestJS Zod DTO contract gate работают в CI.                                                                      |
| 3    | Завершена для кода; browser E2E ожидает окружение                              | AuthContext и auth UI, onboarding, Platform и Admin переведены на типизированные NestJS services. Удалены legacy token aliases и taxonomy compatibility RPC; audit identity и platform-only organization fields закреплены за backend. Из shim удалены `auth` и `organizationsApi`; CI запрещает shim/raw transport во всём Phase 3 scope. OAuth отключён явной policy.                                                                                                                                         |
| 4    | Завершена для кода; browser E2E ожидает окружение                              | Public jobs/companies и весь активный candidate кабинет используют typed domain services. Добавлены identity-free submit, matching/resume endpoints, canonical ID ownership с backfill migration, backend-owned message/review identity и явный polling. CI запрещает shim/raw transport в Phase 4 scope.                                                                                                                                                                                                       |
| 5    | Завершена для кода; role/browser E2E ожидает окружение                         | Активные Employer, Company HR, Agency, recruiter и CRM routes переведены на typed services. Team management использует organization users/invite, pipeline — backend transition action, AI Matching — canonical ID assignment, CRM identity/timeline/notifications принадлежат backend. CI запрещает shim/raw transport и masked errors в Phase 5 scope.                                                                                                                                                        |
| 6    | Завершена для кода; worker/browser E2E ожидает окружение                       | `functions.invoke`, `integrations.Core`, generic Functions/LLM controllers удалены. Analytics, scoring, resume и imports используют domain endpoints. Долгие candidate/source imports сохраняются как idempotent background jobs с retry/backoff/recovery; crawler и file processing защищены от SSRF. CI закрепляет нулевой string-RPC surface.                                                                                                                                                                |
| 7    | Завершена                                                                      | Shim, Base44 tree, SDK artifacts, compatibility routes и неиспользуемые legacy-страницы физически удалены; terminal audit закреплён в CI.                                                                                                                                                                                                                                                                                                                                                                       |
| 8    | Завершена для автоматизированного QA; browser sign-off заблокирован окружением | Единый release gate, реальные backend lint/Jest, fresh/upgrade migrations, OpenAPI/auth/tenant/workflow/import/file/API E2E, health/request-id monitoring и production dependency audit. Встроенный QA-браузер недоступен в текущем окружении, поэтому ручной визуальный sign-off остаётся обязательным перед production deployment.                                                                                                                                                                            |

Текущий остаток Base44: 0 runtime-imports, 0 entity/RPC calls, 0 shim contracts и отсутствующий legacy tree. После завершения миграции одноразовые Phase verification scripts удалены. Постоянный локальный gate `npm run release:verify` проверяет dependency audit, frontend lint/typecheck/build и backend lint/unit tests/build. Отчёты по завершённым фазам сохранены в `docs/PHASE_*` как история миграции.

## 2. Краткий вывод

Прямой зависимости от `@base44/sdk` сейчас нет. Основной runtime-трафик уже направляется через `/api` в локальный NestJS backend.

Однако миграция архитектуры не завершена: frontend всё ещё построен вокруг объекта `base44`, который эмулируется файлом `src/api/base44Client.js`. Это не просто старое имя — shim сохраняет семантику Base44:

- универсальные `entities.X.list/filter/get/create/update/delete`;
- RPC-вызовы `functions.invoke(name, params)`;
- `integrations.Core.UploadFile/SendEmail/InvokeLLM`;
- `asServiceRole`;
- Base44-подобный `subscribe`, реализованный polling;
- автоматическое угадывание endpoint для неизвестной сущности.

Следовательно, приложение уже не зависит от Base44 как основной базы и backend-платформы, но всё ещё зависит от его frontend-контракта и части legacy-модели данных.

## 3. Текущий runtime-инвентарь

### 3.1. Frontend compatibility layer

На момент аудита:

| Категория                                 | Использование |
| ----------------------------------------- | ------------: |
| Файлы, импортирующие `@/api/base44Client` |           105 |
| Файлы с `base44.entities.*`               |            95 |
| Файлы с `base44.functions.invoke()`       |            19 |
| Файлы с `base44.integrations.Core.*`      |            12 |
| Файлы с `base44.auth.*`                   |            16 |

Наиболее затронутые области:

| Область         | Файлы с импортом shim |
| --------------- | --------------------: |
| Admin pages     |                    19 |
| Platform pages  |                     9 |
| Employer pages  |                     9 |
| Candidate pages |                     6 |
| Dashboards      |                     5 |
| Agency pages    |                     3 |
| CRM pages       |                     3 |
| Recruiter pages |                     3 |

Основной shim: `src/api/base44Client.js`.

HTTP-клиент использует `baseURL: /api`, а development proxy направляет запросы в NestJS. Переменная `VITE_BASE44_APP_BASE_URL` фактически содержит URL NestJS и имеет вводящее в заблуждение legacy-имя.

### 3.2. Используемые entity contracts

Frontend активно использует следующие Base44-подобные сущности:

- AgencyClient;
- Application, ApplicationPipeline, ApplicationTimeline;
- AuditLog;
- Candidate, CandidateAccess, CandidateImportBatch, CandidateProfile;
- CommunicationLog;
- Company, CompanyReview;
- CompensationPlan;
- Domain, Role, RoleAlias, RoleTemplate, Specialization;
- ImportSource;
- Interview;
- Job;
- Message, Notification;
- Organization;
- PermissionMatrix;
- SavedJob;
- Staff;
- User.

Наиболее часто вызываются Job, Application, Organization, Interview, Candidate и Staff.

Проблема заключается не только в синтаксисе. Универсальный `.filter()` позволяет передавать поля, которых нет в NestJS DTO. Zod может удалить неизвестный фильтр, после чего frontend получит более широкий набор данных, чем ожидает. RLS ограничивает tenant, но функциональный результат всё равно может быть неправильным.

### 3.3. Functions compatibility

Frontend вызывает через `base44.functions.invoke()`:

- matching/search: `smartSearch`, `getRecommendedJobs`, `scoreApplication`;
- dashboard: `getDashboardStats`;
- audit/timeline: `createAuditLog`, `createApplicationTimeline`;
- resume/import: `extractAndTranslateResume`, `createBulkCandidates`, `importCandidatesFromFile`, `importResumeFiles`, `parseResumeBatch`, `validateImportBatch`;
- taxonomy/profile/location: `loadTaxonomy`, `updateCompanyProfile`, `getLocationFromIP`;
- job crawling/import: `crawlCareerPage`, `importNvidia`, `importNovolog`, `importAlljobs`, `importShafir`, `importElbit`, `importJobicy`.

NestJS предоставляет compatibility routes для большей части первой группы. Но вызовы `importNvidia`, `importNovolog`, `importAlljobs`, `importShafir`, `importElbit` и `importJobicy` не имеют одноимённых маршрутов в текущем `FunctionsController`. Сейчас такие действия могут завершаться `404`.

Это необходимо исправить до удаления shim: либо реализовать нормальный NestJS import API, либо удалить/скрыть недоступные действия.

### 3.4. Integrations compatibility

Используются три Base44-подобных операции:

- `UploadFile` — 10 мест;
- `SendEmail` — 4 места;
- `InvokeLLM` — 1 место.

Они уже направляются в NestJS `/integrations/*`, но контракт остаётся Base44-подобным.

Отдельный риск — произвольная отправка email из frontend через универсальный endpoint. В целевой архитектуре email должен отправляться application service на backend после проверки бизнес-события и permissions, а не по свободному payload из браузера.

### 3.5. Auth compatibility

Login, registration, current user, update profile, logout и reset password уже работают через NestJS, но frontend вызывает их через `base44.auth`.

`loginWithProvider()` в shim не реализован и выбрасывает ошибку, хотя кнопки Google login присутствуют на Login/Register. Необходимо принять отдельное решение:

- реализовать OAuth полностью в NestJS;
- либо удалить кнопки до реализации.

### 3.6. Realtime compatibility

`base44.entities.X.subscribe()` не использует realtime backend. Shim периодически перечитывает список и вычисляет create/update/delete события сравнением JSON.

Недостатки:

- лишний API-трафик;
- задержки до следующего polling interval;
- отсутствие server event ordering;
- ошибочное восприятие polling как realtime;
- ошибки polling намеренно игнорируются.

Нужно заменить это либо явно именованным polling hook, либо SSE/WebSocket для Notification/Message/Activity сценариев.

### 3.7. Прямые внешние зависимости Base44

Runtime всё ещё загружает несколько логотипов и изображений с `media.base44.com`. При недоступности Base44 эти изображения исчезнут.

В backend присутствует ручной migration tooling:

- `npm run migrate:base44`;
- `backend/src/scripts/migrate-from-base44.ts`;
- `backend/src/scripts/base44-api.client.ts`;
- Base44 credentials в `backend/.env`.

Migration tooling не участвует в обычном запуске приложения, но остаётся прямой возможностью обращения к Base44.

Важно: в локальном `backend/.env` обнаружены заполненные Base44 credentials. Значения нельзя переносить в документацию или логи. Их необходимо отозвать/сменить после подтверждения завершения data migration.

### 3.8. Неиспользуемое legacy-дерево

Папка `base44/` содержит:

- 41 entity schema;
- 64 директории функций;
- legacy implementation и migration utilities.

Импортов этого дерева из runtime-кода `src/` или `backend/src/modules/` не обнаружено. Тем не менее оно остаётся источником путаницы и может ошибочно восприниматься как рабочая реализация.

Удалять его следует только после инвентаризации функций: часть legacy-функций может содержать единственную реализацию нужного бизнес-процесса, которую необходимо сначала перенести в NestJS.

### 3.9. Остаточные имена и метаданные

Сохранились:

- имя frontend package `base44-app`;
- `VITE_BASE44_APP_BASE_URL`;
- комментарии «mirrors/replaces Base44»;
- migration script и env variables `BASE44_*`;
- исторические migration names, связанные с импортом Base44;
- документация и compatibility terminology.

Это не всегда runtime-зависимость, но мешает доказать полное удаление и повышает риск возврата legacy-паттернов.

## 4. Основные риски текущего состояния

### P0 — Security

- Активные Base44 credentials хранятся в локальном env.
- `asServiceRole` выглядит как elevated API, хотя фактически является alias. Это создаёт ложное ощущение безопасности.
- Универсальный `SendEmail` позволяет frontend формировать email payload вместо запуска строго определённого backend use case.
- Generic API затрудняет проверку permissions для каждой операции.

### P1 — Correctness

- Неизвестные query filters могут отбрасываться backend DTO.
- Generic endpoint guessing может направлять запрос на несуществующий или неправильный ресурс.
- Шесть job-import действий не имеют backend route.
- Google login показан пользователю, но не поддерживается.
- Polling errors маскируются.

### P1 — Maintainability

- Frontend не имеет явных типизированных контрактов для большинства доменов.
- Бизнес-операции выглядят как CRUD или string-based RPC.
- Изменение NestJS DTO может не проявиться как compile-time ошибка.
- Новые разработчики не могут быстро определить, какая реализация является актуальной: `base44/functions`, shim или NestJS module.

### P2 — Availability and branding

- Часть изображений зависит от `media.base44.com`.
- Legacy naming присутствует в package/env/log output.

## 5. Целевая архитектура frontend API

Вместо глобального dynamic proxy должны существовать явные клиенты:

```text
src/api/
  client/
    httpClient.ts
    tokenStorage.ts
  services/
    authService.ts
    organizationService.ts
    userService.ts
    companyService.ts
    agencyClientService.ts
    jobService.ts
    candidateService.ts
    applicationService.ts
    interviewService.ts
    messageService.ts
    notificationService.ts
    importService.ts
    matchingService.ts
    auditService.ts
    fileService.ts
  hooks/
    useJobs.ts
    useCandidates.ts
    useApplications.ts
    ...
```

Правила:

- один метод frontend соответствует документированному NestJS endpoint;
- request/response типы соответствуют DTO/OpenAPI;
- query filters перечислены явно;
- mutation возвращает типизированный результат;
- cache keys и invalidation централизованы;
- UI не формирует ownership fields, которые backend обязан определить сам;
- бизнес-действия выражены use-case endpoint, а не универсальным `.update()`;
- ошибки не преобразуются в пустые списки без видимого error state.

## 6. План реализации по фазам

### Фаза 0. Зафиксировать baseline и запретить новый Base44-код

Цель: остановить рост legacy-зависимости до начала миграции.

Работы:

- сохранить автоматический inventory всех импортов и вызовов shim;
- добавить CI-проверку, запрещающую новые импорты `base44Client` вне временного allowlist;
- создать route/domain matrix: экран → service → endpoint → DTO → permission → tests;
- снять baseline API traffic для основных ролей;
- зафиксировать все динамические `.filter()` поля;
- составить список используемых и неиспользуемых legacy functions;
- определить владельца каждого migration/import процесса;
- добавить deprecation header/comment к shim и запретить расширение `ENTITY_CONFIG`;
- переименовать новые задачи и документацию без Base44 terminology.

Результат: количество Base44-зависимостей может только уменьшаться.

Критерий завершения: CI отклоняет любой новый `base44.*` вызов.

### Фаза 1. Закрыть security и внешние зависимости

Цель: убрать прямые риски до большого frontend refactor.

Работы:

- проверить, завершён ли перенос production data;
- отозвать и сменить Base44 API key/password/token;
- удалить `BASE44_*` из активных `.env` после подтверждения миграции;
- убедиться, что `.env` никогда не попадает в Git или build artifacts;
- скачать Base44 media assets в application-owned storage;
- заменить все `media.base44.com` URL;
- удалить или скрыть неработающие Google OAuth кнопки либо реализовать OAuth в NestJS;
- удалить `asServiceRole` из новых и security-sensitive flows;
- заменить свободный `SendEmail` на разрешённые backend use cases;
- добавить CSP/network policy, запрещающую runtime-запросы к Base44 domains.

Результат: приложение не обращается к Base44 в обычном runtime, даже если shim пока существует.

Критерий завершения: E2E проходит при сетевой блокировке `*.base44.com`.

### Фаза 2. Построить типизированный frontend API foundation

Цель: создать замену shim до массового изменения экранов.

Работы:

- оставить один базовый `httpClient` без Base44 naming;
- определить DTO/types для paginated response, errors и mutations;
- добавить явные domain services и query-key factories;
- использовать NestJS OpenAPI как проверяемый источник контрактов;
- унифицировать `GET list/get`, `POST create`, `PATCH update`, archive/delete;
- удалить automatic endpoint guessing;
- исключить неизвестные filters на compile time;
- стандартизировать loading/error/empty/denied states;
- добавить contract tests frontend service ↔ NestJS DTO.

Первыми эталонными сервисами использовать уже существующие `agencyClientService`, `jobService`, `candidateService` и `applicationService`, устранив из них любые обращения к shim.

Результат: новые экраны могут работать только через явные NestJS services.

Критерий завершения: эталонный вертикальный сценарий не импортирует `base44Client` и проходит integration tests.

### Фаза 3. Перенести Auth, Organization и Platform/Admin

Цель: убрать Base44 из bootstrap приложения и управления tenant.

Работы:

- создать `authService` для login/register/me/update/reset/logout/refresh;
- перевести `AuthContext`, Login, Register, Reset Password и user menus;
- создать `organizationService` и `userService`;
- перевести onboarding, platform organizations, users и impersonation;
- перевести Permission Matrix, Role Templates, Role Aliases и taxonomy;
- заменить `createAuditLog` прямым audit service/use-case;
- определить OAuth policy;
- удалить Base44 auth compatibility и `organizationsApi` из shim.

Результат: приложение может загрузиться, авторизовать пользователя и выбрать workspace без Base44 API surface.

Критерий завершения: auth/platform/admin E2E проходит при физическом отключении shim auth.

### Фаза 4. Перенести публичный и candidate workflow

Цель: удалить shim из публичного поиска вакансий и кабинета кандидата.

Работы:

- перевести Jobs, Job Detail, Companies, Company Profile и рекомендации;
- перевести Saved Jobs, Candidate Profile, Applications, Interviews, Messages и Notifications;
- заменить email-based ownership на canonical user/candidate IDs там, где это ещё не сделано;
- заменить `UploadFile` на `fileService`;
- заменить `SendEmail` действиями `submitApplication`, `scheduleInterview`, `sendMessage`;
- заменить `InvokeLLM`/resume RPC на matching/resume services;
- исправить job view increment отдельным endpoint;
- выбрать SSE/WebSocket или явно оформленный polling для уведомлений и сообщений.

Результат: public/candidate routes не импортируют `base44Client`.

Критерий завершения: поиск → просмотр вакансии → отклик → сообщение → интервью проходит без shim.

Статус на 13 августа 2026: код и статический CI gate завершены. Активные маршруты Jobs, Job Detail, Companies, Company Profile, recommendations, Saved Jobs, Candidate Profile, Applications, Interviews, Messages и Notifications переведены. Browser E2E полного сценария остаётся operational gate и требует запущенных frontend/backend/database, candidate account и тестовой вакансии.

### Фаза 5. Перенести Employer и Agency/CRM workflow

Цель: убрать Base44 из основных B2B процессов.

Работы:

- перевести employer dashboard, jobs, candidates, pipeline, analytics и settings;
- перевести agency dashboard, clients, job management, CRM, AI Matching и recruiter pages;
- использовать `AgencyClient`, `Company`, `Job`, `Candidate`, `Application` только по ID contracts;
- заменить `Staff` generic CRUD на organization users/team API;
- заменить `ApplicationPipeline` generic CRUD на domain stage transition endpoints;
- перевести CompensationPlan, CommunicationLog и ImportSource;
- удалить оставшиеся `.catch(() => [])`, маскирующие API errors;
- добавить role-specific integration tests и cross-tenant tests.

Результат: все B2B routes используют явные NestJS services.

Критерий завершения: agency и employer E2E suites проходят без импорта shim.

Статус на 13 августа 2026: source code и CI boundary завершены для активного route graph. Неиспользуемые standalone legacy страницы `src/pages/employer/ImportSources.jsx`, `Jobs.jsx`, `Candidates.jsx`, `Dashboard.jsx`, `KanbanDashboard.jsx`, `Settings.jsx` остаются вне runtime graph; import/vendor orchestration относится к Фазе 6, а остальные дубликаты должны быть физически удалены в Фазе 7. Role-specific browser E2E и cross-tenant suite остаются operational gate.

### Фаза 6. Перенести Functions, AI, import и background jobs

Цель: удалить string-based RPC и legacy function semantics.

Предлагаемые NestJS API domains:

| Legacy function                 | Целевой API                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `smartSearch`                   | `POST /jobs/search`                                                           |
| `getRecommendedJobs`            | `GET /matching/jobs/recommended`                                              |
| `scoreApplication`              | `POST /applications/:id/score`                                                |
| `getDashboardStats`             | `GET /analytics/dashboard`                                                    |
| `createAuditLog`                | backend-generated audit event                                                 |
| `createApplicationTimeline`     | backend-generated application event                                           |
| `loadTaxonomy`                  | `POST /taxonomy/reload` или seed command                                      |
| `extractAndTranslateResume`     | `POST /resumes/extract`                                                       |
| import/parse/validate functions | `/candidate-imports/*` и `GET /background-jobs/:id`                           |
| `crawlCareerPage`               | `POST /import-sources/:id/runs` и `POST /import-sources/preview`              |
| vendor-specific imports         | удалены; все источники запускаются по сохранённой конфигурации `ImportSource` |
| `updateCompanyProfile`          | `PATCH /companies/:id/profile`                                                |
| `getLocationFromIP`             | `GET /location/current`                                                       |

Работы:

- реализовать либо удалить шесть отсутствующих vendor import operations;
- перенести orchestration из frontend в NestJS application services;
- использовать queues/idempotency keys для долгих import/AI задач;
- сохранять progress/error/retry state в базе;
- генерировать audit/timeline события внутри транзакции бизнес-действия;
- ограничить AI prompts и email templates backend-кодом;
- удалить `FunctionsController` compatibility routes после переноса последнего consumer;
- удалить `IntegrationsController` compatibility surface, оставив domain endpoints.

Результат: в frontend нет `functions.invoke` и `integrations.Core`.

Критерий завершения: static scan возвращает ноль string-based RPC вызовов, import/AI E2E проходит с retry и duplicate prevention.

Статус на 14 августа 2026: source code и CI boundary завершены. Static scan возвращает ноль `functions.invoke`, `integrations.Core` и compatibility `/functions/*` consumers. `FunctionsController`, generic `IntegrationsController` и browser-controlled LLM endpoint удалены. Persisted background jobs имеют idempotency key, atomic claim, retry/backoff, recovery после прерывания и scheduler для due import sources. Для operational sign-off ещё требуется применить миграцию `1752500000000-BackgroundJobs`, запустить worker с БД и выполнить import/AI browser E2E, включая duplicate click, retry и restart recovery.

### Фаза 7. Удалить shim и все Base44 artifacts

Цель: физически удалить Base44 из активного проекта.

Работы:

- удалить `src/api/base44Client.js`;
- удалить все оставшиеся импорты и compatibility comments;
- переименовать `VITE_BASE44_APP_BASE_URL` в `VITE_API_PROXY_TARGET`;
- переименовать frontend package `base44-app`;
- удалить `npm run migrate:base44`;
- удалить `migrate-from-base44.ts` и `base44-api.client.ts`;
- удалить `backend/.env` переменные `BASE44_*` и их example entries;
- удалить папку `base44/` после подтверждения переноса нужной логики;
- удалить Base44 media URLs;
- удалить legacy `asServiceRole`, generic Entity Proxy и polling subscribe;
- очистить исходный код и operational documentation от Base44 instructions.

Исторические миграции нельзя бездумно редактировать или удалять: они уже записаны в `migrations_history`. Для полного очищения нужно создать проверенный schema baseline для новых установок и отдельную безопасную процедуру перевода существующих баз на baseline. До этого исторические названия миграций являются допустимым неисполняемым исключением.

Результат: ни frontend, ни backend runtime не содержат Base44 compatibility code.

Критерий завершения: проект собирается после физического удаления shim, legacy scripts и папки `base44/`.

Статус на 16 августа 2026: завершено на уровне source/config/CI. Две последние активные AI-панели переведены на типизированные domain services; 19 неподключённых compatibility-страниц удалены. Shim, 106 файлов legacy tree, одноразовые migration scripts, SDK lockfile entry, старые env/package/proxy names и operational instructions физически удалены. Terminal audit фиксирует 0 imports, 0 calls, 0 filter contracts, 0 functions и 0 entity mappings; Phase 1–7 gates, lint и обе сборки проходят. Два historical migration files остаются неизменяемым исключением до отдельного schema-baseline cutover. Environment QA, исправление общего legacy JSX typecheck и восстановление backend Jest runner относятся к Phase 8.

### Фаза 8. Финальный QA и выпуск

Цель: доказать функциональную эквивалентность и отсутствие скрытой зависимости.

Обязательные проверки:

- frontend build, lint и typecheck;
- backend build, lint и unit tests;
- OpenAPI contract tests;
- fresh database migration test;
- upgrade test существующей базы;
- auth and workspace E2E;
- public/candidate E2E;
- employer E2E;
- agency client → job → candidate → pipeline → hire E2E;
- import/AI retry and duplicate tests;
- email/file upload tests;
- cross-tenant and role permission suite;
- SSE/WebSocket/polling failure tests;
- network test с запретом Base44 domains;
- repository static scan;
- secret scan;
- production monitoring API 4xx/5xx, imports, queues и auth failures.

Результат: релиз не зависит от Base44 технически, функционально или операционно.

Критерий завершения: все release gates проходят на окружении без Base44 credentials и сетевого доступа к Base44.

Статус на 16 августа 2026: все repo-verifiable gates завершены. Fresh и upgrade базы доведены до 13/13 migrations с проверкой сохранности данных; frontend/backend lint, typecheck, unit tests, builds, static/history secret scan, OpenAPI/auth/tenant/role/workflow/SMTP/import/file/background-job E2E, polling failure boundary, operational metrics и network deny test проходят без Base44 credentials. High/critical production vulnerabilities — 0. Production sign-off остаётся закрыт до четырёх внешних attestations: browser matrix, отзыв Base44 credentials, production egress/DNS block и backup/restore drill. Для них добавлен protected-environment workflow; browser provider текущего окружения вернул пустой список браузеров.

## 7. Static release gates

Перед окончательным удалением CI должен подтверждать:

```bash
# Ноль runtime-импортов shim
! rg "api/base44Client|base44\." src

# Ноль Base44 SDK и runtime URLs
! rg "@base44|app\.base44\.com|media\.base44\.com" src backend/src package.json

# Ноль активных Base44 env/config
! rg "BASE44_|VITE_BASE44" .env.example backend/.env.example vite.config.* package.json

# Legacy tree физически отсутствует
test ! -e base44

npm run build
npm run lint
npm run typecheck
cd backend && npm run build && npm test
```

Исторические audit-документы и зафиксированные production migration names проверяются отдельным allowlist и не должны импортироваться runtime-кодом.

## 8. Definition of Done

Base44 считается полностью удалённым, когда выполнены все условия:

- отсутствует `base44Client` и глобальный объект `base44`;
- отсутствуют Base44 SDK dependencies;
- отсутствуют `entities.*`, `functions.invoke`, `integrations.Core`, `asServiceRole` и Base44-style subscribe;
- frontend использует только явные типизированные NestJS services;
- все бизнес-правила и permissions выполняются backend;
- отсутствуют runtime-запросы к Base44 domains;
- media assets принадлежат проекту;
- Base44 credentials отозваны и удалены;
- папка `base44/` и migration tooling удалены;
- fresh install не требует Base44 exports или schemas;
- существующая база обновляется без Base44;
- приложение проходит полный E2E при заблокированном доступе к Base44;
- static scan не находит Base44 runtime-кода вне исторического allowlist.

## 9. Рекомендуемая стратегия поставки

Не следует удалять shim одним большим изменением. Безопасный порядок:

1. запретить новые зависимости;
2. закрыть credentials и external assets;
3. построить typed API foundation;
4. переносить экраны вертикальными domain slices;
5. переносить RPC/integrations после появления domain endpoints;
6. физически удалить shim только при нулевом числе consumers;
7. выполнить schema baseline и полный regression release.

Каждый PR должен уменьшать измеряемое количество Base44 imports/calls и содержать тест целевого NestJS endpoint. Временные adapters допустимы только внутри `src/api/services`, должны иметь владельца и дату удаления и не должны повторять generic Base44 API.
