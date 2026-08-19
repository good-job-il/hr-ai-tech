# Staffing Agency: domain и API contracts

Дата фиксации baseline: 2 августа 2026  
Статус: канонический контракт Фазы 0  
Источник истины для runtime-констант: `src/domain/agency/contracts.js`

## 1. Инварианты

1. `Organization` с `org_type=staffing_agency` — tenant и верхняя граница изоляции данных.
2. Любая tenant-owned запись содержит `organization_id`. Backend получает организацию из authenticated context и не доверяет произвольному tenant ID от клиента.
3. Поле с окончанием `_id` содержит ID сущности или `user.id`, но не email и не display name.
4. Email используется только в контактных полях и delivery-адресах: `email`, `candidate_email`, `contact_email`, `recipient_email`.
5. Денормализованные `candidate_name`, `job_title`, `company` нужны только для отображения и истории. Они не заменяют связи по ID.
6. UI, API и schema используют один enum `Application.status`.
7. Пустой ответ production API отображается как empty state. Fixtures и demo data не подменяют production-ответ.

## 2. Сущности и ownership

| Сущность               | Назначение                      | Владелец / tenant key          | Обязательные связи                                                      | Состояние                           |
| ---------------------- | ------------------------------- | ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| `Organization`         | Аккаунт staffing agency         | `id`                           | `org_type=staffing_agency`                                              | Есть                                |
| `User`                 | Пользователь и роль             | `organization_id`              | manager links через `user.id`                                           | Есть                                |
| `Company`              | Компания-работодатель           | Не является tenant             | `id`                                                                    | Есть, schema неполная               |
| `AgencyClient`         | Связь агентства с работодателем | `organization_id`              | `company_id`, `account_manager_id`                                      | Целевой контракт, реализация Фазы 2 |
| `Job`                  | Вакансия клиента                | `organization_id`              | `employer_company_id`, `created_by_user_id`, опционально `recruiter_id` | Есть, binding требуется в Фазе 2    |
| `Candidate`            | Карточка кандидата агентства    | `organization_id`              | `recruiter_id`, `team_manager_id`, `recruitment_manager_id`             | Есть                                |
| `Application`          | Кандидат в контексте вакансии   | `organization_id`              | `job_id`, `candidate_id`, `employer_company_id`, ownership IDs          | Есть, UI унифицирован в Фазе 0      |
| `CandidateImportBatch` | Пакет импорта                   | `organization_id`              | ID инициатора, source и counters                                        | Есть                                |
| `CompensationPlan`     | Правила вознаграждения          | `organization_id`              | client/job/user IDs по типу плана                                       | Есть, связи уточняются в Фазе 2/6   |
| `PermissionMatrix`     | Разрешения ролей                | `organization_id` + `org_type` | role, resource, action                                                  | Есть                                |
| `AuditLog`             | Неизменяемый журнал действий    | `organization_id`              | actor `user.id`, entity type/id                                         | Есть                                |

### Каноническая модель клиента

- `Organization` — агентство, владелец workspace и данных.
- `Company` — независимая компания-работодатель.
- `AgencyClient` — tenant-owned отношение агентства к `Company`.
- `AgencyClient` содержит как минимум: `id`, `organization_id`, `company_id`, `status`, `account_manager_id`, `primary_contact_name`, `primary_contact_email`, `primary_contact_phone`, `contract_started_at`, `contract_ended_at`, timestamps и soft-delete metadata.
- `Job.employer_company_id` ссылается на `Company.id`; `Job.organization_id` — на агентство.
- Создание клиента никогда не создаёт второй staffing `Organization`.

До появления `AgencyClient` текущий `/companies` нельзя считать безопасным каноническим clients API. Его замена выполняется в Фазе 2.

## 3. Идентификаторы

| Семантика             | Поля                                                                                                                                                                                                                       | Формат                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Entity/user ID        | `id`, `organization_id`, `company_id`, `agency_client_id`, `job_id`, `candidate_id`, `employer_company_id`, `recruiter_id`, `assigned_to`, `team_manager_id`, `recruitment_manager_id`, `created_by_user_id`, `deleted_by` | UUID/opaque backend ID               |
| Контактный адрес      | `email`, `candidate_email`, `contact_email`, `recipient_email`                                                                                                                                                             | Нормализованный email                |
| Display-only snapshot | `full_name`, `candidate_name`, `company`, `job_title`, `display_role_name`                                                                                                                                                 | Строка, не участвует в authorization |

Deprecated поля `agency_company_id`, `company_id` на `User` и email-based `employer_id` допускаются только для чтения во время миграции. Новые записи их не используют.

## 4. Application lifecycle

Канонический enum в порядке pipeline:

`new → reviewed → phone_interview → recommended → employer_interview → offer → hired → probation → completed`

`rejected` — терминальный исход из любого нетерминального этапа. Возврат из `rejected` разрешается только отдельной операцией reopen с audit reason. Терминальные статусы: `completed`, `rejected`.

| Старое значение          | Каноническое значение | Решение                                            |
| ------------------------ | --------------------- | -------------------------------------------------- |
| `screening`              | `reviewed`            | Проверка агентством начата/выполнена               |
| `professional_interview` | `recommended`         | Внутренняя оценка завершена, кандидат рекомендован |
| `client_stage`           | `employer_interview`  | Кандидат перешёл к работодателю                    |
| `interview_scheduled`    | `employer_interview`  | Старый application enum, не тип события            |
| `offer_made`             | `offer`               | Предложение сделано                                |

Mapping предназначен для миграции и совместимого чтения. Все новые `POST/PATCH` принимают только канонические значения.

## 5. Роли и data scope

