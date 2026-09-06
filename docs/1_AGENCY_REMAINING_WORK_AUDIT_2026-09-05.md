# Agency: что осталось сделать

Дата проверки: 5 сентября 2026. Проверенная ревизия: `e40d074`.

Основание: [audit roadmap](./1_AGENCY_AUDIT_ROADMAP.md), [pre-release](./1_AGENCY_PRE_RELEASE.md), [ролевой план](./1_AGENCY_ROLES_CAPABILITIES_AND_IMPLEMENTATION_PLAN.md), текущий код, CI и локальные проверки.

## Вывод

Основные backend workflow и кабинеты уже реализованы в значительной части. Переписывать все задачи из старых разделов «не реализовано» в новый backlog не нужно. Но готовность к production пока не подтверждена: остаются конкретные дефекты permissions, KPI и локализации, отсутствуют полноценные HTTP/browser E2E, актуальная миграционная и визуальная приёмка.

Это проверка репозитория, а не авторизованная приёмка работающего продукта. Браузерные сценарии, целевая БД, production integrations и состояние внешней инфраструктуры в рамках этой проверки не запускались. «Не подтверждено» ниже не означает, что функция обязательно сломана.

## 1. Что уже исправлено относительно исходных документов

| Старое замечание                                                                       | Что есть сейчас                                                                                                    | Что ещё требуется                                                                                  |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Отсутствуют импорты в RM dashboard, Team roster, Reports, Audit, Billing, Integrations | Указанные в PRE_RELEASE импорты присутствуют; frontend lint, typecheck и build проходят                            | Авторизованный smoke, а не повторное исправление старых импортов                                   |
| Frontend lint: 442 ошибки; backend lint: 116 ошибок                                    | Оба lint проходят                                                                                                  | Сохранять проверки в CI                                                                            |
| Recruiter dashboard — заглушка, jobs — публичная страница                              | В `src/App.jsx` подключён RecruiterDashboard и отдельный recruiter workspace                                       | Проверить полный цикл в браузере                                                                   |
| Нет отдельного RM dashboard, team roster, Reports и Activity                           | Есть ролевые страницы, services и acceptance contract tests                                                        | Проверить маршруты, данные и действия через HTTP и UI                                              |
| Billing — статический mock                                                             | `billing.service.ts` читает account/invoices и считает usage; при отсутствии настройки возвращает `not_configured` | Подтвердить режим релиза и реальные данные целевого окружения                                      |
| Нет personal compensation/activity; recruiter import нужно добавить                    | Personal routes входят в `recruiterWorkspace.js`; импорт Recruiter явно исключён текущей политикой                 | Обновить старую матрицу и проверить запрет; не добавлять импорт без изменения продуктовой политики |
| 109 backend tests и 17 migrations                                                      | Сейчас 110 backend tests и 18 файлов миграций                                                                      | Обновить устаревшие отчёты                                                                         |

Канонические статусы, AgencyClient, ownership/scopes, matching/import idempotency и persistence уже имеют реализацию и service/contract-покрытие. Это основание для интеграционной приёмки, но не доказательство выполнения всех acceptance criteria roadmap.

## 2. Подтверждённые задачи в коде

### P0 — унифицировать применение Permission Matrix к чтению

- [ ] Проверить каждый agency endpoint и явно зафиксировать требуемые permissions для list/detail/nested/export и mutations.
- [ ] Добавить enforcement `view` для защищённых agency-чтений jobs/candidates/applications, где его сейчас нет; отдельно сохранить намеренно публичное поведение job endpoints.
- [ ] Проверить немедленный отзыв прав после изменения матрицы: API, открытая страница, повторный запрос, прямой URL и скачивание.

