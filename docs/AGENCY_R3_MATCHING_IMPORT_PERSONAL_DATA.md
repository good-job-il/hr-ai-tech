# R-3: Matching, import и личные данные Recruiter

Дата реализации: 20 августа 2026

## AI Matching → Application

Обе ветки AI Matching — Candidate → Job и Job → Candidate — используют один
endpoint `POST /api/applications/assign-candidate`. Backend сначала проверяет
own scope Candidate и Job, затем создаёт полную Application со следующими
server-derived полями:

- `organization_id` и `employer_company_id` из Job;
- `recruiter_id` и `assigned_to` из текущего Recruiter;
- `team_id`, `team_manager_id` и `recruitment_manager_id` из membership и Job;
- Candidate snapshot из проверенного Candidate;
- Job title/company из проверенного Job;
- начальный status `new` и source `pool_assignment`.

После создания UI вызывает server-side scoring и открывает role-aware deep link
`/agency/recruiter/pipeline?applicationId=:id`. Поэтому запись сразу видна в
личном pipeline и CRM.

## Duplicate prevention и idempotency

Database migration `1752700000000-OrgAdminCoreOperations` фиксирует уникальность
`organization_id + job_id + candidate_id`. Entity содержит тот же unique index.

Matching assignment является идемпотентным:

- повторный последовательный запрос возвращает существующую active Application;
- конкурентная вставка защищена database constraint;
- после duplicate-key race backend повторно читает существующую запись;
- обычный ручной create сохраняет `409 Conflict`, чтобы не скрывать ошибку формы.

## Recruiter import policy

Прямой import-to-own для Recruiter **исключён из продуктовой политики R-3**.
Recruiter отсутствует во всех import write allowlists и не имеет route или nav
entry `/agency/recruiter/import`. Массовый import выполняют Org Admin,
Recruitment Manager или Team Manager; затем Candidate назначается Recruiter.
Отдельная разрешённая операция Recruiter для общего пула — атомарный claim из
R-1.

Это решение не создаёт параллельный ownership-контракт и не позволяет обходить
validation, deduplication и manager-controlled assignment через import.

## Read-only own compensation

Route `/agency/recruiter/compensation` доступен только с effective permission
`view_compensation`. Backend всегда добавляет `organization_id` и
`recruiter_id = currentUser.id`; browser query не может заменить Recruiter.

Recruiter получает только:

- Job ID и client display name;
- собственную ставку и её тип;
- рассчитанную собственную сумму;
- timestamps.

Из ответа удалены total fee, notes, manager/recruitment-manager rates, tenant и
чужие assignee IDs. Detail чужого плана возвращает 404. Create, update и delete
для Recruiter запрещены service layer независимо от permission override.

## Personal performance и activity

Route `/agency/recruiter/activity` показывает персональные Applications,
завершённые interviews, hires, conversion и последние Audit events. Candidate,
Application и Interview endpoints применяют R-1 own scope.

`GET /api/audit-logs` разрешён Recruiter только для чтения и принудительно
фиксирует `actor_user_id = currentUser.id`. Чужой actor и organization-wide
entity types возвращают пустую выборку. Export остаётся manager-only.

## Acceptance

- повторный Matching для одной пары Candidate + Job возвращает один Application ID;
- tenant, client, Job и assignment нельзя подменить из browser payload;
- созданная Application получает score и открывается по recruiter pipeline deep link;
- Recruiter не присутствует в import write roles и recruiter import route отсутствует;
- compensation list/detail не раскрывает чужие планы или общие финансовые условия;
- Recruiter не может изменить собственный compensation plan;
- performance использует только own RLS data, activity — только собственный actor ID;
- refresh повторно получает Applications, compensation и activity из backend.
