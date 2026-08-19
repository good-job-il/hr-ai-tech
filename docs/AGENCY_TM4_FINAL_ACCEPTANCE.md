# TM-4: Финальная приёмка Team Manager

Дата реализации: 19 августа 2026

Каноническая граница — TM-1:
[`AGENCY_TM1_TEAM_BOUNDARY.md`](./AGENCY_TM1_TEAM_BOUNDARY.md).
Кабинет — TM-2, аналитика — TM-3.

## Два менеджера одного tenant

Один `organization_id`, две Team. Каждый Team Manager видит только
`users.team_id` своей команды для jobs, candidates, applications, interviews,
import batches, compensation, dashboard, reports и activity.

Query `team_id` другой команды, nested ID чужого Candidate/Application и
import batch другой Team дают 404. `team_manager_id` snapshot не открывает
чужую Team.

## Negative URL / API

- organization `/agency/dashboard`, `/agency/clients`, `/agency/teams` и
  `/agency/settings/*` закрыты ProtectedRoute;
- Permission Matrix list/export/mutation — 403;
- billing overview и integration mutations — 403;
- billing mutation endpoints отсутствуют;
- invite в другую Team недоступен по RolesGuard.

## Import → assign → pipeline → hire

В одной Team:

1. import batch получает canonical `team_id` и не принимает recruiter другой Team;
2. bulk create наследует `team_id` batch; `updateBatch` не может сменить ownership;
3. Application на job той же Team создаётся без дубля пары candidate+job;
4. status `hired` учитывается в team reports как placement;
5. второй Team Manager не видит applications/placements этого цикла.

Assign recruiter другой Team по-прежнему отклоняется TM-1/TM-2 контрактами.
Audit assign для Team Manager пишется на `AgencyTeam`, чтобы событие осталось
в team Activity.

## Aggregates, compensation, exports

- dashboard и reports считают одинаковый team scope;
- `team_performance` / `dimensions.teams` пустые для Team Manager;
- financials возвращаются только при `view_compensation`;
- Permission Matrix export недоступен; reports/activity export остаются
  team-scoped.

## Автоматические проверки

- `npm run test:tm4:frontend`;
- `npm run test:agency`;
- frontend/backend lint, typecheck и backend build.

## Остаточная ручная проверка

Browser smoke двух Team Manager одного tenant (EN/HE, desktop/mobile) на
staging: кабинет `/agency/team/*`, отказ organization URL и визуальный
import → pipeline → hire. Contract-тесты не заменяют visual regression.
