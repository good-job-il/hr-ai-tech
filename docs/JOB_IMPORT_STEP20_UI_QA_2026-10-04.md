# Шаг 20 — финальная проверка UI

Дата: 2026-10-04.

## Результат

✅ Шаг 20 принят по критерию локализации, адаптивности и доступности основного workflow. Обнаруженные дефекты исправлены и перепроверены. Это не заявление о формальной WCAG-сертификации и не приёмка production rollout всей import platform.

Окружение: frontend `127.0.0.1:5173`, backend `127.0.0.1:3001`, Yaron Staffing через штатный platform-admin organization context. Backend подключён к удалённой рабочей БД: destructive/business mutations при QA не выполнялись.

## Проверенные экраны

Все перечисленные экраны проверены в EN/LTR и HE/RTL на 320, 768 и 1280 px:

| Экран               | Подтверждено                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Wizard Source       | URL/name labels, известный vendor выбирает Comeet, capabilities, длинный URL не расширяет документ                 |
| Wizard Client       | Каноническое имя HyperGuest, доступный labelled select                                                             |
| Wizard Connection   | Локализованные status/capabilities/limitations                                                                     |
| Wizard Sample       | 9 normalized rows, raw JSON disclosure с клавиатуры, raw локально LTR                                              |
| Wizard Defaults     | Labelled mapping/assignment/policy/schedule controls, локализованные интервалы                                     |
| Wizard Dry-run      | 0 create/update/close/reopen/review, 9 skip; локализованные action cards                                           |
| Wizard Confirmation | 9 items, Apply отключён до explicit confirmation; manual schedule нельзя активировать checkbox-ом                  |
| Sources Dashboard   | Health/status text, поиск, filters, actions, last attempt/success и freshness                                      |
| Source Detail       | Client/assignment names, run history, health timeline, audit и controls                                            |
| Populated Review    | Source/normalized/current panels, field diff, длинные descriptions/URLs, inline correction labels, batch selection |
| Imported Job Edit   | Source/client/health/last sync, внешняя ссылка, source/run/item links, synced fields и import history              |

Итоговый DOM smoke этих экранов: нет document-level горизонтального overflow, видимых неназванных form/icon controls и обнаруженных провалов контраста обычного текста. Выполнено 84 измерения, включая первоначальные и повторные проверки после исправлений; финальные проверки заменяют результаты до исправления. Отдельно проверены горизонтальные границы review controls: все находятся внутри рабочей области на трёх ширинах в EN/HE.

Контраст smoke рассчитывает WCAG luminance ratio по computed foreground/background для видимого текста (4.5:1 обычный, 3:1 крупный); disabled controls и сложные image/gradient backgrounds не являются предметом этого расчёта. Это ограниченный автоматизированный smoke, а не полный аудит каждого пикселя или тест screen reader.

## Клавиатура и dialogs

- [x] Enter: переходы wizard, запуск read-only dry-run, раскрытие source/raw/history/review.
- [x] Space: Select page выбирает 9 реальных IDs; selected/open сохраняются в URL; Clear selection снимает выбор.
- [x] Cancel AlertDialog: initial safe focus, Shift+Tab не выходит наружу, Escape закрывает и возвращает focus, scroll lock снимается.
- [x] Job Edit Dialog: `role=dialog`, `aria-modal=true`, `aria-labelledby`, initial focus на title; focus остаётся внутри; Escape возвращает focus на Edit, body scroll unlock подтверждён.
- [x] Значение status передаётся текстом, а не только цветом.
- [x] Progress использует умеренный `role=status` / `aria-live=polite` без объявления каждой строки.
- [x] Reduced-motion: проверены CSS media rules для workflow и обоих dialog roles и их наличие в runtime stylesheet; duration снижается, smooth scroll отключается. Переключение системной настройки macOS через QA не выполнялось.

## Исправления этой проверки

1. Wizard очищает persisted preview/discovery через JSON `null`, а не исчезающий при serialization `undefined`. Backend DTO и frontend types поддерживают explicit null; сохранение defaults и последующий fresh preview проверены в UI.
2. Все шесть dry-run action cards используют существующие EN/HE status translations (включая Skip).
3. Schedule hours/days локализованы; Manual only не отображается как «каждые 0 часов» и не позволяет включить scheduled sync.
4. Busy sample/dry-run имеет локализованное live status сообщение.
5. Seniority enum текущей Job в review локализуется вместо raw `any`.
6. Общий Dialog явно выставляет `aria-modal`; Job edit восстанавливает focus при открытии без DialogTrigger.
7. Контраст source-state и email alias hint усилен; повторный EN/HE smoke проходит.
8. Reduced-motion применяется также к обычному Dialog, не только AlertDialog.
9. Финальная визуальная проверка обнаружила clipping review actions внутри overflow-hidden panel. Вместо широкой строки используется двухуровневая карточка с отдельной full-width сеткой решений; search icon закреплён внутри input wrapper. Добавлен regression assertion, проверены bounds actions.

Предыдущие palette, phantom selection, AlertDialog, client-label и failed-sample/Retry исправления также покрыты regression suite. Comeet auto-detection/mismatch guards защищают от использования generic parser для vendor URL.

## Автоматические проверки

- Frontend `test:job-import-safety`: **36/36**.
- Frontend `test:agency-jobs:frontend`: **33/33**.
- Frontend API TypeScript, ESLint изменённых компонентов/тестов, Prettier и production build: успешно.
- Backend job-import suites: **18 suites, 157/157**.
- Backend ImportSource DTO: **18/18**, включая nullable preview invalidation.
- Backend `tsc --noEmit -p tsconfig.json`: успешно.
- Client/backend `git diff --check`: успешно.

## Безопасность и границы

UI создал только read-only preview **#16** для существующего source **#11**: Completed, 9 items, все Skip. Ни Apply, ни approve/reject/ignore/retry-item, ни reset override, ни сохранение Job, ни закрытие/архивация, ни включение schedule не выполнялись. Permissions/feature flags не менялись. Onboarding progress/settings metadata сохранялись штатными wizard transitions; source остался Draft/Manual only. Существующие 9 imported drafts были созданы пользователем до этой проверки.

Для production acceptance изменения необходимо развернуть; текущая проверка не подтверждает уже обновлённый `hr-ai.tech`. Массовые mutations и screen-reader/vendor-specific E2E следует дополнительно проводить на отдельном изолированном staging tenant, не на рабочей БД.

История прежних блокировок: [QA 2026-10-01](JOB_IMPORT_STEP20_UI_QA_2026-10-01.md).
