# RM-2: Recruitment management

Дата реализации: 18 августа 2026

## Manager dashboard

`GET /recruitment-management/dashboard` возвращает organization-scoped данные:

- funnel по всем каноническим Application status;
- SLA overdue по `updated_date` и лимитам стадии;
- workload активных Recruiter;
- placements (`hired` и `completed`);
- количество открытых jobs и активных Application.

Порог перегрузки: 20 активных Application или 5 открытых jobs на Recruiter.
SLA: new — 24ч, reviewed — 48ч, phone interview — 72ч,
recommended — 96ч, employer interview — 120ч, offer — 72ч.

## Assign / reassign

`POST /recruitment-management/assign` принимает массивы `job_ids`,
`candidate_ids`, `application_ids`, целевые `team_id` / `recruiter_id` и
обязательный `reason`.

Все записи, Application timeline и AuditLog сохраняются одной транзакцией.
Перед записью проверяются tenant, активность Team/Recruiter, роль Recruiter и
membership выбранной команды. При любой ошибке операция целиком откатывается.

## Notifications

Каждый час формируются дедуплицированные unread notifications типа `message`:

- `sla_overdue` — есть просроченные стадии;
- `workload_overload` — Recruiter превысил workload threshold.

После назначения Recruiter получает notification с количеством назначенных
jobs, candidates и Application и указанной причиной.

## UI

Recruitment Manager получает отдельный `/agency/dashboard` с KPI, funnel,
workload, overdue stages, placements и формой bulk assign/reassign. Org Admin и
Team Manager продолжают использовать свои dashboard варианты.
