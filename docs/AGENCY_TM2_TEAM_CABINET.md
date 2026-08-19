# TM-2: Командный кабинет Team Manager

Дата реализации: 19 августа 2026

Каноническая граница доступа остаётся TM-1:
[`AGENCY_TM1_TEAM_BOUNDARY.md`](./AGENCY_TM1_TEAM_BOUNDARY.md).
Эта фаза завершает кабинет внутри `/agency/team/*`.

## Workspace

`src/domain/agency/workspace.js` вычисляет кабинет по pathname, а роль
используется только как fallback внутри `/agency`. Deep link, refresh и
внутренние ссылки остаются в том же namespace:

- Team Manager → `/agency/team/*`
- Recruiter → `/agency/recruiter/*`
- Org Admin / Recruitment Manager → `/agency/*`

Company и employer маршруты не переводятся в agency cabinet.

## Кабинет

- Team dashboard: workload, SLA, funnel, interviews, placements и
  assign/reassign только между recruiter своей Team;
- read-only roster своей Team с workload;
- jobs (`open` / `filled` / `hold`), CRM, pipeline, AI Matching, import,
  compensation и reports открываются только под `/agency/team/*`;
- breadcrumbs и CRM/pipeline links используют workspace paths, а не
  `navigate(-1)` и не organization-wide URL.
- Logo, `/agency/team` и login/home ведут в `/agency/team/dashboard`.
- Командная аналитика и Activity — TM-3:
  [`AGENCY_TM3_TEAM_ANALYTICS.md`](./AGENCY_TM3_TEAM_ANALYTICS.md).

## Assign

Форма Team Manager фиксирует `team_id` управляемой Team. Recruiter dropdown
запрашивает только `role=recruiter`; backend уже ограничивает список
`user.team_id`. Compensation скрывает assignee и поля Recruitment Manager.

## Login / home

Team Manager после login, register, Navbar и Home попадает на
`/agency/team/dashboard`, а не на legacy `/recruitment/jobs` или
organization `/agency/dashboard`.

## Acceptance

- все действия кабинета живут под `/agency/team/*`;
- refresh и deep link (`/crm/candidate?id=`, `/pipeline?applicationId=`,
  import → CRM) сохраняют team workspace;
- assign не может выбрать другую Team или recruiter другой Team;
- organization `/agency/*` по-прежнему закрыт ProtectedRoute.