| Роль                  | Scope             | Правило выборки                                                                                               |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `org_admin`           | Organization-wide | `record.organization_id === user.organization_id`                                                             |
| `recruitment_manager` | Organization-wide | То же tenant-ограничение; без platform/billing прав по умолчанию                                              |
| `team_manager`        | Team-wide         | Tenant + `record.team_manager_id === user.id`; для пользователя команды `user.team_manager_id === manager.id` |
| `recruiter`           | Own               | Tenant + `record.recruiter_id === user.id` или `record.assigned_to === user.id`                               |

В текущей модели команда определяется `team_manager_id`. Отдельный `team_id` нельзя вводить в UI до добавления сущности команды и миграции backend.

### Базовая access matrix

`manage` включает create/update/archive/assign; delete по умолчанию означает soft delete.

| Область                 | Org Admin     | Recruitment Manager     | Team Manager                 | Recruiter             |
| ----------------------- | ------------- | ----------------------- | ---------------------------- | --------------------- |
| Dashboard/reporting     | org           | org                     | team                         | own                   |
| Clients                 | manage org    | view/manage operational | view team-related            | view assigned-related |
| Jobs                    | manage org    | manage org              | manage team                  | view/operate assigned |
| Candidates/applications | manage org    | manage org              | manage team                  | manage own            |
| Import                  | manage org    | manage org              | import to team               | import to own         |
| Compensation            | configure org | manage operational      | view/manage team allocations | view own              |
| Teams/roles             | manage        | view/assign operational | view own team                | none                  |
| Permission Matrix       | manage        | view                    | none                         | none                  |
| Billing/integrations    | manage        | view status             | none                         | none                  |
| Audit log               | org           | org operational         | team                         | own actions           |

Backend authorization является окончательной границей. Route guard и скрытие кнопки обязаны повторять, но не заменять её.

## 6. Общий API envelope

- List success: `{ "data": [...], "pagination": { "cursor": null, "next_cursor": null, "has_more": false } }`.
- Single success: `{ "data": { ... } }`.
- Mutation success: `{ "data": { ... } }`, HTTP `201` для create, `200` для update/action.
- Error: `{ "error": { "code": "...", "message": "...", "details": {}, "request_id": "..." } }`.
- `401` — нет сессии; `403` — роль/scope запрещены; `404` — объект отсутствует внутри доступного scope; `409` — конфликт/дубликат; `422` — validation.
- На переходный период frontend adapter может читать legacy raw array, но новые backend endpoints возвращают envelope.
- List endpoints поддерживают `cursor`, `limit`, `sort`, `order`; tenant ID не является клиентским фильтром.

## 7. API contract checklist

### Clients

- [ ] `GET /agency/clients` — scoped list `AgencyClient + Company summary`.
- [ ] `POST /agency/clients` — создаёт/находит `Company`, затем tenant-owned `AgencyClient`.
- [ ] `GET /agency/clients/:id` — client, contacts, counters.
- [ ] `PATCH /agency/clients/:id` — обновляет отношение и разрешённые company-поля.
- [ ] `POST /agency/clients/:id/archive` — soft archive с conflict policy.
- [ ] Фильтры: `status`, `account_manager_id`, `search`; никакого cross-tenant результата.

### Jobs

- [ ] `GET /jobs` — scope-aware list, фильтры `state`, `employer_company_id`, `recruiter_id`.
- [ ] `POST /jobs` — требует `employer_company_id`; server задаёт `organization_id` и `created_by_user_id`.
- [ ] `GET/PATCH /jobs/:id` — проверяет tenant и role scope.
- [ ] `POST /jobs/:id/assign` — payload `{ recruiter_id }`, оба пользователя из tenant.
- [ ] `POST /jobs/:id/close|reopen` — явная смена lifecycle с audit event.

### Applications

- [x] Канонический enum совпадает со schema и frontend contract.
- [ ] `GET /applications` — scope-aware list с server filters и pagination.
- [ ] `POST /applications` — требует `job_id`, `candidate_id`; server заполняет связанные tenant/client IDs и запрещает дубликат пары.
- [ ] `PATCH /applications/:id/status` — payload `{ status, reason? }`, только канонический enum, проверка допустимого перехода.
- [ ] `POST /applications/:id/assign` — payload `{ recruiter_id }`, ID вместо email.
- [ ] `POST /applications/:id/notes` — сохраняемая заметка с actor ID.

### Imports

- [ ] `POST /candidate-import-batches` — создаёт batch в текущем tenant.
- [ ] `POST /candidate-import-batches/:id/files` — принимает файл/архив и idempotency key.
- [ ] `GET /candidate-import-batches/:id` — status, counters, row errors, cursor.
- [ ] `POST /candidate-import-batches/:id/retry` — повторяет только failed rows.
- [ ] Импорт задаёт ID выбранного recruiter (или `null` для unassigned), manager IDs и source; email не используется как owner.

### Permissions

- [ ] `GET /permission-matrices?org_type=staffing_agency` — effective matrix для текущего tenant.
- [ ] `PATCH /permission-matrices/:id` — только Org Admin, validation resource/action.
- [ ] `GET /permissions/effective` — вычисленные permissions текущего пользователя и scope.
- [ ] После изменения увеличивается permission version/cache key.
- [ ] Любое защищённое действие проверяется backend независимо от UI.

## 8. Fixtures и применение

`src/fixtures/agency/agencyFixtures.js` содержит пользователей четырёх ролей и по одной Application каждого канонического статуса. Fixtures используют ID в ownership-полях и домен `.fixture.test` для email. Production routes этот модуль не импортируют.

Минимальный security test set должен проверить: другой tenant невидим, Team Manager не видит другую команду, Recruiter не видит чужие и unassigned записи без разрешения, Org Admin ограничен своим tenant.
