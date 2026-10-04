# Шаг 20 — фактическая UI-проверка

Дата: 2026-10-01. Окружение: frontend 127.0.0.1:5173, локальный backend с удалённой БД; tenant Yaron Staffing, platform admin через Open organization.

## Итог

**Актуальный результат 2026-10-04: шаг 20 принят после исправлений и повторной проверки заполненного workflow.** Этот документ сохраняет историю первоначальных блокировок. [Финальный QA-отчёт](JOB_IMPORT_STEP20_UI_QA_2026-10-04.md).

**Дополнение 2026-10-02:** установлена и исправлена причина воспроизводимого сетевого сбоя shared fetcher: неправильный формат pinned DNS callback при Node `all: true`. Добавлен Comeet Careers connector; real read-only safe-fetcher smoke вернул HTTP 200/9 валидных candidates для HyperGuest. Это не повторная полная UI-приёмка: успешные persisted preview/diff/confirmation/provenance всё ещё требуют проверки. [Детали исправления и повторный запуск](JOB_IMPORT_COMEET_FIX_2026-10-02.md).

**Пять обнаруженных UI/a11y дефектов исправлены и перепроверены; шаг 20 целиком пока не принят.** Успешный sample/diff/confirmation и provenance импортированной Job не проверены: повторный тестовый preview также завершился Dead letter, 0 items. Непроверенные сценарии ниже остаются acceptance backlog, а не подтверждёнными дефектами.

## Проверено вручную

- Dashboard: доступ, navigation, пустой список и список с draft; EN; ширины 320/768/1280 без document-level горизонтального overflow.
- Wizard: keyboard Enter открывает Add source; initial focus на Source URL; invalid URL блокирует Continue. Source → Client → Connection → Sample → Defaults пройдены с клавиатуры.
- HE wizard: translated labels, document dir=rtl, ширины 320/768/1280 без document-level overflow.
- Cancel setup: initial focus на безопасной кнопке Continue; Shift+Tab остаётся в диалоге; Escape закрывает диалог и возвращает фокус на Cancel setup; body computed overflow=hidden и data-scroll-locked=1 при открытии.
- Source Detail: состояние Draft/Degraded, health error, run history, timestamps, audit; HE ширины 320/768/1280 без overflow; EN labels/dates после переключения.
- Run review: failed-run и empty state; HE и EN локализованы; EN ширины 320/768/1280 без overflow. Batch mutation не выполнялась.
- Mixed Hebrew/English source name отображается. Язык возвращён в EN, viewport override сброшен.

## Дефекты

| Приоритет | Наблюдение                                                                                                                                                                     | Как воспроизвести                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1        | Primary controls практически невидимы: белый текст без цветного background. Computed styles у Add source и Run preview: foreground rgb(255,255,255), background rgba(0,0,0,0). | Открыть dashboard/source detail на светлом фоне. Проверить сгенерированные utilities `bg-violet-600` и theme palette.                                     |
| P1        | Пустой review показывает `1 selected` и batch controls без выбора item.                                                                                                        | Открыть `/agency/import/jobs/runs/1` без query params: 0 items, но selected=1. В коде пустая строка преобразуется через `.split(',').map(Number)` в ID 0. |
| P1        | У Cancel setup AlertDialog отсутствует `aria-modal`, хотя focus trap и scroll lock работают.                                                                                   | Открыть Cancel setup; role=alertdialog, aria-labelledby задан, aria-modal отсутствует.                                                                    |
| P2        | Client select показывает `#9` и `#10`, Source Detail показывает `9`, вместо человеческих названий клиентов.                                                                    | Wizard Client и Source Detail тестового draft.                                                                                                            |
| P2        | Sample после failed preview показывает только Failed/0 items, без actionable причины или retry.                                                                                | Run sample на тестовом source; причину можно прочитать только в Source Detail.                                                                            |

## Непроверенные сценарии

- Successful sample, populated field diff, raw payload, keyboard batch selection реальных items, bulk-close confirmation.
- Dry-run и confirmation с валидным snapshot.
- Provenance/field-lock/edit dialog импортированной Job: в этой проверке Jobs не создавались.
- Полная матрица каждого populated экрана × оба языка × все widths; отсутствие document overflow не доказывает доступность каждого action.
- Проверка reduced-motion в реальном media mode и формальный contrast/axe audit всего workflow. Наличие CSS policy не считается runtime acceptance.

## Изменения данных во время теста

Создан recoverable draft `sourceId=8`, имя `QA Step20 — בדיקת נגישות — 2026-10-01`, публичный benchmark Greenhouse URL из fixture inventory. Привязан AgencyClient company_id=9 для read-only preview. Run `id=1` завершился Dead letter, UI сообщает невозможность доступа к источнику; причина сетевого сбоя отдельно не расследовалась.

Apply, scheduled activation, mutations Jobs, permissions и feature flags не выполнялись. Draft оставлен для воспроизведения; schedule Manual only, next run отсутствует. Его можно архивировать через UI после завершения расследования. Не удалять реальные source/job records ради очистки QA.

## Исправления и повторная проверка 2026-10-01

- [x] Primary controls: восстановлены numbered palettes violet/cyan в Tailwind с сохранением DEFAULT. В браузере Add source и Run preview имеют background `rgb(124,58,237)` и white text, вместо transparent. Контраст этой пары около 5.7:1; это не заменяет проверку всех остальных элементов.
- [x] Phantom selection: единый parser принимает только уникальные положительные safe integer IDs. Пустой run #1 больше не показывает selected/batch controls.
- [x] AlertDialog: добавлен `aria-modal="true"`. Проверены initial focus на Continue, Escape и возврат focus на Cancel setup; scroll lock после закрытия снимается.
- [x] AgencyClient labels: используется реальное flattened API поле `name` с legacy fallback. Wizard показывает `client 1` / `grw`, Source Detail — `client 1`, а не IDs.
- [x] Failed sample: inline alert с локализованной typed error, подсказкой и Retry sample scan; новые строки проверены в EN и HE/RTL. Failed/dead_letter/cancelled preview не проходит readiness gate для apply.
- [x] Дополнительный дефект connector-а: Greenhouse embedded board URL извлекает token из `?for=alphasights`, а не из path `embed`; connector version 1.0.1, contract regression test проверяет адрес vendor API и invalid embedded URL без token.

### Автоматические проверки

- Client `npm run test:job-import-safety`: 34/34, включая пять новых QA regression tests; тест палитры действительно генерирует CSS через Tailwind/PostCSS.
- Backend MVP connector + preview suites: 25/25.
- Client/backend build и ESLint изменённых production files: успешно.

### Повторный preview и ограничения acceptance

Retry через UI создал read-only run #2, connector 1.0.1. Run завершился Dead letter с сообщением «The source could not be reached», 0 items. Исправление embedded token подтверждено contract test, но успешное получение внешнего board в текущем окружении **не подтверждено**. Нельзя считать успешный preview/diff/confirmation пройденными на основании этого run.

При повторном тесте сохранён onboarding progress существующего draft #8; configuration version стала 3. Source остаётся Draft, Manual only, next run отсутствует. Apply и activation не запускались; permissions/flags не изменялись. Нужна отдельная проверка доступности внешнего источника/egress и populated workflow на изолированной staging БД перед полной приёмкой шага 20.
