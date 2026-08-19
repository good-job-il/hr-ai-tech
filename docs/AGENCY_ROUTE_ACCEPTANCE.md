# `/agency/*`: route contract и критерии приёмки

Дата baseline: 2 августа 2026  
Связанный domain contract: `docs/AGENCY_DOMAIN_CONTRACTS.md`

## Условные обозначения

- **Org** — данные текущего `organization_id`.
- **Team** — Org + `team_manager_id=user.id` и назначенные рекрутеры команды.
- **Own** — Org + `recruiter_id/assigned_to=user.id`.
- **Ready** — маршрут реализован и проходит acceptance criteria.
- **Partial** — экран существует, но критерии ещё не выполнены.
- **Placeholder** — бизнес-функция не реализована.

## Org Admin / Recruitment Manager routes

| Route                           | Кто и scope                                                   | Ожидаемое поведение                                                                                                     | Baseline                                    |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `/agency/onboarding`            | Org Admin без agency org                                      | Создать/подключить staffing agency, обновить auth context, перейти в dashboard; существующий company tenant не изменять | Partial                                     |
| `/agency/dashboard`             | Admin/Recruitment Manager: Org; Team Manager: Team            | Реальные KPI jobs, candidates, active applications, placements, clients; loading/empty/error states                     | Partial                                     |
| `/agency/jobs`                  | По роли: Org/Team                                             | Список вакансий с server filters, pagination и разрешёнными CRUD/assign действиями                                      | Partial                                     |
| `/agency/jobs/open`             | По роли: Org/Team                                             | Только открытые вакансии                                                                                                | Partial: route-фильтр не применяется        |
| `/agency/jobs/filled`           | По роли: Org/Team                                             | Только закрытые успешным наймом вакансии                                                                                | Partial: route-фильтр не применяется        |
| `/agency/jobs/hold`             | По роли: Org/Team                                             | Только приостановленные вакансии либо route удалён, если статус не утверждён                                            | Partial: backend state отсутствует          |
| `/agency/crm`                   | По роли: Org/Team                                             | Поиск и фильтрация кандидатов, cursor pagination, create/import/export по permission                                    | Partial                                     |
| `/agency/crm/candidate`         | По роли: Org/Team                                             | Деталь выбранного `candidate_id`, applications, notes, documents, interviews и timeline с persistent mutations          | Partial                                     |
| `/agency/pipeline`              | По роли: Org/Team                                             | Все доступные Applications в канонических колонках; DnD сохраняет допустимый status; пустой API не показывает demo      | Partial; статусы/demo исправлены в Фазе 0   |
| `/agency/ai-matching`           | По роли: Org/Team                                             | Match candidate↔job, объяснение, создание полной недублирующейся Application                                            | Partial                                     |
| `/agency/compensation`          | По роли: Org/Team                                             | Планы и выплаты, связанные с client/job/user IDs; totals из API                                                         | Partial                                     |
| `/agency/import`                | По роли: Org/Team                                             | Создать batch, загрузить файлы, наблюдать progress/errors, retry failed rows, перейти к импортированным кандидатам      | Partial                                     |
| `/agency/clients`               | Admin/Manager: Org; Team Manager: related                     | Единый список `AgencyClient`, create/update/archive без создания Organization                                           | Partial: модель конфликтует                 |
| `/agency/clients/:id`           | В пределах scope                                              | Client details, contacts, связанные jobs/applications/candidates и быстрые действия с preselected client                | Partial                                     |
| `/agency/teams`                 | Org Admin/Recruitment Manager                                 | Команды, пользователи, приглашения, manager/recruiter assignments                                                       | Placeholder                                 |
| `/agency/reports`               | Org или разрешённый scope                                     | Реальные отчёты с периодом, фильтрами и экспортом                                                                       | Partial: RM-3 API/UI готовы; нужен role E2E |
| `/agency/activity`              | Org или разрешённый scope                                     | AuditLog с actor, action, entity, timestamp, filters и pagination                                                       | Partial: RM-3 API/UI готовы; нужен role E2E |
| `/agency/settings/permissions`  | Org Admin edit; Recruitment Manager read                      | Effective staffing-agency matrix, сохранение и cache invalidation                                                       | Partial                                     |
| `/agency/settings/roles`        | Org Admin manage; Recruitment Manager operational read/assign | Роли только текущего org type, безопасные назначения                                                                    | Partial                                     |
| `/agency/settings/billing`      | Org Admin                                                     | Реальные plan/subscription/invoices либо честный unavailable state                                                      | Partial: static mock                        |
| `/agency/settings/integrations` | Org Admin                                                     | Реальные connection states, connect/disconnect и error handling                                                         | Partial: static mock                        |

