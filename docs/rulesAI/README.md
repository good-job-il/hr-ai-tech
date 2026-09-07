# Правила UI для coding AI

Этот файл задаёт обязательные правила для создания и переделки интерфейсов проекта. Целевой визуальный стандарт — готовые страницы `/platform/*` и общие компоненты в `src/components/platform/PlatformUI.jsx`.

## Главный принцип

Новая или переделываемая страница должна выглядеть частью `/platform/*`, использовать те же компоненты и сохранять существующую бизнес-логику. Нельзя заменять рабочие запросы, permissions, маршруты, переводы или обработчики фиктивными данными ради дизайна.

Перед изменениями:

1. Найди 1–2 наиболее похожие страницы в `src/pages/platform` и используй их как референс структуры.
2. Прочитай `src/components/platform/PlatformUI.jsx`, `src/components/ui/button.jsx` и существующий layout страницы.
3. Зафиксируй текущие запросы, мутации, проверки ролей, фильтры, состояния загрузки и ошибок. После редизайна они должны продолжать работать.

## Обязательные компоненты

Импортируй компоненты из `@/components/platform/PlatformUI`:

- `PlatformPageShell` — корневой фон и максимальная ширина страницы;
- `PlatformPageHeader` — заголовок, подзаголовок, иконка и actions;
- `PlatformCard` — панели, таблицы, фильтры и карточки сущностей;
- `PlatformStatCard` — KPI и статистика;
- `PlatformEmptyState` — пустые результаты;
- `PlatformModal` или стилизованный общий `Dialog` — модальные окна;
- `platformFieldClassName` — нативные input/select/textarea.

Для кнопок используй `Button` из `@/components/ui/button`. Для dropdown, tabs, badges, dialogs и select используй существующие компоненты из `src/components/ui`. Не создавай локальную копию общего компонента и не дублируй его CSS на странице.

Базовый каркас страницы:

```jsx
<PlatformPageShell dir={isRtl ? "rtl" : "ltr"}>
  <div className="space-y-5">
    <PlatformPageHeader title={title} subtitle={subtitle} icon={Icon} actions={actions} />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PlatformStatCard icon={Users} label={label} value={value} tone="violet" loading={loading} />
    </div>

    <PlatformCard className="p-5">...</PlatformCard>
    <PlatformCard className="overflow-hidden">...</PlatformCard>
  </div>
</PlatformPageShell>
```

## Визуальный язык

- Используй `slate` для основного текста и границ, `violet` как основной акцент.
- Основная кнопка: `Button variant="primary"`; допустима тень `shadow-[0_12px_28px_rgba(99,72,210,0.25)]`.
- Карточки должны наследовать фон, border, radius, shadow и blur из `PlatformCard`.
- Для иконок KPI используй `tone`: `violet`, `blue`, `cyan`, `emerald`, `amber`, `rose` или `slate`.
- Фильтры размещай в `PlatformCard className="p-5"`, с переносом элементов на узких экранах.
- Таблицы помещай в `PlatformCard className="overflow-hidden"` и внутренний `overflow-x-auto`. Заголовок таблицы: светлый `slate` фон, uppercase, небольшой tracking.
- Меню действий открывается кнопкой с `MoreVertical`, имеет пункты Edit, Activate/Deactivate и Delete. Удаление всегда требует диалога подтверждения.
- Используй логические CSS-направления `start/end`, `ps/pe`, `ms/me`, чтобы RTL и LTR работали одинаково.
- Не добавляй новые произвольные цвета, тени и радиусы, если эквивалент уже есть в platform-компонентах или соседней странице.

## Состояния интерфейса

Каждая страница с данными обязана иметь:

- loading: skeleton или `PlatformStatCard loading`;
- error: читаемое сообщение и рабочую кнопку Retry;
- empty: `PlatformEmptyState` с подходящей иконкой;
- success/error feedback для мутаций;
- disabled-состояние кнопок во время запроса;
- видимый focus для клавиатурной навигации.

Меню и диалоги должны иметь доступные названия через видимый label или `aria-label`. Нельзя полагаться только на иконку или цвет.

## Бизнес-логика и безопасность

Проверка роли в React управляет отображением, но не является защитой. Любое ограничение доступа должно также проверяться backend-сервисом с учётом `organization_id`, владельца команды и роли текущего пользователя.

Для `/agency/teams` действуют границы:

- organization admin видит и управляет организацией в пределах своей организации;
- recruitment manager видит себя, принадлежащие ему команды, своих team managers и recruiters; не видит других recruitment managers и их команды; не может удалить organization admin или себя;
- recruitment manager создаёт, редактирует и удаляет свои команды, назначает своих team managers и recruiters;
- team manager видит себя, свою команду и recruiters этой команды; может приглашать, редактировать, активировать, деактивировать и удалять только своих recruiters;
- recruiter не видит пункт Teams и не имеет доступа к `/agency/teams` или API управления командами;
- удаление пользователя снимает доступ и членство, сохраняя исторические ссылки; удаление команды деактивирует её и очищает текущие назначения;
- нельзя удалить себя, последнего активного organization admin или manager активной команды до переназначения.

Никогда не расширяй результаты API на клиенте. Сервер должен возвращать только сущности, доступные текущей роли.

## Переводы

В JSX не должно быть захардкоженного пользовательского текста. Добавляй одинаковые ключи в:

- `src/locales/en/translation.json`;
- `src/locales/he/translation.json`.

Направление бери из текущего языка: `i18n.dir()` или эквивалентная проверка. Даты форматируй в активной locale. Проверяй интерфейс на английском и иврите.

## Сохранение поведения

При редизайне запрещено:

- удалять или упрощать React Query keys, invalidation, refetch и error handling;
- обходить `useAuth`, permissions или backend scope;
- менять payload API без синхронного изменения DTO, сервиса и тестов;
- добавлять mock-данные в production-компонент;
- скрывать ошибку вместо исправления;
- заменять link/button/div так, чтобы ломалась клавиатурная доступность или навигация.

## Проверка результата

После каждого изменения:

1. Запусти ESLint для изменённых frontend-файлов.
2. Запусти frontend build.
3. При изменении API запусти backend TypeScript check, ESLint и связанные Jest-тесты.
4. Выполни `git diff --check`.
5. Открой страницу в браузере и проверь desktop, узкую ширину, dropdown, dialogs, loading/error/empty состояния, английский и иврит.
6. Для ролевых изменений добавь серверные тесты минимум на разрешённый сценарий, cross-tenant доступ, доступ к чужой команде и запрещённую роль.

Готовой считается только реализация, где дизайн совпадает с `/platform/*`, прежняя логика работает, а ограничения нельзя обойти прямым API-запросом.
