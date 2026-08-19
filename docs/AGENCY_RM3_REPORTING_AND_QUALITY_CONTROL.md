# RM-3: Отчётность и контроль качества

Дата реализации: 19 августа 2026

## Единые KPI

Dashboard и Reports используют одинаковые определения:

- `applications` — Application, созданные в выбранном диапазоне и scope;
- `active_applications` — `new`, `reviewed`, `phone_interview`, `recommended`,
  `employer_interview`, `offer`, `probation`;
- `placements` — `hired` и `completed`; `probation` остаётся активной стадией;
- funnel всегда содержит полный канонический набор стадий;
- client KPI считает placement по тем же статусам `hired` и `completed`.

Диапазон по умолчанию — последние 90 дней. Границы дат включаются целиком в UTC.

## Organizational reports

`GET /management-reports` и manager dashboard поддерживают одинаковые фильтры:

- `date_from`, `date_to`;
- `client_id`;
- `job_id`;
- `team_id`;
- `recruiter_id`.

Reports содержит funnel, time-to-hire, time-in-stage, source effectiveness,
recruiter/team performance, client/job conversion и placements.
Финансовые показатели возвращаются только при effective permission
`view_compensation`.

## Operational Activity

`GET /audit-logs` доступен Org Admin, Recruitment Manager и Platform Admin в
разрешённом tenant scope. UI поддерживает фильтры по дате, actor, action и entity,
а для операционных сущностей формирует deep link.

`GET /audit-logs/export`:

- требует effective permission `export`;
- экспортирует серверную отфильтрованную выборку, а не только текущую UI-страницу;
- создаёт audit event `export` с фильтрами и количеством записей.

Browser API не позволяет Recruitment Manager создавать audit entries от имени
системных операций; actor и tenant всегда вычисляются backend.

## Критерий готовности

Одинаковый набор фильтров на manager dashboard и Reports даёт одинаковые
`applications`, `placements` и funnel totals. Export без permission получает 403,
а успешный export появляется в Activity.