## Team Manager routes

| Route                        | Scope | Ожидаемое поведение                                       | Baseline                                                      |
| ---------------------------- | ----- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/agency/team/dashboard`     | Team  | Те же KPI, но только команда                              | Partial: переиспользует Org screen без гарантированного scope |
| `/agency/team/jobs`          | Team  | Вакансии и назначения команды                             | Partial                                                       |
| `/agency/team/crm`           | Team  | Кандидаты рекрутеров команды                              | Partial                                                       |
| `/agency/team/crm/candidate` | Team  | Деталь только доступного кандидата; чужой ID даёт 404/403 | Partial                                                       |
| `/agency/team/pipeline`      | Team  | Applications команды, канонические статусы                | Partial                                                       |
| `/agency/team/compensation`  | Team  | Вознаграждения команды по permission                      | Partial                                                       |
| `/agency/team/ai-matching`   | Team  | Matching только доступных jobs/candidates                 | Partial                                                       |
| `/agency/team/import`        | Team  | Импорт назначается в команду                              | Partial                                                       |
| `/agency/team/reports`       | Team  | Командные отчёты                                          | Partial: team-scoped API/UI готовы; нужен cross-team E2E      |

## Recruiter routes

| Route                                   | Scope | Ожидаемое поведение                                                       | Baseline                                                   |
| --------------------------------------- | ----- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/agency/recruiter/dashboard`           | Own   | Персональные tasks, assigned jobs/candidates, overdue stages и placements | Placeholder                                                |
| `/agency/recruiter/candidates`          | Own   | Персональная выборка кандидатов                                           | Partial                                                    |
| `/agency/recruiter/candidates/all`      | Own   | Все доступные рекрутеру кандидаты                                         | Partial: route-фильтр игнорируется                         |
| `/agency/recruiter/candidates/active`   | Own   | Только кандидаты в активной работе                                        | Partial: route-фильтр игнорируется                         |
| `/agency/recruiter/candidates/pipeline` | Own   | Только кандидаты с активной Application                                   | Partial: route-фильтр игнорируется                         |
| `/agency/recruiter/jobs`                | Own   | Назначенные и разрешённые agency jobs, не публичный job board             | Partial: открывает public Jobs                             |
| `/agency/recruiter/crm`                 | Own   | Персональная CRM                                                          | Partial                                                    |
| `/agency/recruiter/crm/candidate`       | Own   | Деталь собственного/назначенного кандидата                                | Partial                                                    |
| `/agency/recruiter/pipeline`            | Own   | Персональный pipeline с каноническими статусами                           | Partial; ownership всё ещё сравнивается по email до Фазы 1 |
| `/agency/recruiter/ai-matching`         | Own   | Matching только назначенных ресурсов                                      | Partial                                                    |

## Общие acceptance criteria для каждого route

1. Неавторизованный пользователь получает login flow; неверная роль — `403/Unauthorized`, а не пустые данные.
2. Direct URL не расширяет роль или scope.
3. Backend response ограничен tenant/scope; frontend-фильтр не является security boundary.
4. Есть раздельные loading, empty, permission denied и recoverable error states.
5. Любая mutation имеет pending/disabled state, success confirmation и видимую ошибку с rollback.
6. Внутренние ссылки сохраняют правильный role prefix (`/agency`, `/agency/team`, `/agency/recruiter`).
7. Hebrew и English локализованы; RTL/LTR не смешиваются.
8. Route filter действительно меняет backend query/result и переживает refresh/deep link.
9. Пустой production response не заменяется fixtures/demo records.
10. Основной happy path и access boundary покрыты integration/E2E тестом.

## Definition of Done route

Маршрут получает статус **Ready** только после выполнения общих критериев, route-specific поведения и проверки минимум четырьмя fixtures: Org Admin, Recruitment Manager, Team Manager, Recruiter. Если функция ещё не подключена к API, пункт меню должен быть скрыт или иметь честный unavailable state; интерактивная заглушка не считается реализацией.
