# Роли Staffing Agency: назначение, возможности и план реализации

Дата актуализации: 17 августа 2026  
Основание: [`1_AGENCY_AUDIT_ROADMAP.md`](./1_AGENCY_AUDIT_ROADMAP.md), [`AGENCY_DOMAIN_CONTRACTS.md`](./AGENCY_DOMAIN_CONTRACTS.md), текущие frontend routes и backend authorization.

## 1. Цель документа

Этот документ описывает четыре роли кабинета Staffing Agency:

- для чего предназначена каждая роль;
- какие данные она должна видеть;
- какие действия она должна выполнять;
- что уже реализовано, что реализовано частично и чего ещё нет;
- в каком порядке довести каждую роль до production-ready состояния.

Документ относится только к tenant с `org_type=staffing_agency`. Platform Admin не является одной из ролей агентства и может входить в workspace только через явно ограниченную impersonation-сессию.

## 2. Общая модель доступа

Доступ всегда складывается из трёх независимых проверок:

1. **Tenant scope** — пользователь видит только данные своего `organization_id`.
2. **Role scope** — роль определяет организационный, командный или персональный объём данных.
3. **Permission Matrix** — определяет допустимое действие: просмотр, создание, изменение, удаление, экспорт, скачивание CV, работа с compensation, пользователями и настройками.

Backend authorization является окончательной границей безопасности. Route guard и скрытие/блокировка кнопок в UI должны повторять backend-правила, но не заменять их.

| Роль                | Scope                            | Основная ответственность                          | Не должна получать доступ                                                     |
| ------------------- | -------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| Org Admin           | Вся организация                  | Владелец и администратор workspace                | Чужие tenant, platform-функции без отдельного права                           |
| Recruitment Manager | Вся организация                  | Руководитель рекрутмента и операционных процессов | Billing, integrations и изменение Permission Matrix по умолчанию              |
| Team Manager        | Только своя команда              | Управление работой команды рекрутеров             | Другие команды и настройки организации                                        |
| Recruiter           | Собственные и назначенные записи | Ежедневная работа с кандидатами и вакансиями      | Чужие кандидаты, команды, системные настройки и общая финансовая конфигурация |

Канонические правила выборки:

- Org Admin: `record.organization_id === user.organization_id`;
- Recruitment Manager: тот же organization-wide scope;
- Team Manager: tenant + `record.team_manager_id === user.id` и рекрутеры назначенной команды;
- Recruiter: tenant + `record.recruiter_id === user.id` или `record.assigned_to === user.id`.

## 3. Сводная матрица возможностей

Обозначения: **Управление** — просмотр, создание, изменение, назначение и архивирование в разрешённом scope; **Работа** — выполнение операционных действий без системной конфигурации; **Просмотр** — read-only; **Нет** — функция скрыта и прямой URL запрещён.

| Функциональная область   | Org Admin               | Recruitment Manager                                 | Team Manager           | Recruiter                                     |
| ------------------------ | ----------------------- | --------------------------------------------------- | ---------------------- | --------------------------------------------- |
| Dashboard и KPI          | Вся организация         | Вся организация                                     | Своя команда           | Личные показатели                             |
| Клиенты                  | Управление              | Операционное управление                             | Просмотр связанных     | Просмотр связанных с назначенными вакансиями  |
| Вакансии                 | Управление              | Управление                                          | Управление в команде   | Работа с назначенными                         |
| Кандидаты и CRM          | Управление              | Управление                                          | Управление в команде   | Управление собственными/назначенными          |
| Application Pipeline     | Управление              | Управление                                          | Управление в команде   | Работа со своими Application                  |
| AI Matching              | Весь tenant             | Весь tenant                                         | Данные команды         | Назначенные jobs/candidates                   |
| Импорт                   | Весь tenant             | Весь tenant                                         | В свою команду         | В собственный scope, если разрешено политикой |
| Compensation             | Конфигурация и просмотр | Операционное управление                             | Командные начисления   | Только собственные начисления                 |
| Teams и пользователи     | Полное управление       | Просмотр, создание команд и операционные назначения | Просмотр своей команды | Нет                                           |
| Роли и Permission Matrix | Полное управление       | Read-only                                           | Нет                    | Нет                                           |
| Reports                  | Организация             | Организация                                         | Команда                | Личные показатели при необходимости           |
| Activity / AuditLog      | Весь tenant             | Операционные события tenant                         | События команды        | Только собственные действия                   |
| Billing и integrations   | Управление              | Только статус                                       | Нет                    | Нет                                           |

