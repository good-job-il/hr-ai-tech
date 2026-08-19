# RM-1: Recruitment Manager action policy

Дата фиксации: 18 августа 2026

Эта policy дополняет organization-wide RLS. RLS определяет доступный набор данных,
а effective Permission Matrix разрешает конкретное действие. Роль не может получить
`manage_settings`, даже если ошибочная tenant override или template содержит `true`.

| Область                   | Чтение                                  | Разрешённые mutations                                                      | Обязательный permission                  | Жёстко запрещено                                                       |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| Clients                   | Весь tenant                             | create, update, archive                                                    | `create`, `update`, `delete`             | account manager из другого tenant или несовместимой роли               |
| Jobs                      | Весь tenant                             | create, update, close/reopen, delete; назначение RM/Team Manager/Recruiter | `create`, `update`, `delete`             | assignee из другого tenant, неактивный assignee или несовместимая роль |
| Teams                     | Overview tenant                         | create/update team и назначить Team Manager                                | `manage_users`                           | invitations, изменение роли/активности участника, tenant owner         |
| Compensation              | Весь tenant                             | read/update согласно policy                                                | `view_compensation`, `edit_compensation` | обход permission через прямой API                                      |
| Permission Matrix / Roles | Весь tenant, read-only                  | нет                                                                        | —                                        | create/update/delete                                                   |
| Billing                   | Статус тарифа и usage tenant, read-only | нет                                                                        | —                                        | invoices, изменение тарифа, оплаты или владельца                       |
| Integrations              | Статус tenant, read-only                | нет                                                                        | —                                        | connect, reconnect, disconnect                                         |
| Export                    | Только доступный scope                  | export                                                                     | `export`                                 | export без permission                                                  |

Backend является окончательной границей. UI скрывает недоступные controls, но все
запреты выше также применяются к прямым API-запросам.
