# Аудит страниц `/agency/jobs/*`

Дата проверки: 15 сентября 2026. Проверенная ревизия frontend: `e40276d`.

## Итог

Раздел уже имеет рабочую основу: маршруты существуют, навигация подсвечивает выбранный статус, данные загружаются через Nest API с tenant-aware RLS, фильтры `open`, `filled` и `on_hold` применяются на сервере, поиск по загруженной выборке работает, а создание/редактирование и смена статуса представлены в UI.

При этом раздел пока **не готов к production**. Наиболее заметные проблемы в текущем окружении:

1. в названиях многих вакансий показываются обрезки HTML, JSON и escaped-разметки вместо должности;
2. список и KPI ограничены первыми 200 записями, пагинации нет, поэтому `All jobs` не является настоящим total;
3. в Hebrew-режиме содержимое страницы и формы остаётся на английском, а сам экран принудительно LTR;
4. у проверенной существующей вакансии форма редактирования не смогла восстановить выбранного AgencyClient: select содержал только `Select a client`, а сохранение требует client ID;
5. для большинства записей отсутствуют job code/email alias, а некоторые ссылки всё ещё ведут на `hire-israel-link.base44.app`;
6. нет полноценной браузерной приёмки mutations и четырёх agency-ролей.

## Что именно проверено

- Авторизованный walkthrough на `http://localhost:5173` при viewport `1280 × 720`.
- Маршруты `/agency/jobs`, `/agency/jobs/open`, `/agency/jobs/filled`, `/agency/jobs/hold`.
- Состояния списка, поиск, `Show closed`, пустые разделы, создание и открытие формы редактирования.
- Переключение English/עברית.
- DOM/accessibility tree, console warnings и исходный код frontend/backend.
- Без изменения бизнес-данных: Save, смена статуса, Close/Reopen и создание вакансии намеренно не отправлялись.

Текущая сессия имеет platform-admin/super-role доступ; agency layout показывает роль Recruitment Manager. Поэтому UI и данные удалось проверить, но это не заменяет отдельные E2E-сессии Org Admin и Recruitment Manager и не подтверждает ограничения Team Manager/Recruiter.

## Состояние маршрутов

| Маршрут | Что готово | Что наблюдалось | Статус |
| --- | --- | --- | --- |
| `/agency/jobs` | Общий экран, поиск, переключатель `Show closed`, CRUD-кнопки по permission | API вернул 200 записей; по умолчанию показано 79, после `Show closed` — 200; карточки показывают `200 / 79 / 121` | Частично готов |
| `/agency/jobs/open` | Серверный `state=open`, активный пункт навигации, поиск, таблица и действия | Показано 79 строк, все видимые status-select имеют `open`; поиск `נציג גבייה` оставил одну корректную строку | Базовый read-сценарий готов |
| `/agency/jobs/filled` | Серверный `state=filled`, активный пункт навигации, loading/empty state | В текущей БД 0 записей; показан empty state | Реализован, данные/CRUD E2E не подтверждены |
| `/agency/jobs/hold` | Маршрут корректно отображает `on_hold`, серверный фильтр подключён | В текущей БД 0 записей; показан empty state | Реализован, данные/CRUD E2E не подтверждены |

Неизвестные подпути вроде `/agency/jobs/:id` в agency namespace не определены. Деталь/редактирование открывается модальным окном из списка; публичная деталь вакансии живёт на `/jobs/:id`.

## Что уже готово

### Маршруты и доступ

- Все четыре route подключены к одному экрану `ManageJobsPage`; `/open`, `/filled`, `/hold` преобразуются в `open`, `filled`, `on_hold`.
- Организационные routes разрешены Org Admin и Recruitment Manager. Team Manager направлен в `/agency/team/jobs/*`, Recruiter — в `/agency/recruiter/jobs`.
- Backend применяет RLS до дополнительных query-фильтров и блокирует mutations через role + Permission Matrix (`create`, `update`, `delete`).
- Backend unit-тесты подтверждают server-side state filter, public open boundary, tenant/team assignment validation и canonical team scope.

### Список

- Есть skeleton loading, error state с Retry и empty state.
- Поиск без перезагрузки фильтрует title, company и location.
- Таблица показывает должность, клиента, локацию, code/email/link, compensation, warranty, status и быстрые действия.
- Compensation скрывается/показывается через `view_compensation`.
- Статус можно выбрать из канонического enum: `draft`, `open`, `on_hold`, `filled`, `closed`.
- Есть переход в pipeline, редактирование, close/reopen и копирование email/link.

### Форма вакансии

- Есть создание и редактирование.
- Реализованы обязательные title/client/category, type, location, salary range, description, visibility/contact settings.
- Для staffing agency выбор идёт из active AgencyClient и отправляет `employer_company_id`; backend повторно проверяет, что клиент активен и принадлежит tenant.
- При редактировании показываются read-only job code/email alias и role-based compensation/warranty.
- Backend проверяет `salary_min <= salary_max` и наличие email/phone при открытых contact details.

### Технические проверки