## 4. Org Admin

### 4.1. Назначение роли

Org Admin — владелец кабинета агентства и единственная роль с полной административной ответственностью внутри tenant. Роль предназначена для первоначальной настройки организации, управления пользователями и политиками доступа, контроля бизнеса агентства и системных интеграций.

### 4.2. Что роль должна уметь

- проходить onboarding и создавать staffing agency workspace;
- видеть dashboard и KPI всей организации;
- создавать, изменять и архивировать клиентов;
- создавать вакансии, связывать их с клиентами, назначать менеджеров и рекрутеров;
- видеть и управлять всеми кандидатами и Application своего tenant;
- управлять pipeline, интервью, сообщениями, заметками, документами и timeline;
- запускать импорт, повторять ошибки импорта и получать error report;
- использовать AI Matching по всем доступным jobs/candidates;
- настраивать compensation plans и видеть выплаты организации;
- создавать команды, приглашать пользователей, менять роли и команды, активировать и деактивировать участников;
- изменять Permission Matrix и названия ролей;
- видеть организационные отчёты и полный AuditLog;
- управлять тарифом, счетами и integrations;
- экспортировать данные только при наличии соответствующего permission.

### 4.3. Текущее состояние

**Реализовано или в основном реализовано:**

- отдельные защищённые organization-wide routes;
- tenant-scoped backend RLS для основных сущностей;
- единая модель AgencyClient и связь клиента с вакансиями;
- teams, members и invitations, включая принятие, повторную выдачу и отмену приглашения;
- экран Permission Matrix и инвалидация frontend cache после сохранения;
- основные экраны jobs, CRM, pipeline, AI Matching, import и compensation существуют.

**Реализовано частично:**

- dashboard, jobs, CRM, pipeline, AI Matching, import и compensation ещё не выполняют все acceptance criteria roadmap;
- Permission Matrix применяется только к части действий; многие backend controllers пока разрешают операции по широкой роли;
- roles/settings требуют финальной синхронизации с effective permissions и безопасными правилами назначения;
- onboarding, error states, pagination, i18n, RTL/LTR и mutation states требуют полной проверки.

**Не реализовано до production-ready уровня:**

- Reports;
- Activity/AuditLog UI;
- реальные Billing и Integrations flows;
- полный набор role E2E, security и visual regression тестов.

### 4.4. Поэтапный план для Org Admin

#### Фаза OA-1. Закрепить административную границу

- сделать `GET /permissions/effective` единым источником effective permissions;
- проверять `manage_users` и `manage_settings` на backend для всех административных mutations;
- запретить изменение глобальных templates из tenant-сессии;
- добавить audit event для изменения ролей, permissions, billing и integrations;
- покрыть cross-tenant и direct URL тестами.

Критерий готовности: Org Admin управляет только своим tenant, а снятие permission немедленно блокирует действие и в API, и в UI.

#### Фаза OA-2. Завершить core operations

- завершить jobs statuses и route-фильтры `open/filled/hold`;
- завершить CRM pagination/search/filter и все candidate tabs;
- довести pipeline transitions, notes, messages, interviews и rollback;
- завершить AI Matching duplicate prevention;
- завершить import retry, idempotency и downloadable error report;
- связать compensation только с client/job/user IDs.

Критерий готовности: Org Admin проводит сквозной сценарий client → job → candidate → Application → pipeline → hire без ручной коррекции данных.

#### Фаза OA-3. Реализовать управленческие модули

- создать Reports с funnel, time-to-hire, source, recruiter/team, client/job и placement метриками;
- создать Activity на основе organization-scoped AuditLog;
- подключить реальные plan, limits, usage, invoices и payment status;
- реализовать connection state, connect/disconnect, scopes, last sync и reconnect для integrations;
- до готовности скрывать недоступные функции feature flag.