Доказательства: [AgencyActionPolicyGuard](../backend/src/modules/permissions/agency-action-policy.guard.ts) возвращает `true`, если metadata required permissions отсутствует. В [applications.controller.ts](../backend/src/modules/applications/applications.controller.ts) list/detail/timeline не имеют `@RequiresPermission("view")`; аналогичные пропуски есть в [candidates.controller.ts](../backend/src/modules/candidates/candidates.controller.ts). В [jobs.controller.ts](../backend/src/modules/jobs/jobs.controller.ts) guard назначен отдельным mutations, но не основным GET.

Это пробел action authorization, а не установленная cross-tenant утечка: RLS — отдельный слой. Критерий закрытия: при снятом `view` защищённые agency-запросы отвергаются через настоящий HTTP; с разрешённым `view` возвращают только допустимый scope.

Связь с планами: roadmap фаза 1; роли OA-1 и общая фаза 1; PRE_RELEASE фаза 1.

### P1 — исправить KPI dashboard Org Admin

- [ ] Перенести итоговые счётчики на backend aggregation/count API с едиными определениями KPI.
- [ ] Считать открытые вакансии по каноническому `state === "open"`, отдельно от `on_hold`, `filled` и `closed`.
- [ ] Сопоставить totals dashboard, reports, clients и pipeline на одинаковых фильтрах и больших объёмах данных.

Доказательство: [AgencyDashboard.jsx](../src/pages/agency/AgencyDashboard.jsx) загружает 50 jobs, 100 candidates, 100 applications, 50 plans и 100 clients, затем считает KPI через `.length`. Open jobs определяются как `!j.is_closed`. [JobsService](../backend/src/modules/jobs/jobs.service.ts) ставит `is_closed = false` и для `on_hold`, поэтому такие вакансии попадают в число открытых. [App.jsx](../src/App.jsx) использует этот dashboard для Org Admin; отдельный RM dashboard не исправляет этот экран.

Критерий закрытия: counts не ограничиваются размером страницы; on-hold vacancy не увеличивает open jobs; parity проверена на наборе больше текущих лимитов.

Связь с планами: roadmap фазы 5 и 7, общий DoD; роли OA-2 и единые KPI.

### P1 — закончить EN/HE и направление интерфейса

- [ ] Заменить фиксированный `dir="rtl"` на направление активного языка.
- [ ] Вынести оставшиеся пользовательские строки в EN/HE translations.
- [ ] Проверить направления и тексты в loading/error/empty состояниях, карточках и модалках.

Подтверждённый пример: [AgencyClientDetail.jsx](../src/pages/agency/AgencyClientDetail.jsx) содержит фиксированный RTL в основном экране, состояниях загрузки/ошибки и диалогах; сообщения ошибки и кнопки записаны на иврите прямо в JSX. Это действительный остаток реализации, а не только отсутствие визуальных тестов.

Критерий закрытия: карточка клиента и её действия работают на English в LTR и Hebrew в RTL, без строк другого языка. Затем такой же walkthrough остальных agency-маршрутов.

Связь с планами: roadmap фаза 7; роли общая фаза 6; PRE_RELEASE фаза 6.

## 3. Обязательная приёмка перед production

### P1 — HTTP integration и browser E2E для четырёх ролей

- [ ] Создать API-набор с поднятым NestJS, JWT и изолированной MySQL, проверяющий реальные guards, DTO, serializers, database constraints и nested endpoints.
- [ ] Добавить browser E2E и подключить его к CI.
- [ ] Проверить Org Admin: onboarding → client → job → candidate → Application → interview → hire; команды, приглашения, роли и отзыв permissions.
- [ ] Проверить RM: назначения и bulk reassign, dashboard/reports parity, запрет административных mutations и read-only settings.
- [ ] Проверить TM: import → assign → pipeline → hire; второй Team Manager того же tenant не читает и не изменяет результаты первой команды.
- [ ] Проверить Recruiter: assigned job → own candidate → matching/Application → interview → transition; all/active/pipeline, claim policy, own compensation/activity и запрет import.
- [ ] Для каждой роли проверить foreign tenant/team/recruiter, ownership spoofing, прямой URL и nested notes/documents/messages/interviews/timeline.
- [ ] Проверить одновременное создание одной candidate/job пары и повтор import batch/row после сбоя — на реальной БД.
- [ ] Проверить сохранность после reload, ошибки и rollback optimistic mutations, confirmations, cache invalidation, error report импорта и скачивание CV.