- `npm run build` — проходит.
- `npm run lint -- --no-cache` — проходит.
- `npm run typecheck` — проходит.
- Frontend agency contract tests — 13/13 проходят.
- `JobsService` tests — 5/5 проходят.

## Что нужно доработать

### P0 — привести данные вакансий к рабочему виду

В открытом списке фактически отображаются строки вроде:

- `Zapier Code of Conduct<\/a><\/p>\n<\/li>\n`;
- фрагменты privacy notice и целых JSON-ответов;
- длинные абзацы описания вместо названия позиции.

React экранирует эти значения, поэтому в проверенном UI это не XSS, но список непригоден для операционной работы. Нужно исправить mapping импортёров, очистить уже загруженные записи и добавить validation/normalization для `title`, `company`, `location`, `description` до сохранения.

Критерий готовности: ни одна строка не содержит HTML/JSON fragments; title имеет согласованный лимит и соответствует названию должности; regression-тесты покрывают Jobicy и другие источники.

### P0 — не терять AgencyClient при редактировании

У проверенной вакансии `נציג גבייה / מי עדן` таблица показывает существующего клиента, но в Edit Job select содержал только placeholder `Select a client`. Значение select было пустым, а React вывел warning о `value=null`. При этом submit явно требует `employer_company_id`, поэтому изменение другого поля в такой записи упирается в client selection.

Причина по коду: форма загружает только active agency clients и ожидает, что `job.employer_company_id` совпадёт с одним из `client.company_id`. Старые, глобальные, архивные или некорректно мигрированные вакансии не получают fallback option.

Нужно:

- нормализовать `null` в `""`, чтобы убрать React warning;
- гарантировать миграцию всех agency jobs к актуальному AgencyClient;
- в edit-режиме явно показывать текущего клиента, даже если связь архивна/недоступна, и объяснять, что требуется выбрать новую;
- не позволять форме выглядеть валидной, если изменение невозможно сохранить.

Критерий готовности: открыть и сохранить без изменений любую tenant-scoped вакансию; select всегда показывает канонического клиента или явное migration error state.

### P0 — применить Permission Matrix к чтению

UI использует `create`, `update`, `view_compensation`, но не проверяет `view`. `GET /jobs` имеет RLS, однако не защищён `AgencyActionPolicyGuard` + `@RequiresPermission("view")`. Это не доказанная cross-tenant утечка, но снятие permission `view` не блокирует сам список.

Критерий готовности: пользователь со снятым `view` получает 403 и в UI, и при прямом HTTP-запросе; RLS отдельно продолжает ограничивать tenant/team/recruiter scope.

### P1 — настоящая пагинация, server search и totals

Экран вызывает `jobService.list({ limit: 200 })`, после чего отбрасывает pagination envelope и считает KPI по `jobs.length`. Поэтому:

- если доступно больше 200 вакансий, остальные недоступны;
- `All jobs`, `Open jobs`, `Closed jobs` показывают размер текущей route-выборки, а не общие KPI;
- на `/filled` и `/hold` все три карточки становятся нулями или route-local значениями;
- поиск работает только по уже загруженным первым 200 строкам;
- одновременно рендерится до 200 тяжёлых table rows.

Нужно перейти на `listPage`, сохранить `pagination.total`, добавить server-side search/debounce, page/cursor navigation и отдельный count/aggregation endpoint для status totals.

Критерий готовности: результаты и KPI совпадают на наборе больше 500 записей; поиск находит запись за пределами первой страницы; route transition не меняет смысл глобальных stat cards.

### P1 — исправить status/KPI semantics

- `Closed jobs` считает только `filled + closed`, но meta подписан `Completed or paused`; `on_hold` при этом не учитывается.
- На `/open` карточка `All jobs` показывает число открытых, а не все вакансии.
- Empty state `/filled` и `/hold` предлагает создать новую вакансию, хотя новая вакансия всегда создаётся со state `open`; текст не соответствует контексту.
- Close/Reopen ориентируется только на `job.state === "closed"`, тогда как display fallback учитывает legacy `is_closed`. Для legacy record без state кнопка может повторно вызвать Close вместо Reopen.
- В форме нельзя выбрать initial state или draft; статус меняется только после создания из списка.

Нужно утвердить значение каждой KPI-карточки и контекстные empty actions, нормализовать legacy state и использовать одну функцию определения effective state.

### P1 — завершить генерацию job code/email/public link

Большинство видимых строк показывают `Waiting for code...`. В текущем Nest jobs service есть поля `job_code`, `apply_email`, `apply_url`, но нет генерации этих значений при создании вакансии. У части старых строк public link ведёт на legacy Base44 domain.

Нужно определить источник истины и lifecycle:

- атомарно генерировать уникальный job code;
- создавать email alias на домене продукта;
- формировать canonical public URL из текущего frontend base URL;
- мигрировать/перегенерировать legacy Base44 links;
- показывать ошибку/retry, а не бесконечный `Waiting for code...`.

### P1 — локализация и RTL

После переключения на עברית sidebar и shell перевелись и стали RTL, но весь Jobs screen остался английским: title, KPI, search, columns, statuses, empty/error messages и modal. `ManageJobsPage` также явно передаёт `dir="ltr"`.