Критерий готовности: в навигации нет активных заглушек или фиктивных данных.

#### Фаза OA-4. Финальная приёмка

- E2E onboarding и управления командой;
- E2E изменения permissions и немедленного отзыва доступа;
- E2E billing/integrations в поддерживаемом режиме;
- RTL/LTR, mobile, accessibility и error-state проверка;
- build, lint, typecheck и полный agency test suite.

## 5. Recruitment Manager

### 5.1. Назначение роли

Recruitment Manager — руководитель рекрутмента на уровне всего агентства. Роль отвечает за загрузку команд, распределение вакансий и кандидатов, качество pipeline и выполнение операционных KPI, но не является владельцем тарифа или политик безопасности.

### 5.2. Что роль должна уметь

- видеть KPI, клиентов, вакансии, кандидатов и Application всей организации;
- создавать и изменять клиентов и вакансии в рамках операционной политики;
- назначать вакансии, кандидатов и Application Team Manager/Recruiter;
- управлять стадиями pipeline, интервью, коммуникациями и приоритетами;
- запускать импорт и распределять импортированных кандидатов;
- использовать AI Matching по всему tenant;
- создавать команды и назначать Team Manager в разрешённых пределах;
- видеть пользователей, роли и effective permissions в read-only режиме;
- управлять operational compensation, но не системной финансовой конфигурацией;
- видеть organizational reports и operational AuditLog;
- видеть статус тарифа и integrations без права изменения по умолчанию.

### 5.3. Текущее состояние

**Реализовано или в основном реализовано:**

- organization-wide RLS аналогично Org Admin;
- доступ к основным operational routes;
- чтение Teams overview и создание/изменение команд через текущий API;
- jobs, candidates, applications и import доступны на уровне роли.

**Реализовано частично:**

- нет отдельного role-specific dashboard: используется общий AgencyDashboard;
- team/member assignment не полностью согласован с Permission Matrix;
- compensation policy и видимость финансовых полей требуют уточнения;
- core screens наследуют общие незавершённые задачи CRM, pipeline, jobs, import и AI Matching.

**Не реализовано:**

- read-only routes для permissions, roles, billing status и integrations status: сейчас settings routes доступны только Org Admin;
- полноценные Reports и Activity;
- отдельный E2E-набор Recruitment Manager.

### 5.4. Поэтапный план для Recruitment Manager

#### Фаза RM-1. Зафиксировать отличие от Org Admin

Формальная action policy: [`AGENCY_RM1_ACTION_POLICY.md`](./AGENCY_RM1_ACTION_POLICY.md).

- формально определить, какие client/job/team/assignment mutations разрешены роли;
- добавить backend action policy поверх organization-wide RLS;
- запретить billing, integrations и редактирование Permission Matrix;
- добавить read-only settings routes и скрыть controls изменения;
- подключить `manage_users`, `view_compensation`, `edit_compensation`, `export` к backend и UI.

Критерий готовности: Recruitment Manager имеет полный operational scope, но не может изменить безопасность, владельца tenant, тариф или integrations.

#### Фаза RM-2. Завершить управление рекрутментом

Реализация и операционные контракты: [`AGENCY_RM2_RECRUITMENT_MANAGEMENT.md`](./AGENCY_RM2_RECRUITMENT_MANAGEMENT.md).

- создать manager dashboard с funnel, SLA, overdue stages, workload и placements;
- реализовать назначение job/candidate/Application команде и рекрутеру одной транзакцией;
- добавить bulk assign/reassign с audit reason;
- завершить организационные jobs, CRM, pipeline, AI Matching и import flows;
- добавить notifications о просроченных стадиях и перегрузке команды.

Критерий готовности: менеджер распределяет работу и контролирует весь pipeline без административного доступа.

#### Фаза RM-3. Отчётность и контроль качества

Реализация и KPI-контракты: [`AGENCY_RM3_REPORTING_AND_QUALITY_CONTROL.md`](./AGENCY_RM3_REPORTING_AND_QUALITY_CONTROL.md).

