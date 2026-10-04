# Job import — DNS fix и Comeet Careers

Дата: 2026-10-02.

## Исправлено

- [x] Shared HTTP fetcher: pinned DNS callback возвращает массив единственного проверенного адреса при Node `all: true`, и прежний scalar result в single-address режиме. IPv4/IPv6 покрыты regression tests. Повторный DNS lookup не добавляется; SSRF policy не ослабляется.
- [x] Comeet 1.0.0 зарегистрирован в Nest DI, backend catalog/domain contracts и frontend EN/HE.
- [x] Company Careers URL преобразуется в официальный Careers API `/careers-api/2.0/company/{uid}/positions?details=true`. Используется только public Careers Website token из URL, не private Recruiting API credential. Query token редактируется существующим safe-fetcher logging boundary.
- [x] Mapping: stable position UID, title/company, sanitized description/requirements details, separate employment/work mode, location, department, seniority aliases, updated date и public posting/apply URLs. Platform `jobs.apply_url` по-прежнему создаётся Apply Service, не коннектором.
- [x] Staging raw items ограничены allowlist полей: token-bearing `position_url` и неизвестные ATS fields не сохраняются; token удаляется из posting URLs/discovery response.
- [x] Snapshot: полный успешный опубликованный список, 304 → incremental/not_modified, malformed/schema change → PARSER_CHANGED. Это не endpoint всех внутренних вакансий и не explicit closed-status feed.
- [x] Нет обхода JobsService, прямого fetch, создания вакансий, активации расписаний или автоматической смены legacy source connector.

## Как повторить HyperGuest через UI

1. Перезапустить backend после обновления кода; обновить frontend.
2. В настройке/онбординге HyperGuest выбрать **Comeet careers (public token required)**. Если раньше выбран JSON feed или JSON-LD, его необходимо заменить; пустая connector configuration подходит Comeet (не переносить JSON root/mapping/page-size options).
3. Использовать исходную company Careers Website ссылку, включая public `token` и правильный company UID. Token здесь намеренно не дублируется.
4. Сохранить draft, пройти Client → Connection и запустить Sample/preview заново. Старые failed runs не переписываются.
5. Проверить sample/diff до отдельного подтверждения Apply. Сам Sample не создаёт вакансии.

Если token отсутствует/невалиден, возвращается AUTH_REQUIRED; отказ источника — SOURCE_FORBIDDEN; 429 — RATE_LIMITED с Retry-After; изменённая коллекция — PARSER_CHANGED. Не менять permissions, flags или security policy ради обхода ошибки.

## Проверка реального HTTP (без БД)

Автоматические проверки: backend job-imports — 18 suites / 155 tests, frontend job-import-safety — 34 tests; client/backend build и ESLint изменённых production files прошли. Миграция для нового connector type не нужна: существующее поле connector_type — varchar.

После сборки использованы именно compiled ComeetConnector + SafeHttpFetcherService с vendor allowlist, pinned connection и общими лимитами:

- Официальный Comeet Careers API Sandbox: HTTP 200, 3 items, full snapshot.
- HyperGuest по предоставленной пользователем ссылке: HTTP 200, 9 items; все 9 normalized candidates валидны по NormalizedSourceJobSchema.

Запросы были read-only. Run/source/job rows не менялись. Это проверка transport/map, не полная приёмка UI preview/apply/resync/close/reopen. Шаг 20 не отмечается выполненным без оставшихся populated UI/a11y тестов.

## Ограничения

- Только опубликованные Careers positions; приватные/employee-only ATS workflows не заявлены.
- Нет salary/webhooks/explicit close/detail pagination capabilities. Missing comparison и массовые closing proposals остаются за существующим reconciliation/circuit breaker.
- Общие timeout/bytes/rate limits сохранены. Большой источник, не укладывающийся в них, должен вернуть typed error, а не обходить safety boundary.
- Ссылки и public token нельзя заменять приватным API ключом. Для private credentials требуется отдельная интеграция credential-reference workflow.

Источники контракта: [Comeet Careers API list](https://developers.comeet.com/reference/careers-api-list-all-positions), [position model](https://developers.comeet.com/reference/careers-position-model), [official sandbox](https://developers.comeet.com/reference/careers-api-overview).
