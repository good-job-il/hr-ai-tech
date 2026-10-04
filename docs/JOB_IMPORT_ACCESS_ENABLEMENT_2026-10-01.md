# Job Imports: permissions и enablement

Дата: 2026-10-01. Изменения кода готовы; production migration не запускалась в рамках шага 20.1.

## Что меняется

Migration `1754600000000-JobImportPermissionEnablement` дополняет отсутствующие actions `view/create/update/run/review/manage_credentials/archive` у staffing org_admin templates и tenant overrides. Явные `false` остаются запретами. Другие ресурсы и global permissions сохраняются. Timestamps существующих матриц не меняются, чтобы не менять приоритет legacy duplicates. При отсутствии глобального staffing org_admin template создаётся template по существующему org_admin контракту.

Backup хранится в `job_import_permission_backups`. Down восстанавливает только строки, permissions которых не изменены после миграции; поздние ручные настройки не откатывает. Не удалять backup до окончания согласованного rollback window.

Frontend показывает семь отдельных actions и текстовое состояние каждого. Role ceilings совпадают с backend: org_admin все actions; recruitment_manager view/run/review; team_manager view/review; recruiter не управляет imports (job provenance — отдельный workflow). Frontend не заменяет backend guard.

## Порядок rollout

1. Выполнить deploy backend/client с этими изменениями; убедиться, что выбрана нужная БД, проверить backup и список pending migrations. Локальный backend в текущем окружении подключён к удалённой БД: запуск здесь тоже является production mutation.
2. Уполномоченному оператору запустить из backend `npm run migration:run`. Команда применяет все pending migrations, поэтому сначала проверить их перечень, а не предполагать, что pending только одна.
3. Platform admin: `/platform/settings/permissions` → staffing agency → org_admin → Job Imports. Здесь редактируются global templates, влияющие на организации без overrides. Для изменения только одного tenant сначала Open organization, затем `/agency/settings/permissions`.
4. Если permission явно Disabled, включить только необходимые actions и нажать Save Changes. Migration намеренно не заменяет явный запрет.
5. Platform admin: `/platform/billing/flags` → Organization overrides → согласованная организация → Job Imports → Save overrides. Auto-apply и HTML beta не включать для этой проверки.
6. Open organization, обновить страницу/сессию при необходимости и открыть `/agency/import/jobs`. Scoped admin использует effective role org_admin, а не platform-admin bypass. Native platform admin вне organization получает предложение выбрать организацию.
7. Проверить org_admin положительный доступ; отдельно view=false даёт явный denied UI и HTTP 403. Feature=false даёт отдельный disabled UI. Проверить tenant isolation и role ceilings.
8. Завершить keyboard/EN/HE/mobile acceptance wizard/dashboard/review/provenance. После временного теста вернуть tenant flag в исходное состояние, если постоянное включение не согласовано.

## Проверено в текущей итерации

- Backend: 26 permission/guard/DTO/backfill/rollback tests; build.
- Frontend: 29 job-import safety tests; build.
- Permission Matrix: EN/HE, LTR/RTL, 320/768/1280; текстовые состояния, keyboard Space меняет draft; reload отменяет несохранённое изменение.
- Native admin без tenant, tenant feature-disabled и feature-enabled/view-denied показывают разные состояния без redirect на unauthorized.
- Feature override после проверки возвращён к plan default; permission changes, import runs и изменения jobs не выполнялись.

## Осталось

### Исправление plan inheritance

Добавлена migration `1754700000000-PlanFeatureFlags`: серверная таблица `platform_plan_feature_flags`. Матрица читается и сохраняется через `GET/PUT /billing/feature-flags` только native platform admin; изменения всех четырёх планов и audit сохраняются транзакционно. Tenant admin и impersonating admin не могут менять глобальные defaults.

Job Imports effective flags возвращаются через organization API; preview использует тот же серверный resolver. Приоритет: boolean tenant override → boolean server plan default → false. `false` override всегда перекрывает включённый план. Frontend Flags больше не читает и не пишет `platform_flag_matrix` в localStorage. Сохранение плана применяется сразу ко всем организациям этого плана без explicit overrides, не только к новым или renewing tenants.

Перед использованием новой матрицы применить migration на согласованной БД. Она не меняет jobs, permissions или tenant settings; Job Imports/Auto-apply/HTML beta у всех планов первоначально false. Старую browser-local матрицу нельзя считать production configuration, поэтому её автоматический перенос не выполняется. После migration native admin должен заново выбрать нужные флаги в Plan Matrix и сохранить их на сервере. Для теста достаточно Job Imports; Auto-apply и HTML beta оставить выключенными, если их rollout не согласован.

До migration organization API сохраняет работу существующих explicit overrides; Flags показывает ошибку загрузки с Retry, а не выдуманный inherited Enabled. После изменения defaults обновить agency page, чтобы AuthContext загрузил актуальные effective flags. Resource permission `job_imports.view` остаётся независимым обязательным условием.

Production migration и проверка positive-access workflow. Шаг 20.1 полностью не закрыт до их выполнения; полный accessibility acceptance шага 20 также остаётся открытым.
