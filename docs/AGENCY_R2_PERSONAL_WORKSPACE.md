# R-2: Recruiter personal workspace

Дата реализации: 20 августа 2026

## Персональный namespace

Ежедневный workflow Recruiter замкнут в `/agency/recruiter/*`. После входа роль
попадает на `/agency/recruiter/dashboard`; навигация, карточки и deep links не
выводят пользователя в public, Company или manager workspace.

| Задача                     | Route                                             |
| -------------------------- | ------------------------------------------------- |
| Личные KPI и задачи        | `/agency/recruiter/dashboard`                     |
| Все назначенные кандидаты  | `/agency/recruiter/candidates/all`                |
| Активные кандидаты         | `/agency/recruiter/candidates/active`             |
| Кандидаты в pipeline       | `/agency/recruiter/candidates/pipeline`           |
| Назначенные/доступные jobs | `/agency/recruiter/jobs`                          |
| Application pipeline       | `/agency/recruiter/pipeline`                      |
| Интервью                   | `/agency/recruiter/interviews`                    |
| Карточка кандидата         | `/agency/recruiter/crm/candidate?id=:candidateId` |

## Dashboard

Dashboard получает Candidate, Application, Job и Interview через защищённые R-1
endpoints. Клиент не подставляет `recruiter_id` и не имеет fallback на tenant-wide
данные. На их основе отображаются:

- количество личных кандидатов, активных jobs и Applications;
- ближайшие интервью;
- новые Applications, требующие просмотра;
- stages, превысившие SLA;
- последние назначенные jobs и кандидаты.

## Jobs, filters и deep links

Public Jobs заменён на agency `ManageJobsPage`. Backend ограничивает выдачу
назначенными Recruiter jobs; прямой `?jobId=:jobId` открывает выбранную запись и
сохраняет выбор после refresh. Запись без права update показывается read-only.

Candidate routes преобразуются в стабильные server parameters:

| Route mode | Server filter                         |
| ---------- | ------------------------------------- |
| `all`      | own scope без дополнительного фильтра |
| `active`   | `active=true`                         |
| `pipeline` | `in_pipeline=true`                    |

Role-aware links используют query IDs: Candidate — `?id=`, Application —
`?applicationId=`, Job — `?jobId=`. Pipeline transitions в UI повторяют
backend allowlist R-1; backend остаётся источником авторизации.

## Persistence и permissions

Notes, documents, messages, interviews и timeline работают через NestJS API, а
не локальный state как источник истины. После mutation локальный cache
обновляется или инвалидируется. Интервью Recruiter всегда создаётся с числовым
`application_id`; backend выводит Candidate, Job и ownership из проверенной
Application.

UI учитывает effective Permission Matrix:

- `create` управляет созданием интервью;
- `update` управляет status transition, notes, messages и feedback;
- document upload использует `update`, а просмотр CV — отдельный `download_cv` из R-1;
- recruiter assignment скрыт от Recruiter и остаётся manager operation.

## Acceptance

- все рабочие ссылки Recruiter начинаются с `/agency/recruiter/`;
- `all`, `active` и `pipeline` всегда отправляют одинаковые server filters после refresh;
- deep link восстанавливает выбранный Candidate, Application или Job из URL;
- interview create содержит `application_id`, а повторное чтение получает сохранённую запись;
- notes, documents, messages, interview changes и timeline переживают refresh;
- запрещённый pipeline jump недоступен в UI и повторно отклоняется backend;
- чужие данные не появляются при изменении query parameters благодаря R-1 own boundary.
