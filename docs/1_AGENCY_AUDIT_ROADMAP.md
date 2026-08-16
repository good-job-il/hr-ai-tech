# Аудит и roadmap кабинета Staffing Agency

Дата аудита: 2 августа 2026  
Область: все маршруты `/agency/*`  
Статус документа: план доведения текущей реализации до production-ready состояния

## 1. Резюме

Agency-часть уже содержит основу продукта: tenant-aware маршрутизацию, dashboard, управление вакансиями, CRM кандидатов, pipeline, AI Matching, импорт, клиентов, компенсации и настройки. При этом модуль пока нельзя считать готовым к production из-за нескольких системных расхождений:

- клиент одновременно представлен сущностями `Organization` и `Company`;
- вакансии не привязываются к клиентам через `employer_company_id`;
- статусы pipeline не совпадают со статусами `Application`;
- ownership-поля хранят `user.id`, но часть UI фильтрует их по `user.email`;
- Permission Matrix почти не применяется к реальным действиям;
- несколько маршрутов являются заглушками или визуально рабочими экранами без реальной логики;
- route-варианты `/open`, `/filled`, `/hold`, `/active` не меняют фильтрацию;
- обработка ошибок, пагинация, локализация и автоматические тесты неполны.

Сборка `npm run build` проходит. `npm run lint` и `npm run typecheck` не проходят. Во время аудита `localhost:5173` и backend на `localhost:3001` не были доступны, поэтому выводы основаны на анализе маршрутов, компонентов, схем сущностей и API-вызовов. Авторизованный browser smoke-test остаётся обязательной частью финальной приёмки.

## 2. Текущее состояние маршрутов

| Маршрут | Текущее состояние | Что требуется |
|---|---|---|
| `/agency/onboarding` | Частично реализован | Проверять тип существующей организации и корректно перенаправлять company org_admin |
| `/agency/dashboard` | Частично реализован | Исправить клиентов, KPI, error states и локализацию |
| `/agency/jobs` | Частично реализован | Tenant/client binding, permissions, локализация, обработка ошибок |
| `/agency/jobs/open` | Использует общий экран | Применять фильтр `open` из маршрута |
| `/agency/jobs/filled` | Фактически повторяет `/open` | Определить и применять семантику filled/closed/completed |
| `/agency/jobs/hold` | Статус отсутствует | Добавить статус или убрать маршрут |
| `/agency/crm` | Частично реализован | Исправить ownership, пагинацию, refresh, поиск и permissions |
| `/agency/crm/candidate` | Частично реализован | Permissions, error handling, реальные действия и связи Application |
| `/agency/pipeline` | Системно некорректен | Унифицировать статусы, убрать demo fallback, сохранять действия |
| `/agency/ai-matching` | Частично реализован | Создавать полную Application и исключать дубликаты |
| `/agency/compensation` | Частично реализован | Связать с client/job IDs и унифицировать permissions |
| `/agency/import` | Частично реализован | Реальный retry, корректная навигация, убрать production test seeding |
| `/agency/clients` | Системно некорректен | Единая модель клиента и tenant-связь |
| `/agency/clients/:id` | Частично реализован | Привязанные вакансии/кандидаты, mutation states, error handling |
| `/agency/teams` | Заглушка | Реализовать команды, пользователей, приглашения и назначения |
| `/agency/reports` | Заглушка | Реализовать отчёты или убрать пункт до готовности |
| `/agency/activity` | Заглушка | Реализовать журнал активности на основе AuditLog |
| `/agency/settings/permissions` | Частично реализован | Применять матрицу во всём UI и ограничить текущим org type |
| `/agency/settings/roles` | Частично реализован | Ограничить текущим org type и синхронизировать cache |
| `/agency/settings/billing` | Статический mock | Подключить реальные plan/subscription/invoice данные |
| `/agency/settings/integrations` | Статический mock | Реальные connection states и connect/disconnect flows |
| `/agency/team/*` | Переиспользует общие страницы | Реальная team scope и корректные внутренние ссылки |
| `/agency/recruiter/dashboard` | Заглушка | Реализовать персональный recruiter dashboard |
| `/agency/recruiter/candidates/*` | Route-фильтры игнорируются | Реализовать all/active/pipeline filters |
| `/agency/recruiter/jobs` | Открывает публичный Jobs | Заменить списком доступных/назначенных agency jobs |
| `/agency/recruiter/crm/*` | Частично реализован | Ownership по `user.id`, permissions, действия |
| `/agency/recruiter/pipeline` | Частично реализован | Персональная область рекрутера и единые статусы |
| `/agency/recruiter/ai-matching` | Частично реализован | Персональная выборка и полная Application |

