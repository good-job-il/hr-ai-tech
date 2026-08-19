# Agency Phase 2 — Clients and Jobs

Дата завершения: 2 августа 2026.

## Что изменилось

Клиент staffing agency теперь является отдельной tenant-связью, а не вариантом `Organization` и не компанией, вычисленной из списка вакансий.

```text
Organization (staffing agency tenant)
  └── AgencyClient (status, owner, contacts, contract)
        └── Company (employer identity)
              ├── Job.employer_company_id
              └── Application.employer_company_id
```

`Job.organization_id` и `Application.organization_id` остаются идентификаторами агентства, которое ведёт подбор. Благодаря этому одна и та же Company может быть клиентом разных агентств без смешивания их вакансий, кандидатов и KPI.

## API contract

Основной ресурс: `/agency-clients`.

| Operation | Endpoint                     | Поведение                                                                   |
| --------- | ---------------------------- | --------------------------------------------------------------------------- |
| List      | `GET /agency-clients`        | Только связи текущего agency tenant; фильтры `status`, `industry`, `search` |
| Detail    | `GET /agency-clients/:id`    | Company profile, relation fields и tenant-scoped KPI                        |
| Create    | `POST /agency-clients`       | Создаёт Company или связывает существующую, затем создаёт AgencyClient      |
| Update    | `PATCH /agency-clients/:id`  | Обновляет relation и разрешённые поля Company                               |
| Archive   | `DELETE /agency-clients/:id` | Архивирует связь, но не удаляет глобальную Company                          |

Запись доступна Org Admin и Recruitment Manager; чтение — ролям текущего staffing agency в пределах их tenant. Backend дополнительно требует `org_type=staffing_agency` и `organization_id`.

## Инварианты данных

- `AgencyClient.organization_id` — текущий staffing agency tenant.
- Пара `organization_id + company_id` уникальна.
- Новая или обновлённая вакансия агентства обязана ссылаться на активный AgencyClient этого tenant.
- Backend получает название, initials и color вакансии из Company; присланное клиентом display name не является источником истины.
- Новая Application загружает Job через RLS и наследует от неё `organization_id`, `employer_company_id`, `job_title` и `company`.
- Все KPI client list/detail учитывают только Job/Application текущего tenant и исключают soft-deleted records.

## Archive policy

Архивирование разрешено только когда одновременно:

- нет открытых не удалённых вакансий клиента;
- нет не удалённых Application в статусах `new`, `reviewed`, `phone_interview`, `recommended`, `employer_interview`, `offer`, `probation`.

При нарушении backend отвечает `409` и возвращает количество блокирующих вакансий и Application. Company и исторические записи не удаляются. Архивный клиент больше не предлагается в форме новой вакансии и не отображается в рабочем списке клиентов.

## Миграция

Миграция `1752200000000-AgencyClients.ts`:

1. добавляет `companies.website`;
2. создаёт `agency_clients` с уникальным tenant/company constraint и индексом tenant/status;
3. создаёт AgencyClient для существующих уникальных пар `jobs.organization_id + jobs.employer_company_id`;
4. не удаляет и не переименовывает legacy-поля, поэтому rollback приложения остаётся возможным.

Перед production запуском:

1. сделать backup базы;
2. проверить, что вакансии без `employer_company_id` не относятся к staffing agency или исправить их вручную;
3. выполнить `cd backend && npm run migration:run`;
4. сравнить число уникальных пар agency/company в Jobs с числом backfilled AgencyClient;
5. проверить создание клиента, вакансии и Application на staging;
6. при rollback выполнить `npm run migration:revert` до появления новых production AgencyClient records.

## Проверка

```bash
npm run release:verify
npm run build
cd backend && npm run build
```

Контрактный тест подтверждает tenant isolation связи, допустимость только active client для вакансии, наследование ID в Application и archive policy. Полный browser E2E с реальной базой остаётся частью Фазы 8; он не заменяется этим smoke test.
