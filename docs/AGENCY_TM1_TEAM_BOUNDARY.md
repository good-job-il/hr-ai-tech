# TM-1: Team boundary

Дата реализации: 19 августа 2026

## Каноническая связь

`users.team_id` является источником membership. Team-scoped сущности теперь
содержат `team_id`:

- Job;
- Candidate;
- Application;
- Interview;
- CandidateImportBatch;
- CompensationPlan.

`team_manager_id` сохранён как совместимый operational snapshot, но не
используется как граница доступа. Миграция
`1753000000000-TeamMembershipBoundary.ts` добавляет индексы и backfill через
Recruiter membership или `agency_teams.manager_id`.

## Backend scope

Для Team Manager RLS всегда вычисляет:

`organization_id = user.organization_id AND team_id = user.team_id`.

Query/body `organization_id`, `team_id` и `team_manager_id` не могут расширить
scope. Пользователь Team Manager без активного `team_id` получает blocked scope.

Nested resources (notes, tags, documents, timeline, messages and communication
logs) сначала проверяют доступ к parent Candidate/Application. Interview и import
batch имеют собственный canonical `team_id`.

## Assignments

Team Manager может назначить Recruiter только если:

- Recruiter активен;
- Recruiter находится в том же tenant;
- `recruiter.team_id === manager.team_id`.

Связанные assignees должны принадлежать одной Team. Создаваемые Job, Candidate,
Application, Interview, imports и compensation получают `team_id` на backend.

## Action policy

Формальная матрица действий: [`AGENCY_TM1_ACTION_POLICY.md`](./AGENCY_TM1_ACTION_POLICY.md).

Create/update/delete для core и nested resources защищены effective permissions.
Reports export требует `export`; compensation read/write требует
`view_compensation` / `edit_compensation`.

## Acceptance

- list/detail чужой Team возвращает пустой список или 404;
- nested ID не обходит parent scope;
- foreign Recruiter/Team/tenant assignment отклоняется;
- Team overview возвращает только managed Team и её members;
- import и compensation не возвращают organization-wide данные.