Основание: Playwright/Cypress-конфигурация и browser E2E в репозитории не найдены; в backend `*.spec.ts` не найдены `supertest`/`createNestApplication`. Например, [tm4-final-acceptance.spec.ts](../backend/src/modules/permissions/tm4-final-acceptance.spec.ts) использует `memoryRepo` и вызовы сервисов. Существующие acceptance tests полезны, но не проходят HTTP/browser stack.

Критерий закрытия: воспроизводимый зелёный API/browser suite в CI с артефактами сбоев и проверенными четырьмя ролями. Связь: roadmap фаза 8; OA-4/RM-4/TM-4/R-4; PRE_RELEASE фазы 2–4 и 7.

### P1 — актуальные migration rehearsal и восстановление

- [ ] Выполнить fresh migration/seed для всех текущих 18 миграций.
- [ ] Выполнить upgrade с репрезентативными прежними данными и проверить ownership, client links, statuses, memberships и uniqueness.
- [ ] Провести backup/restore drill; описать порядок rollback приложения и схемы, включая необратимые преобразования данных.
- [ ] Сохранить дату, ревизию, версии окружения и результаты проверки.

В [application-ci.yml](../.github/workflows/application-ci.yml) уже есть fresh MySQL migration/seed step. Его наличие не подтверждает успешный текущий прогон и не заменяет upgrade/restore. [PHASE_8_FINAL_QA_RELEASE.md](./PHASE_8_FINAL_QA_RELEASE.md) описывает 13 миграций; это устаревшая база для принятия нынешних 18.

Связь: roadmap фаза 8; роли общая фаза 7; PRE_RELEASE фаза 7.

### P1 — authenticated visual/accessibility acceptance

- [ ] Пройти route matrix четырьмя ролями: EN/HE × desktop/mobile.
- [ ] Проверить keyboard navigation, focus trap/return, Escape, aria labels, контраст и axe либо аналог.
- [ ] Проверить таблицы, модалки, overflow, deep links, refresh и loading/empty/error/403.
- [ ] Сохранить screenshots/результаты и закрыть найденные дефекты.

[RM-4](./AGENCY_RM4_FINAL_ACCEPTANCE.md), [TM-4](./AGENCY_TM4_FINAL_ACCEPTANCE.md) и [R-4](./AGENCY_R4_FINAL_ACCEPTANCE.md) сами оставляют staging browser smoke незавершённым. Тесты direction/breakpoint helpers не проверяют реальный DOM и доступность.

### P2 — нагрузка и наблюдаемость

- [ ] Измерить list/search/aggregation/export на реальной БД и согласованных объёмах; проверить пагинацию и индексы.
- [ ] Проверить мониторинг API errors, failed imports и failed transitions в целевой среде; зафиксировать, где видны сбои и кто их получает.

Performance test на 10 000 Application уже есть, но [recruitment-management.performance.spec.ts](../backend/src/modules/recruitment-management/recruitment-management.performance.spec.ts) подменяет repositories массивами: он не измеряет SQL, HTTP или browser performance. Состояние production monitoring репозиторной проверкой не подтверждено.

## 4. Billing и Integrations: определить поддерживаемый объём

- [ ] Зафиксировать выпуск с честными read-only/unavailable состояниями либо реализацию полного платёжного/OAuth workflow.
- [ ] Если выпускается ограниченный режим: проверить реальные account/invoice/usage данные, отсутствие активных недоступных controls и RM read-only ограничения.
- [ ] Если обещаны полные flows: реализовать и принять upgrade/downgrade/cancel/payment method, provider synchronization; для integrations — полный authorization callback/token lifecycle, last sync, reconnect и фактический отзыв доступа при disconnect.

