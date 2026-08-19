# TM-3: Командная аналитика Team Manager

Дата реализации: 19 августа 2026

Каноническая граница доступа остаётся TM-1:
[`AGENCY_TM1_TEAM_BOUNDARY.md`](./AGENCY_TM1_TEAM_BOUNDARY.md).
Кабинет `/agency/team/*` — TM-2:
[`AGENCY_TM2_TEAM_CABINET.md`](./AGENCY_TM2_TEAM_CABINET.md).

## Team Reports

`GET /management-reports` для Team Manager всегда режет данные по
`users.team_id`. Query `team_id` другой команды даёт 404 и не расширяет
scope.

Отчёт содержит:

- funnel, time-in-stage, source effectiveness;
- recruiter performance и recruiter workload (те же пороги, что dashboard);
- client/job conversion и placements;
- финансовые поля только при effective permission `view_compensation`.

`team_performance` и `dimensions.teams` для Team Manager пустые, чтобы
organization-wide таблица команд не утекала в кабинет. UI `/agency/team/reports`
скрывает team filter и team performance, показывает workload и командные
формулировки.

CSV export требует `export`, пишет audit event на `AgencyTeam` (не
`Organization`) и не включает строки других команд.

## Team Activity

`GET /audit-logs` и `GET /audit-logs/export` доступны Team Manager.

Фильтр:

- `organization_id` текущего tenant;
- `actor_user_id` только среди members `team_id`;
- entity types `Organization`, `PermissionMatrix`, `RoleTemplate`,
  `Billing`, `Integration` скрыты.

UI `/agency/team/activity` использует workspace deep links
(`/agency/team/crm/candidate`, pipeline, jobs, roster). Export журналируется
как `AgencyTeam` / `Team activity export`.

## Permission Matrix export

Team Manager не получает list/export Permission Matrix (403). Org Admin,
Recruitment Manager и Platform Admin могут вызвать
`GET /permission-matrices/export` при effective permission `export`;
успешный export создаёт audit event `PermissionMatrix` / `export`.

## Acceptance

- Team Manager видит метрики только своей Team;
- Activity не показывает события другой Team и organization-wide security
  entities;
- Permission Matrix export недоступен Team Manager и журналируется для
  ролей, которым он разрешён.

Финальная приёмка двух команд и import → hire — TM-4:
[`AGENCY_TM4_FINAL_ACCEPTANCE.md`](./AGENCY_TM4_FINAL_ACCEPTANCE.md).