Нужно вынести все строки `ManageJobsPage` и `JobFormModal` в `translation.json`, использовать направление активного языка и проверить mixed Hebrew/English values. Формат денег/чисел/дней тоже должен зависеть от locale.

Критерий готовности: EN полностью LTR, HE полностью RTL; на странице нет служебных строк другого языка, кроме пользовательских данных.

### P1 — адаптивность таблицы

При ширине 1280 px agency sidebar оставляет контенту меньше ширины, чем `min-w-[1080px]`. Поэтому таблица требует горизонтальной прокрутки: в English сначала видна в основном Position, а status/actions находятся далеко справа; в Hebrew начальная сторона меняется и Position оказывается скрыт. Связь строки с действиями теряется.

Нужно заменить desktop-table на responsive layout: закрепить Position и Actions, скрывать второстепенные столбцы с раскрытием строки либо использовать карточки на узких экранах. Добавить явный affordance горизонтального scroll, если он остаётся.

### P1 — доступность модального окна и icon actions

В DOM модалка не имеет `role="dialog"` и `aria-modal="true"`, фокус после открытия остаётся на кнопке под overlay, body не блокирует scroll. Нет focus trap, Escape/return focus не реализованы. Кнопки Refresh, Edit и Close modal не имеют accessible name; status select и search полагаются на визуальный контекст/placeholder.

Нужно использовать общий Dialog primitive, связать title через `aria-labelledby`, добавить focus management и `aria-label`/visible labels для icon-only controls.

### P2 — расширить форму до заявленного agency workflow

По продуктовой спецификации в вакансии также нужны требования/skills, seniority/experience, формат работы, назначение Team Manager/Recruiter, source/owner и связь с compensation plan. Backend поддерживает часть этих полей, но форма их не предлагает. Сейчас `Remote` смешан с job type (`full/part/daily/remote`), из-за чего нельзя выразить, например, full-time remote.

Рекомендуется разделить employment type и work mode, добавить assignment controls по role/scope и сделать переход Pipeline контекстным (`jobId`), а не просто вести в общий pipeline.

### P2 — более точные error/loading states

- Compensation plans загружаются после jobs последовательно; ошибка compensation молча превращается в `—`.
- Ошибка списка клиентов предлагает закрыть и заново открыть форму вместо Retry.
- Copy использует Clipboard API без обработки отказа.
- Status mutation перезагружает весь список, нет rollback/локального восстановления контекста.
- При search с нулём результатов текст всё равно предлагает создать вакансию вместо очистки поиска.

## Рекомендуемый порядок работ

1. Очистить импортированные title/description и восстановить связи `Job → AgencyClient`.
2. Исправить edit select и React warning; добавить integration test на legacy/inactive client.
3. Закрыть `view` permission на API/UI.
4. Перевести список на `listPage`, server search, pagination и count API.
5. Уточнить KPI/status semantics и contextual empty states.
6. Реализовать job code/email/current-domain link generation и миграцию Base44 URL.
7. Локализовать экран и форму; затем пройти EN/HE × LTR/RTL.
8. Переделать responsive table и accessibility модалки/actions.
9. Добавить browser E2E: Org Admin и Recruitment Manager CRUD/status/client link; Team Manager/Recruiter scope и запреты; reload/error/rollback.

## Минимальный Definition of Done

- Route-фильтры и totals корректны на объёме больше одного page limit.
- Создание клиента → создание вакансии → открытие edit → сохранение → появление в client detail проходит без ручной коррекции.
- `open/filled/on_hold/closed/draft` одинаково трактуются UI, API, dashboard и reports.
- Нет malformed titles, legacy Base44 links и бесконечного `Waiting for code...`.
- EN/HE и desktop/mobile проходят визуальную приёмку.
- Keyboard-only пользователь может открыть, заполнить и закрыть modal с возвратом фокуса.
- Permission revocation и tenant/team/recruiter boundaries проверены реальным HTTP/browser E2E.
- Create, edit, status change, close/reopen и pipeline deep link переживают reload и показывают корректную ошибку при отказе API.

## Ключевые места в коде

- `src/App.jsx:270-293` — route/access structure.
- `src/pages/admin/ManageJobsPage.jsx:43-116` — route mapping и загрузка первых 200 строк.
- `src/pages/admin/ManageJobsPage.jsx:153-219` — client filtering и route-local counts.
- `src/pages/admin/ManageJobsPage.jsx:225-383` — hardcoded LTR/English, KPI, search и empty states.
- `src/pages/admin/ManageJobsPage.jsx:535-599` — status и row actions.
- `src/components/employer/JobFormModal.jsx:62-125` — active clients и edit hydration.
- `src/components/employer/JobFormModal.jsx:127-207` — validation/save.
- `src/components/employer/JobFormModal.jsx:213-224` — modal container без dialog semantics/focus management.
- `src/api/services/resourceService.ts:22-59` — list/listPage и потеря pagination при `list()`.
- `backend/src/modules/jobs/jobs.service.ts:42-125` — RLS, server filters и pagination.
- `backend/src/modules/jobs/jobs.controller.ts:42-95` — GET без view permission guard; mutation guards присутствуют.