## 3. Критические дефекты

### 3.1. Конфликт моделей клиента

Сейчас dashboard создаёт и считает клиентов как `Organization`, а `/agency/clients` создаёт и отображает `Company`. При этом у `Company` нет явного `organization_id` или отдельной связи с агентством. Форма вакансии сохраняет текст `company`, но не обязательную связь `employer_company_id`.

Последствия:

- dashboard и список клиентов показывают разные данные;
- вакансии не появляются в карточке клиента;
- статистика кандидатов клиента не формируется;
- потенциально невозможно надёжно изолировать клиентов разных агентств;
- поля контактов, используемые UI, отсутствуют в текущей JSON-схеме `Company`.

### 3.2. Несовместимые статусы pipeline

Pipeline использует `screening`, `professional_interview`, `client_stage`, тогда как `Application` поддерживает `reviewed`, `recommended`, `employer_interview`, `offer`, `probation`, `completed` и другие значения.

Последствия:

- реальные Application могут не попасть ни в одну колонку;
- drag-and-drop отправляет backend неподдерживаемые значения;
- часть этапов никогда не отображается;
- KPI разных экранов считают разные наборы «активных» статусов.

### 3.3. Email вместо user ID

`Candidate.recruiter_id`, `Application.recruiter_id` и `Application.assigned_to` определены как `user.id`, но CRM, Pipeline, AI Matching и Interviews местами сравнивают/записывают `user.email`.

Последствия:

- рекрутер не видит назначенных кандидатов;
- персональный pipeline пустой или неполный;
- назначения и интервью расходятся между экранами;
- RLS и frontend-фильтрация используют разные идентификаторы.

### 3.4. Permissions существуют отдельно от продукта

Permission Matrix редактируется, но большинство экранов проверяет только роль либо вообще показывает действие без проверки. Team Manager входит в общий protected route для admin/manager agency-страниц и может открыть прямые URL, отсутствующие в его меню.

Необходимо согласовать три уровня:

1. backend authorization/RLS;
2. route-level access;
3. доступность кнопок и операций в UI.

## 4. Целевое состояние

После выполнения roadmap кабинет Staffing Agency должен обеспечивать:

- строгую tenant isolation для всех agency-данных;
- одну каноническую модель клиента;
- одни и те же статусы Application во всех экранах;
- ownership исключительно через UUID `user.id` и organization/team IDs;
- полноценные разные кабинеты Org Admin, Recruitment Manager, Team Manager и Recruiter;
- рабочие CRUD-сценарии вакансий, клиентов, кандидатов и compensation;
- рабочий импорт с retry и наблюдаемым статусом;
- AI Matching, создающий валидную, связанную и недублирующуюся Application;
- реальные Billing и Integrations либо честно скрытые незавершённые пункты;
- Hebrew/English UI без смешения направлений и строк;
- понятные loading, empty, error и permission-denied states;
- автоматические unit/integration/E2E проверки всех основных agency-сценариев.

## 5. План реализации по фазам

### Фаза 0. Зафиксировать контракты и baseline

Статус: **завершена 2 августа 2026**.

Артефакты реализации:

- domain, ownership, identifier, status, client и API contracts: [`AGENCY_DOMAIN_CONTRACTS.md`](./AGENCY_DOMAIN_CONTRACTS.md);
- ожидаемое поведение и Definition of Done всех маршрутов: [`AGENCY_ROUTE_ACCEPTANCE.md`](./AGENCY_ROUTE_ACCEPTANCE.md);
- runtime source of truth для ролей, scope и `Application.status`: `src/domain/agency/contracts.js`;
- детерминированные fixtures четырёх agency-ролей и всех статусов: `src/fixtures/agency/agencyFixtures.js`;
- production pipeline больше не подменяет пустой/ошибочный API-ответ демо-записями;
- pipeline, Candidate Drawer, notifications, client detail, TypeScript-типы и EN/HE labels переведены на канонические статусы.

Цель: остановить дальнейшее расхождение frontend и backend.

Работы:

- составить таблицу всех agency-сущностей и их владельцев;
- утвердить канонические значения `Application.status`;
- утвердить, какие поля являются UUID, email и display name;
- определить роли и scope: organization-wide, team-wide, own;
- определить каноническую модель клиента;
- зафиксировать API-контракты для клиентов, jobs, applications, imports и permissions;
- добавить тестовые fixtures для четырёх ролей agency;
- отделить demo data от production routes;
- задокументировать ожидаемый результат каждого `/agency/*` маршрута.

