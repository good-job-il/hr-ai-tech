# AuditLogPage - Поддержка i18n

## Обзор

Компонент `AuditLogPage.jsx` теперь полностью поддерживает два языка: **иврит** и **английский**.

## Что было сделано

### 1. Добавлены переводы

Переводы добавлены в файлы локализации:
- `/src/locales/he/translation.json` - переводы на иврит
- `/src/locales/en/translation.json` - переводы на английский

Добавлена новая секция `auditLog` с переводами для:
- Заголовков и описаний
- Фильтров
- Таблицы
- Действий (view, create, update, delete, и т.д.)
- Кнопок и элементов управления

### 2. Обновлен компонент

В компоненте `AuditLogPage.jsx`:
- Добавлен хук `useTranslation` из `react-i18next`
- Все хардкод тексты заменены на вызовы `t()` функции перевода
- Добавлена поддержка RTL/LTR направления текста
- Добавлен переключатель языков (`LanguageSwitcher`)
- Форматирование дат адаптировано под выбранный язык

### 3. Основные изменения

#### Динамическое направление текста
```jsx
const isRTL = i18n.language === 'he';
<div dir={isRTL ? 'rtl' : 'ltr'}>
```

#### Локализация дат
```jsx
const dateLocale = i18n.language === 'he' ? he : enUS;
format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: dateLocale })
```

#### Динамические переводы действий
```jsx
const getActionConfig = (t) => ({
  view: { label: t('auditLog.actions.view'), icon: Eye, color: '#64748B' },
  create: { label: t('auditLog.actions.create'), icon: CheckCircle2, color: '#10B981' },
  // ...
});
```

## Как использовать

### Переключение языка

На странице доступна кнопка переключения языка в правом верхнем углу. При клике:
1. Интерфейс переключается на выбранный язык
2. Направление текста меняется (RTL для иврита, LTR для английского)
3. Форматирование дат адаптируется под выбранный язык
4. Все тексты переводятся мгновенно

### Структура переводов

Пример использования переводов в коде:
```jsx
// Простой перевод
{t('auditLog.title')}

// Перевод с вложенными ключами
{t('auditLog.tableHeaders.date')}

// Перевод действий
{t('auditLog.actions.view')}
```

## Доступные языки

- **עברית (he)** - Иврит (RTL)
- **English (en)** - Английский (LTR)

## Переводы

### Основные секции
- `auditLog.title` - Заголовок страницы
- `auditLog.subtitle` - Подзаголовок
- `auditLog.exportCSV` - Кнопка экспорта
- `auditLog.filters` - Секция фильтров

### Фильтры
- `auditLog.entity` - Ищет
- `auditLog.allEntities` - Все ищете
- `auditLog.action` - Действие
- `auditLog.allActions` - Все действия
- `auditLog.userEmail` - Email пользователя
- `auditLog.fromDate` - С даты
- `auditLog.toDate` - По дату
- `auditLog.clearFilters` - Очистить фильтры

### Таблица
- `auditLog.tableHeaders.date` - Дата
- `auditLog.tableHeaders.user` - Пользователь
- `auditLog.tableHeaders.action` - Действие
- `auditLog.tableHeaders.entity` - Ищет
- `auditLog.tableHeaders.description` - Описание

### Действия
- `auditLog.actions.view` - Просмотр
- `auditLog.actions.create` - Создание
- `auditLog.actions.update` - Обновление
- `auditLog.actions.delete` - Удаление
- `auditLog.actions.cv_download` - Скачивание CV
- `auditLog.actions.cv_view` - Просмотр CV
- `auditLog.actions.status_change` - Изменение статуса
- `auditLog.actions.send_to_employer` - Отправка работодателю
- `auditLog.actions.export` - Экспорт
- `auditLog.actions.compensation_change` - Изменение компенсации
- `auditLog.actions.login` - Вход
- `auditLog.actions.impersonate` - Олицетворение
- `auditLog.actions.restore` - Восстановление

## Примеры

### Иврит (RTL)
```
יומן אודיט
ניטור פעילויות משתמשים ושינויים במערכת
[כפתור: יצוא CSV]
```

### English (LTR)
```
Audit Log
Monitor user activities and system changes
[Button: Export CSV]
```

## Тестирование

1. Откройте страницу Audit Log
2. Нажмите на кнопку переключения языка в правом верхнем углу
3. Проверьте:
   - Все тексты переведены
   - Направление текста изменилось (RTL/LTR)
   - Форматирование дат корректное
   - Фильтры работают на обоих языках
   - Экспорт CSV использует правильные заголовки

## Технические детали

### Зависимости
- `react-i18next` - для интернационализации
- `date-fns` - для форматирования дат
- `date-fns/locale` - локали для дат (he, enUS)

### Файлы
- `/src/pages/admin/AuditLogPage.jsx` - главный компонент
- `/src/locales/he/translation.json` - переводы на иврит
- `/src/locales/en/translation.json` - переводы на английский
- `/src/i18n.js` - конфигурация i18n
- `/src/components/ui/LanguageSwitcher.jsx` - переключатель языков

## Расширение

Для добавления новых переводов:
1. Добавьте ключ в `/src/locales/he/translation.json`
2. Добавьте соответствующий перевод в `/src/locales/en/translation.json`
3. Используйте `t('auditLog.yourNewKey')` в компоненте