- реализовать organizational reports и фильтры по client/job/team/recruiter/date;
- реализовать operational Activity с переходом к сущности;
- добавить export с permission и audit event;
- обеспечить единые KPI на dashboard, reports, clients и pipeline.

Критерий готовности: одинаковые фильтры дают одинаковые totals во всех управленческих экранах.

#### Фаза RM-4. Финальная приёмка

Контракты и результаты приёмки: [`AGENCY_RM4_FINAL_ACCEPTANCE.md`](./AGENCY_RM4_FINAL_ACCEPTANCE.md).

- E2E назначения между командами и рекрутерами;
- negative E2E для permissions edit, billing mutation и integrations mutation;
- нагрузочный тест больших списков;
- RTL/LTR, denied/error и cache invalidation проверки.

## 6. Team Manager

### 6.1. Назначение роли

Team Manager — руководитель конкретной команды рекрутеров. Роль отвечает за вакансии, кандидатов, pipeline, производительность и compensation своей команды, но не видит другие команды и не управляет настройками организации.

### 6.2. Что роль должна уметь

- видеть dashboard и KPI только своей команды;
- видеть участников своей команды и их текущую загрузку;
- работать только с jobs/candidates/applications, имеющими её `team_manager_id`;
- назначать и перераспределять записи между рекрутерами собственной команды;
- изменять pipeline в командном scope;
- использовать AI Matching только для данных команды;
- импортировать кандидатов в свою команду;
- видеть и при наличии permission изменять командные compensation allocations;
- видеть team reports и события команды;
- получать 403/404 при прямом запросе чужой команды или записи.

### 6.3. Текущее состояние

**Реализовано или в основном реализовано:**

- отдельный namespace `/agency/team/*` и отдельная навигация;
- прямые organization-wide routes закрыты route guard;
- backend RLS фильтрует основные сущности по `team_manager_id=user.id`;
- team-aware routes существуют для dashboard, jobs, CRM, pipeline, compensation, AI Matching и import.

**Реализовано частично:**

- многие team routes переиспользуют общие страницы без доказанной корректности всех внутренних ссылок и агрегатов;
- dashboard не гарантирует team-only KPI для каждого показателя;
- jobs/API позволяют широкие role-based mutations и требуют action-level permission checks;
- импорт доступен, но ownership, retry и idempotency должны быть подтверждены E2E;
- compensation специально возвращается organization-wide в общем RLS utility, поэтому scope должен проверяться отдельной policy.

**Не реализовано:**

- `/agency/team/reports` является заглушкой;
- отдельный team Activity UI;
- полноценный экран управления только участниками своей команды;
- полный Team Manager E2E-набор.

### 6.4. Поэтапный план для Team Manager

#### Фаза TM-1. Закрыть team boundary

- сделать `team_id` и membership канонической связью команды, сохранив совместимый `team_manager_id` на период миграции;
- вычислять team scope на backend по membership, а не доверять query/body IDs;
- запрещать назначение пользователя из другой команды или tenant;
- добавить action policy для create/update/delete/export/compensation;
- проверить все nested resources: notes, documents, timeline, interviews, messages и imports.

Критерий готовности: Team Manager не может получить или изменить данные другой команды ни одним list/detail/nested endpoint.

#### Фаза TM-2. Завершить командный кабинет

- создать team dashboard с workload, SLA, funnel, interviews и placements;
- добавить read-only roster своей команды;
- реализовать assign/reassign между рекрутерами команды;
- исправить role-aware ссылки и breadcrumbs во всех переиспользуемых страницах;
- завершить team jobs, CRM, pipeline, AI Matching, import и compensation flows.

Критерий готовности: все действия выполняются внутри `/agency/team/*` и сохраняют team scope после refresh/deep link.

#### Фаза TM-3. Командная аналитика

- заменить placeholder Team Reports;
- добавить recruiter workload, funnel, time-in-stage, source и placement metrics;
- добавить team Activity или фильтр AuditLog только по событиям команды;
- ограничить export Permission Matrix и журналировать экспорт.