[BillingService](../backend/src/modules/billing/billing.service.ts) явно возвращает `plan_changes: false`, `payment_method_management: false`. [IntegrationConnectionsService](../backend/src/modules/integrations/integration-connections.service.ts) имеет feature flags, configured connect URL и локальные состояния; это само по себе не доказывает полный внешний OAuth цикл.

Roadmap фаза 6 разрешает read-only/unavailable выпуск. Поэтому полный billing не является безусловным блокером такого релиза; это остаток расширенного объёма роли Org Admin, который нужно явно согласовать в документах.

## 5. Обновить документацию и CI

- [ ] В ROADMAP отделить исторический аудит от текущей route matrix; актуализировать фазы 3–8 по реализации и по приёмке раздельно.
- [ ] В PRE_RELEASE убрать исправленные runtime imports и устаревшие lint/test/migration цифры; добавить актуальные KPI и i18n дефекты.
- [ ] В ролевом плане исправить `team_manager_id` как критерий доступа на canonical `team_id` + membership; отметить готовые RM/TM/R страницы и текущую политику recruiter import.
- [ ] Уточнить типы идентификаторов: старое требование «исключительно UUID» расходится с миграцией `1752000000000-MigrateUuidToIntPk.ts` и текущими числовыми IDs.
- [ ] Зафиксировать OA-1…OA-4 acceptance evidence: отсутствие отдельного OA-документа не доказывает отсутствие реализации, но текущий ролевой план не даёт актуальной приёмки.
- [ ] Добавить frontend agency contract tests в `release:verify` и CI: сейчас backend tests запускаются, а `src/domain/agency/*.test.mjs` не включены в эти gates.
- [ ] Добавить API/browser/visual gates после их реализации и актуализировать release checklist.

## 6. Проверки, выполненные в этом аудите

| Проверка                                                        | Результат                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                  | PASS                                                                                                                                                                                                                                                          |
| `npm run typecheck`                                             | PASS                                                                                                                                                                                                                                                          |
| `npm run build`                                                 | PASS                                                                                                                                                                                                                                                          |
| `npm --prefix backend run lint`                                 | PASS                                                                                                                                                                                                                                                          |
| `npm --prefix backend test -- --runInBand`                      | PASS: 28 suites, 110 tests                                                                                                                                                                                                                                    |
| `npm --prefix backend run build`                                | PASS                                                                                                                                                                                                                                                          |
| `node --test src/domain/agency/*.test.mjs`                      | PASS: 21 tests                                                                                                                                                                                                                                                |
| `npm run audit:production`                                      | Не подтверждён: первичный запуск завершился с DNS `ENOTFOUND registry.npmjs.org`; повтор с сетевым доступом не был запущен из-за тайм-аута автоматической проверки разрешения. Это не результат проверки уязвимостей; повторить в среде с доступом к registry |
| Полный `release:verify`                                         | Единым запуском не выполнялся; его локальные lint/type/build/test составляющие проверены отдельно                                                                                                                                                             |
| Authenticated browser / HTTP integration / migrations / restore | В этом аудите не запускались                                                                                                                                                                                                                                  |

## 7. Рекомендуемый порядок оставшейся работы

1. Закрыть `view` authorization и покрыть его HTTP negative tests.
2. Исправить Org Admin KPI и локализацию client detail.
3. Ввести API/browser E2E четырёх ролей и frontend contracts в CI.
4. Пройти EN/HE desktop/mobile/accessibility acceptance и устранить найденное.
5. Выполнить 18-migration fresh/upgrade/restore rehearsal и проверить monitoring/performance.
6. Зафиксировать поддерживаемый Billing/Integrations режим, обновить три исходных документа и провести финальный release gate.

До выполнения этих пунктов корректный статус: **основная функциональность реализована, release acceptance не завершена**. Точные проценты готовности по наличию страниц и количеству unit tests определить нельзя.
