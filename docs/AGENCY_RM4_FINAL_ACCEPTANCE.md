# RM-4: Финальная приёмка Recruitment Manager

Дата реализации: 19 августа 2026

## Проверяемые контракты

### Назначение и перераспределение

- job, candidate и Application переносятся между Team/Recruiter одной транзакцией;
- Recruiter обязан быть активным участником выбранной Team;
- каждый assign/reassign содержит reason, timeline и AuditLog;
- после успешной операции инвалидируются dashboard, reports, activity, jobs,
  candidates, applications и client caches.

### Негативная авторизация

Recruitment Manager:

- читает Permission Matrix, но получает 403 на create/update/delete;
- видит billing status, но API не публикует billing mutation endpoints;
- читает integration status, но получает 403 на connect/reconnect/disconnect;
- не получает `manage_settings` даже из ошибочного tenant override.

Проверка выполняется и route metadata/guard, и service boundary, чтобы прямой вызов
service не обходил policy.

### Большие списки

Нагрузочный acceptance fixture содержит 10 000 Application, 1 000 jobs и
200 Recruiter. Dashboard обязан:

- не обрезать totals;
- вернуть funnel total, равный количеству Application;
- завершить in-memory aggregation менее чем за 2 секунды в test environment.

### UI acceptance

- `en`/`en-*` используют LTR, `he`/`he-*` используют RTL;
- Activity отличает 403 и recoverable load error от empty state и позволяет retry;
- mutation error остаётся видимой, successful reassign инвалидирует все зависимые
  React Query caches.

## Автоматические проверки

- `npm run test:rm4:frontend`;
- `npm run test:agency`;
- `npm run typecheck`;
- frontend/backend lint и build.

## Остаточная ручная проверка перед production

На staging выполнить browser smoke для desktop/mobile в EN/HE и подтвердить
визуальное отсутствие overflow/focus regressions. Автоматические contract и
service acceptance-тесты не заменяют visual regression на реальном браузере.