Критерий готовности: Team Manager получает командные показатели без organization-wide утечки.

#### Фаза TM-4. Финальная приёмка

- E2E для manager двух разных команд одного tenant;
- cross-team negative tests для URL, API и nested resources;
- E2E import → assign → pipeline → hire в одной команде;
- проверка aggregate endpoints, compensation visibility и exports.

## 7. Recruiter

### 7.1. Назначение роли

Recruiter — исполнитель ежедневного recruitment workflow. Роль работает с назначенными вакансиями и собственными кандидатами, ведёт коммуникации, перемещает Application по разрешённым стадиям и отвечает за актуальность данных. Она не управляет организацией, командами и системными настройками.

### 7.2. Что роль должна уметь

- видеть персональный dashboard: задачи, назначенные jobs/candidates, интервью, overdue stages и placements;
- видеть только собственных/назначенных кандидатов и разрешённый unassigned pool;
- работать с назначенными agency jobs, а не с публичным job board;
- создавать и редактировать кандидатов в own scope;
- связывать кандидата с вакансией без дублирования пары candidate + job;
- вести заметки, документы, теги, сообщения, интервью и timeline;
- перемещать Application только по разрешённым переходам;
- использовать AI Matching только по доступным jobs/candidates;
- импортировать в собственный scope, если Permission Matrix разрешает импорт;
- видеть собственную compensation информацию без чужих ставок и общей конфигурации;
- видеть только свои activity events и личные показатели.

### 7.3. Текущее состояние

**Реализовано или в основном реализовано:**

- отдельный recruiter namespace и layout;
- backend RLS по `recruiter_id=user.id`, а для Application также поддержан `assigned_to=user.id`;
- CRM, candidate detail, pipeline и AI Matching routes существуют;
- ownership использует user ID в основном access contract.

**Реализовано частично:**

- `/candidates`, `/all` и `/active` переиспользуют один экран, а route-specific server filters не подтверждены;
- `/candidates/pipeline` открывает pipeline, а не отдельную выборку кандидатов с активной Application;
- CRM tabs и persistent actions требуют полного E2E;
- pipeline, AI Matching и duplicate prevention наследуют незавершённые core-задачи;
- backend сейчас допускает recruiter в широкие job/application/candidate mutation role lists, поэтому нужны точные action и transition policies.

**Не реализовано:**

- recruiter dashboard остаётся `PlaceholderPage`;
- recruiter jobs открывает публичный компонент `Jobs`, а не назначенные agency jobs;
- recruiter import route отсутствует, хотя целевая матрица допускает import-to-own по permission;
- recruiter compensation и personal reports/activity routes отсутствуют;
- полноценный Recruiter E2E-набор.

### 7.4. Поэтапный план для Recruiter

#### Фаза R-1. Закрыть own boundary

- унифицировать own scope для Candidate, Application, Job, Interview, Note, Document, Message и Timeline;
- отдельно определить доступ к unassigned candidate pool и операцию claim;
- запретить подмену `recruiter_id`, `assigned_to`, `team_id` и `organization_id` в request body;
- определить допустимые recruiter pipeline transitions;
- применить Permission Matrix к create/update/delete/export/download CV/import.

Критерий готовности: Recruiter не может прочитать, назначить себе или изменить чужую запись без явной разрешённой операции claim/assign.

#### Фаза R-2. Реализовать персональный workspace

- заменить placeholder dashboard на личные KPI, задачи, интервью и overdue stages;
- заменить публичный Jobs на список назначенных/доступных agency jobs;
- реализовать server filters для `all`, `active` и `pipeline` candidate routes;
- обеспечить role-aware links между job, candidate, Application и pipeline;
- завершить notes, documents, messages, interviews и timeline с persistence.

Критерий готовности: Recruiter выполняет ежедневную работу только в `/agency/recruiter/*`, а refresh не меняет выборку и не теряет изменения.

#### Фаза R-3. Matching, import и личные данные