Результат фазы:

- утверждённая domain model;
- status mapping без неоднозначностей;
- role/access matrix;
- API contract checklist.

Критерий завершения: frontend и backend используют одинаковые названия полей, статусов и ownership IDs.

### Фаза 1. Исправить tenant isolation и authorization

Статус: **завершена 2 августа 2026**.

Артефакты реализации:

- зафиксирован и реализован единый organization/team/own access contract: `src/domain/agency/access.js`;
- frontend ownership переведён с email на `User.id` в CRM, pipeline, jobs, interviews, AI Matching и import flows;
- NestJS RLS применяется к list/detail/update/delete и вложенным Candidate/Application/Job/Interview ресурсам;
- прямые `/agency/*`, `/agency/team/*` и `/agency/recruiter/*` маршруты разделены по ролям, а tenant route требует scoped organization context;
- Permission Matrix и Role Templates ограничены текущим tenant/org type, org admin не может изменять глобальные шаблоны;
- permission cache инвалидируется после сохранения, а mutation actions подключены к effective permissions на основных agency-экранах;
- pipeline, candidate list и permission settings показывают отдельный denied/error state;
- добавлены dry-run миграция Base44 ownership и SQL-миграция NestJS полей;
- детали security contract и порядок миграции: [`AGENCY_PHASE_1_SECURITY.md`](./AGENCY_PHASE_1_SECURITY.md);
- историческая автоматическая проверка cross-tenant/cross-team/own scope завершена; постоянные проверки запускаются через `npm run release:verify`.

Цель: сначала гарантировать безопасность и правильную область данных.

Работы:

- заменить сравнения `recruiter_id === user.email` на `user.id`;
- мигрировать старые email-значения в ownership-полях;
- добавить или проверить backend RLS для organization/team/recruiter scope;
- исправить прямой доступ Team Manager и Recruiter к чужим разделам;
- синхронизировать ProtectedRoute с фактической org-type политикой;
- запретить platform admin входить в agency workspace без scoped/impersonation token;
- применять Permission Matrix к create/update/delete/export/download действиям;
- инвалидировать permission cache после изменения матрицы;
- скрывать недоступные действия, сохраняя backend как окончательную границу безопасности;
- добавить 403 state вместо пустого списка или generic error.

Результат фазы:

- данные всегда ограничены текущей организацией и ролью;
- direct URL не расширяет права пользователя;
- frontend permissions соответствуют backend permissions.

Критерий завершения: автоматические access-тесты подтверждают отсутствие cross-tenant и cross-team доступа.

### Фаза 2. Унифицировать клиентов и вакансии

Статус: **завершена 2 августа 2026**.

Артефакты реализации:

- добавлена tenant-scoped сущность `AgencyClient` и миграция существующих связей из вакансий;
- dashboard, список клиентов и client detail переведены на единый `/agency-clients` API;
- создание клиента больше не создаёт `Organization`, а создаёт/связывает `Company` с текущим staffing agency;
- backend вакансий требует активного клиента текущего агентства, сохраняет `employer_company_id` и не доверяет присланному display name;
- создание вакансии из client detail открывает форму с заранее выбранным клиентом;
- Application при создании наследует `organization_id`, `employer_company_id` и данные вакансии с backend;
- KPI клиентов рассчитываются tenant-scoped по Job/Application, архивирование запрещено при открытых вакансиях или активных Application;
- добавлены loading/empty/error/success states для основных client/job операций;
- технический контракт и порядок миграции: [`AGENCY_PHASE_2_CLIENTS.md`](./AGENCY_PHASE_2_CLIENTS.md);
- историческая автоматическая проверка связей и archive policy завершена; постоянные проверки запускаются через `npm run release:verify`.

Цель: сделать клиента полноценным центром agency workflow.

Рекомендуемая модель:

- `Organization` — tenant, которому принадлежит аккаунт;
- `Company` — компания-работодатель;
- `AgencyClient` — связь staffing agency с Company, содержащая status, account manager, контакты, договорные данные и timestamps;
- `Job.employer_company_id` — ссылка на Company;
- `Job.organization_id` — staffing agency, управляющее вакансией.

Работы:

- убрать создание клиента через `Organization.create` из agency dashboard;
- создать единый `ClientService`/API для list/create/get/update/archive;
- добавить tenant-связь агентства с клиентом;
- расширить и синхронизировать Company/AgencyClient DTO со всеми UI-полями;
- заменить свободный ввод company в Job Form на выбор клиента;
- всегда сохранять `employer_company_id`;
- добавить preselected client при создании вакансии из `/agency/clients/:id`;
- привязать Applications к `candidate_id`, `job_id`, `employer_company_id`, `organization_id`;
- исправить client KPIs и dashboard active clients;
- добавить archive policy для клиента с активными jobs/applications;
- реализовать error/loading/empty states и успешные уведомления.

Результат фазы:

- один клиент отображается одинаково на dashboard, в списке и detail;
- вакансии и кандидаты автоматически появляются в карточке клиента;
- cross-agency client data не смешиваются.

Критерий завершения: сценарий «создать клиента → создать вакансию → добавить кандидата → увидеть всё в client detail» проходит end-to-end.

### Фаза 3. Перестроить Application Pipeline

Цель: единый жизненный цикл Application.

Работы:

- заменить UI-статусы на канонический enum либо добавить конфигурируемые стадии с mapping;
- добавить миграцию существующих несовместимых статусов;
- показывать все допустимые Application в колонках;
- убрать mock applications при пустом production pipeline;
- различать empty state и load error;
- сохранять заметки из Candidate Drawer через API;
- подключить кнопки Send Message и Schedule Interview;
- передавать полную Job в AI explanation;
- унифицировать расчёт «in process» между dashboard, clients и pipeline;
- обрабатывать optimistic update rollback с видимой ошибкой;
- создавать timeline и notification только после успешного изменения статуса;
- определить, какие роли могут перемещать кандидата на каждый этап.

Результат фазы:

- ни одна Application не исчезает между этапами;
- drag-and-drop стабильно сохраняется;
- notes, interviews, messages и timeline переживают перезагрузку.

Критерий завершения: переход Application через весь pipeline проходит без неподдерживаемых статусов и потери данных.

### Фаза 4. Довести CRM и role-specific кабинеты

Цель: рабочий ежедневный кабинет для manager и recruiter ролей.

Работы CRM:

- исправить Refresh, который сейчас может работать как append;
- реализовать cursor/page pagination вместо повторной загрузки первых 50 записей;
- использовать server-side search и server-side status filters;
- убрать неиспользуемый `lastCandidateId` либо применить его как cursor;
- исключать дубликаты при append;
- добавить error state и `try/finally` во все загрузки;
- применять permissions к delete, edit, download, send и assign;
- передавать обязательные props CRM-компонентам;
- проверить Documents, Notes, Interviews, WhatsApp и Applications tabs;
- сделать явный переход из Application к Candidate и обратно.

Работы по ролям:

- реализовать `/agency/recruiter/dashboard` с личными KPI и задачами;
- заменить `/agency/recruiter/jobs` на доступные/назначенные agency jobs;
- реализовать реальные фильтры для candidates/all, candidates/active и candidates/pipeline;
- ограничить recruiter CRM собственными и разрешёнными unassigned кандидатами;
- ограничить Team Manager данными своей команды;
- исправить ссылки на dashboard/CRM для `/agency/team/*`;
- не использовать admin namespace как скрытый fallback для Team Manager.

Результат фазы:

- каждый пользователь видит правильный объём данных и свои рабочие действия;
- списки корректно работают с большими объёмами.

Критерий завершения: отдельные E2E-наборы проходят для Org Admin, Recruitment Manager, Team Manager и Recruiter.

### Фаза 5. Jobs, AI Matching, Import и Compensation

Цель: завершить основные бизнес-функции вокруг подбора.

Jobs:

- определить полноценную модель job status: draft/open/on_hold/filled/closed;
- связать `/open`, `/filled`, `/hold` с реальными фильтрами;
- локализовать Jobs и Job Form;
- добавить validation для salary range, контактов и client selection;
- добавить error state и защиту от повторных mutations;
- получать KPI через count API, а не ограниченный список из 200 записей.

AI Matching:

- создавать Application с `candidate_id`, `recruiter_id`, `organization_id` и `employer_company_id`;
- использовать единый service для создания Application;
- проверять дубликаты в обоих режимах matching;
- добавить idempotency/unique constraint для пары candidate + job;
- показывать причину ошибки backend, не оставляя ложный success state;
- проверить tenant/recruiter scope рекомендаций.

Import:

- хранить URL исходного файла или безопасный import source reference;
- при Retry реально повторно вызывать обработчик;
- исправить `/admin/crm` на role-aware agency CRM route;
- убрать validation seeding из production UI или ограничить dev/admin feature flag;
- показывать per-row errors и downloadable error report;
- проверять file type/size до upload;
- гарантировать organization/recruiter ownership импортированных Candidate;
- добавить защиту от повторного запуска одной batch.

Compensation:

- заменить `client_name` и ручной `job_id` на entity selectors;
- хранить `employer_company_id`/client relation;
- унифицировать permission policy с Permission Matrix;
- проверить visibility полей для Recruiter и Team Manager;
- исправить React Query invalidation на object syntax;
- добавить mutation error states и audit events.

Результат фазы:

- вакансии, matching, импорт и compensation используют одни и те же entity relationships;
- повторные действия не создают дубликаты.

Критерий завершения: сквозные сценарии sourcing → import → CRM → matching → pipeline → hire работают без ручного исправления данных.

### Фаза 6. Реализовать или честно скрыть незавершённые модули

Цель: убрать интерфейс, который обещает несуществующую функциональность.

Teams:

Статус: **реализовано 11 августа 2026**.

Артефакты реализации:

- tenant-scoped API `/agency-teams` для участников, команд и приглашений;
- роли Org Admin, Recruitment Manager, Team Manager и Recruiter;
- создание команд, назначение team manager и membership;
- одноразовые приглашения со сроком действия, повторной выдачей и отменой;
- принятие приглашения через `/register`, создание реального пользователя и вход;
- смена роли/команды, активация и деактивация пользователя;
- organization-scoped audit events для команд, пользователей и приглашений;
- EN/HE, RTL/LTR, loading/empty/error states и role-aware actions в `/agency/teams`.

- список пользователей организации;
- приглашения;
- назначение ролей;
- создание команд;
- team manager/recruiter membership;
- деактивация пользователя;
- pending invitations и audit log.

Reports:

- funnel по этапам;
- time-to-hire/time-in-stage;
- source effectiveness;
- recruiter/team performance;
- client/job conversion;
- placement и compensation metrics;
- date/client/team filters и export permissions.

Activity:

- organization-scoped AuditLog;
- фильтры actor/action/entity/date;
- переход к связанной сущности;
- понятное отображение before/after;
- pagination и export.

Billing:

- удалить статические суммы и счета 2024 года;
- показывать текущий plan, limits, usage, invoices и payment status;
- реализовать upgrade/downgrade/cancel flows или read-only state;
- ограничить доступ Org Admin.

Integrations:

- загружать реальные connection states;
- OAuth/connect/disconnect flows;
- scopes и last sync;
- error/reconnect state;
- feature flags для недоступных интеграций;
- убрать фиктивный статус Gmail connected.

До реализации пункт должен быть скрыт feature flag либо явно помечен «В разработке» без активных кнопок.

Критерий завершения: в навигации нет экранов, притворяющихся рабочими.

### Фаза 7. UI, локализация и устойчивость

Цель: единое качество интерфейса во всём `/agency/*`.

Работы:

- вынести все строки в i18n;
- убрать принудительный `dir="rtl"` там, где язык может быть English;
- унифицировать термины Candidate/Application/Client/Job/Pipeline;
- использовать общие page shells, cards, tables и modal patterns;
- добавить mobile states для широких таблиц;
- добавить focus trap, Escape, backdrop close и aria labels для модалок;
- добавить подтверждение и error state для destructive actions;
- убрать `console.log`, debug-тексты и опечатки;
- исправить Unauthorized redirect с учётом `orgType`;
- добавить toast/result state для всех mutations;
- не показывать empty state при сетевой ошибке;
- заменить list-based KPI на backend count/aggregation endpoints;
- проверить cache invalidation после всех create/update/delete операций.

Результат фазы:

- Hebrew и English одинаково полноценны;
- все экраны визуально и поведенчески согласованы;
- ошибки не маскируются под пустые данные.

Критерий завершения: визуальный QA пройден в RTL/LTR, desktop/mobile и loading/empty/error/denied состояниях.

### Фаза 8. Автоматизация QA и выпуск

Цель: подтвердить готовность и предотвратить регрессии.

Обязательные проверки:

- исправить agency-related lint errors;
- исправить typecheck конфигурацию и реальные type errors;
- unit tests для status mapping, ownership filters и permissions;
- integration tests для client/job/application/import services;
- E2E для onboarding;
- E2E для создания клиента и вакансии;
- E2E для import и retry;
- E2E для AI Matching и duplicate prevention;
- E2E для движения Application по pipeline;
- E2E для каждой agency-роли;
- cross-tenant security tests;
- тесты route guards и прямого перехода по URL;
- RTL/LTR visual regression;
- accessibility smoke test;
- performance test для больших списков;
- staging data migration rehearsal;
- monitoring API errors, failed imports и failed status transitions.

