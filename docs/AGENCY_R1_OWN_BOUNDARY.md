# R-1: Recruiter own boundary

Дата реализации: 20 августа 2026

## Канонический scope

Для Recruiter backend всегда выводит ownership из аутентифицированного
пользователя:

`organization_id = user.organization_id AND recruiter_id = user.id`.

Для Application дополнительно разрешена явная персональная assignment:

`recruiter_id = user.id OR assigned_to = user.id`.

Job, Candidate и Interview используют собственный `recruiter_id`. Note, Tag,
Document, Candidate Timeline и Communication Log проверяются через parent
Candidate; Message и Application Timeline — через parent Application. Поэтому
подстановка nested ID не расширяет scope.

## Unassigned candidate pool и claim

Общий пул не входит в обычный Recruiter list/detail scope. Отдельный read endpoint
`GET /api/candidates/unassigned-pool` возвращает только записи текущего tenant со
следующими признаками:

- `source = pool`;
- `recruiter_id IS NULL`;
- `is_deleted = false`.

Забрать кандидата можно только через `POST /api/candidates/:id/claim` с
непустым `reason` и permission `update`. Claim выполняется транзакционно через
conditional update. Одновременно записываются Candidate Timeline и Audit Log.
Повторный или конкурентный claim возвращает 404 и не раскрывает текущего owner.

## Server-derived ownership

Recruiter не может изменить через body:

- `recruiter_id` и `assigned_to`;
- `team_manager_id` и `recruitment_manager_id`;
- связь Application с другим Job, Candidate или employer company;
- связь Interview с другим Application, Candidate или Job.

`organization_id` и `team_id` не принимаются operational DTO и выводятся из
tenant/team membership. При создании Candidate, Job, Application и Interview
backend записывает recruiter/team hierarchy из `CurrentUser` или проверенного
parent.

## Pipeline transitions

Recruiter может двигать только собственную/назначенную Application вперёд или в
`rejected`:

| From                 | To                                           |
| -------------------- | -------------------------------------------- |
| `new`                | `reviewed`, `rejected`                       |
| `reviewed`           | `phone_interview`, `recommended`, `rejected` |
| `phone_interview`    | `recommended`, `rejected`                    |
| `recommended`        | `employer_interview`, `rejected`             |
| `employer_interview` | `offer`, `rejected`                          |
| `offer`              | `hired`, `rejected`                          |
| `hired`              | `probation`                                  |
| `probation`          | `completed`, `rejected`                      |

Recruiter не может создавать Application сразу в промежуточном статусе и не
может reopen rejected Application. Reopen остаётся manager action.

## Permission Matrix

| Action      | Enforcement                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| create      | Guard на Candidate, Job, Application и Interview                                   |
| update      | Guard на core, nested, messages, communication, matching score и claim             |
| delete      | Guard на Candidate, Job, Application, Interview, Note и Tag                        |
| export      | Recruiter не входит в management/audit export roles                                |
| download CV | `GET /api/candidates/:id/cv` требует `download_cv`; CV URLs редактируются без него |
| import      | Recruiter не входит в import roles; решение import-to-own перенесено в R-3         |

CV access дополнительно пишет `cv_download` в Audit Log. UI не считается
границей авторизации: прямой API проходит те же scope и permission checks.

## Acceptance

- другой Recruiter того же tenant получает пустой list/404 для чужих записей;
- nested ресурсы не обходят parent scope;
- assignment spoofing отклоняется до persistence;
- только pool candidate допускает атомарный claim;
- запрещённые status jumps и Recruiter reopen отклоняются;
- create/update/delete/download CV зависят от effective Permission Matrix,
  export/import не расширяются одним permission override.