- создавать из AI Matching полную Application с server-derived tenant/client/job ownership;
- добавить unique constraint и idempotency для candidate + job;
- реализовать import-to-own или явно исключить импорт для Recruiter из продуктовой политики;
- добавить read-only own compensation без раскрытия чужих условий;
- добавить personal performance/activity при наличии продуктовой необходимости.

Критерий готовности: matching и import не создают дубликаты, а все новые записи сразу видны в личной CRM и pipeline.

#### Фаза R-4. Финальная приёмка

- E2E dashboard → job → candidate → Application → interview → status transition;
- negative E2E на чужого рекрутера, другую команду и tenant;
- E2E route filters и deep links;
- проверка permission denied, error, loading, empty, RTL/LTR и mobile states.

## 8. Общий порядок реализации

Работы по ролям следует выполнять не четырьмя независимыми ветками, а вертикальными слоями, чтобы одна роль не получила готовый UI поверх небезопасного backend.

### Общая фаза 1. Authorization и effective permissions

Выполнить OA-1, RM-1, TM-1 и R-1. Добавить единый backend policy layer, effective permission endpoint, nested-resource scope и security tests.

### Общая фаза 2. Core workflow

Завершить jobs, clients, CRM, canonical Application pipeline, interviews, messages и timeline для всех scope. Каждая операция должна принимать entity IDs, а ownership должен вычисляться backend.

### Общая фаза 3. Role-specific workspaces

Реализовать разные dashboard, recruiter jobs/candidate filters, team roster/assignment и Recruitment Manager operational controls. Удалить fallback на чужой namespace и публичные компоненты.

### Общая фаза 4. AI Matching, import и compensation

Унифицировать создание Application, duplicate prevention, idempotency, ownership импорта и видимость compensation для всех ролей.

### Общая фаза 5. Reports, Activity, Billing и Integrations

Реализовать scoped reports/activity. Billing и integrations оставить только Org Admin для mutations; Recruitment Manager получает read-only status. До готовности пункты скрываются feature flag или показывают честный unavailable state без активных кнопок.

### Общая фаза 6. UI и локализация

Завершить EN/HE, RTL/LTR, accessibility, mobile layouts, loading/empty/error/denied states, confirmations и cache invalidation.

### Общая фаза 7. QA и выпуск

- unit tests для scope, permissions, status transitions и mappings;
- integration tests для всех protected actions и nested resources;
- E2E для каждой роли;
- cross-tenant, cross-team и cross-recruiter negative tests;
- visual/accessibility/performance проверки;
- build, lint, typecheck и release verification;
- staging migration rehearsal и rollback plan.

## 9. Приоритет релиза

### P0 — безопасность и корректность данных

- tenant/team/own scope на backend;
- effective Permission Matrix на backend и frontend;
- запрет подмены ownership IDs;
- canonical Application transitions;
- cross-tenant и cross-team tests.

### P1 — ежедневная работа

- recruiter dashboard и assigned jobs;
- role-specific candidate filters;
- manager/team dashboards и назначения;
- CRM pagination/search;
- persistent pipeline actions;
- import retry/idempotency и AI duplicate prevention.

### P2 — управление и аналитика

- Reports и Activity;
- compensation visibility;
- read-only settings для Recruitment Manager;
- реальные Billing и Integrations.

### P3 — финальная полировка

- полная локализация и accessibility;
- mobile/visual regression;
- performance и observability.

## 10. Definition of Done для ролевой модели

Ролевая логика считается завершённой, когда:

- каждая роль видит только свой tenant и свой data scope;
- прямой URL и ручной API-запрос не расширяют доступ;
- Permission Matrix применяется одинаково в backend, routes и UI actions;
- Org Admin и Recruitment Manager различаются административными правами, а не только названием;
- Team Manager не видит данные другой команды;
- Recruiter работает только с собственными/назначенными сущностями;
- dashboard, lists, details, reports и exports используют одинаковые scope и KPI definitions;
- нет активных заглушек и фиктивных billing/integration states;
- все mutations имеют audit event, pending/success/error state и корректную cache invalidation;
- EN/HE, RTL/LTR, desktop/mobile и accessibility прошли проверку;
- E2E-наборы четырёх ролей и negative security tests проходят в CI.