Release gates:

- `npm run build` проходит;
- `npm run lint` проходит;
- `npm run typecheck` проходит;
- agency unit/integration/E2E suite проходит;
- нет P0/P1 дефектов;
- проверены все маршруты из route matrix;
- проверены четыре agency-роли;
- подтверждена tenant isolation;
- подготовлен rollback plan для schema/data migrations.

## 6. Зависимости и порядок выполнения

Фазы нельзя безопасно выполнять в произвольном порядке:

1. Контракты и ownership определяют все следующие изменения.
2. Tenant isolation и permissions должны быть исправлены до расширения функциональности.
3. Клиенты и вакансии должны быть унифицированы до исправления client detail, AI и compensation.
4. Статусы Application должны быть унифицированы до доработки pipeline и отчётов.
5. CRM и role scopes должны быть стабильны до E2E автоматизации.
6. Reports, Activity, Billing и Integrations следует реализовывать после стабилизации core workflow.
7. Финальная UI-полировка и release QA выполняются на уже стабильных контрактах.

Критический путь:

`Domain contracts → Tenant/permissions → Client model → Job/Application links → Pipeline → CRM roles → AI/Import/Compensation → Missing modules → UI/i18n → Release QA`

## 7. Рекомендуемое разбиение задач

Каждую фазу следует разбивать на небольшие PR:

- schema/data migration;
- backend DTO/service/authorization;
- frontend service/hooks;
- route/page UI;
- tests;
- documentation and cleanup.

Не рекомендуется объединять миграцию данных, массовый UI rewrite и permission changes в один PR. Для рискованных миграций нужны backward-compatible чтение, отдельный backfill и только затем удаление legacy-полей.

## 8. Definition of Done для всего agency-модуля

Agency-модуль считается завершённым, когда:

- все маршруты `/agency/*` либо реализованы, либо отсутствуют в навигации;
- нет расхождения между dashboard, clients, jobs, CRM и pipeline;
- каждый объект имеет однозначного tenant owner;
- client/job/candidate/application связи основаны на IDs, а не display strings;
- все роли видят только разрешённые данные и действия;
- reload не теряет заметки, стадии или результаты операций;
- пустая база не показывает demo records;
- ошибки backend отображаются пользователю;
- большие списки используют server pagination и aggregation;
- Hebrew/English и RTL/LTR полностью поддерживаются;
- Billing и Integrations отображают реальные данные;
- build, lint, typecheck и agency E2E проходят;
- проведён финальный авторизованный browser walkthrough каждого маршрута и каждой роли.

## 9. Основные файлы, затронутые аудитом

- `src/App.jsx`
- `src/config/navigation/agencyNav.js`
- `src/components/layouts/StaffingAgencyLayout.jsx`
- `src/components/layouts/AgencyRecruiterLayout.jsx`
- `src/components/layouts/SidebarLayout.jsx`
- `src/lib/ProtectedRoute.jsx`
- `src/lib/AuthContext.jsx`
- `src/pages/agency/AgencyDashboard.jsx`
- `src/pages/agency/AgencyClients.jsx`
- `src/pages/agency/AgencyClientDetail.jsx`
- `src/pages/agency/AgencyOnboarding.jsx`
- `src/pages/admin/ManageJobsPage.jsx`
- `src/components/employer/JobFormModal.jsx`
- `src/pages/crm/CandidateListCRMPage.jsx`
- `src/pages/crm/CandidateCRMPage.jsx`
- `src/pages/recruitment/PipelinePage.jsx`
- `src/hooks/usePipelineData.js`
- `src/components/ats/CandidateDrawer.jsx`
- `src/pages/ai/AIMatchingPage.jsx`
- `src/pages/admin/ImportDashboard.jsx`
- `src/pages/admin/CompensationPage.jsx`
- `src/pages/admin/PermissionsPage.jsx`
- `src/pages/admin/RoleSettingsPage.jsx`
- `src/pages/admin/BillingSettings.jsx`
- `src/pages/admin/IntegrationsSettings.jsx`
- `src/api/base44Client.js`
- `base44/entities/Company.jsonc`
- `base44/entities/Job.jsonc`
- `base44/entities/Candidate.jsonc`
- `base44/entities/Application.jsonc`
