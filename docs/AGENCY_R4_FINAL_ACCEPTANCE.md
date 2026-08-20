# R-4: Финальная приёмка Recruiter

Дата реализации: 20 августа 2026

Связанные контракты: [R-1 own boundary](./AGENCY_R1_OWN_BOUNDARY.md),
[R-2 personal workspace](./AGENCY_R2_PERSONAL_WORKSPACE.md) и
[R-3 matching/import/personal data](./AGENCY_R3_MATCHING_IMPORT_PERSONAL_DATA.md).

## Сквозной рабочий цикл

Acceptance fixture проходит канонический recruiter flow:

1. назначенный job доступен в личном workspace;
2. собственный Candidate открывается из job/deep link;
3. создаётся одна Application с server-derived tenant, Team и Recruiter ownership;
4. для Application создаётся interview;
5. статус меняется `new → reviewed`;
6. создание Application, interview и смена статуса остаются в timeline.

Повторное создание пары candidate + job покрыто idempotency-контрактом R-3.

## Негативная авторизация

Service-level acceptance проверяет отказ для:

- Candidate/Application другого Recruiter;
- записи другой Team того же tenant;
- записи другого tenant;
- попытки подменить `recruiter_id`, `team_id` или tenant ownership во входном DTO.

Граница применяется до чтения и mutation: чужая запись не раскрывается и не
может быть присвоена себе обходным запросом.

## Routes, filters и UI states

- `all`, `active` и `pipeline` передаются как server filter и не расширяют own scope;
- recruiter deep links разрешены только внутри `/agency/recruiter/*`;
- organization, team и public fallback routes для Recruiter блокируются;
- loading, permission denied, recoverable error, empty и ready представлены как
  разные состояния;
- compensation и activity показывают load error и retry, не маскируя ошибку под empty;
- `he`/`he-*` дают RTL, `en`/`en-*` — LTR;
- ширина менее 768 px использует mobile layout contract.

## Runtime smoke

В ходе браузерной приёмки найден и устранён bootstrap blocker: `main.jsx` не
импортировал `App`, а route graph `App.jsx`, `AgencyRecruiterLayout` и
`RoleFallback` зависели от неимпортированных компонентов. Bootstrap также получил
явный error fallback вместо пустого белого экрана при невозможности загрузить
route graph.

Локальная среда без recruiter JWT и backend fixture позволяет проверить build и
защищённый вход, но не заменяет authenticated visual smoke полного рабочего цикла.

## Автоматические проверки

- `npm run test:r4:frontend`;
- backend acceptance: `r4-final-acceptance.spec.ts`;
- полный frontend/backend test regression;
- frontend/backend build и API typecheck;
- `git diff --check`.

## Остаточная staging-проверка

Перед production выполнить authenticated browser smoke для EN/HE на desktop и
mobile: dashboard → job → candidate → Application → interview → status. Отдельно
проверить отказ URL/API с аккаунтами второго Recruiter, второй Team и другого
tenant, а также focus/overflow после refresh и открытия deep link.
