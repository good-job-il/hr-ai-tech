# Отчёт: Анализ использования base44 и план миграции на NestJS

> Дата: июль 2026  
> Автор: анализ кодовой базы

---

## 1. Почему UsersManagementPage.jsx всё ещё использует base44?

### Короткий ответ
`base44` в этом файле — **не старый Base44-сервис**. Это **совместимостный шим (compatibility shim)**, реализованный в `src/api/base44Client.js`, который **уже работает поверх NestJS REST API**.

### Что делает shim
Файл `src/api/base44Client.js` реализует тот же публичный интерфейс, что был у Base44 SDK (`base44.entities.X.*`, `base44.auth.*`, `base44.functions.invoke()`, `base44.integrations.Core.*`), но внутри вызывает `httpClient` → NestJS backend. Это была осознанная стратегия Phase 5 миграции: не переписывать 130+ компонентов одновременно, а подменить реализацию "под капотом".

### Конкретные вызовы в UsersManagementPage.jsx

| Вызов | NestJS endpoint | Назначение |
|---|---|---|
| `base44.entities.User.list('-created_date', 500)` | `GET /api/users?sort=created_date&order=DESC&limit=500` | Загрузка списка всех пользователей |
| `base44.entities.Organization.list('', 500)` | `GET /api/organizations?limit=500` | Загрузка организаций для дропдауна |
| `base44.entities.User.create(data)` | `POST /api/users` | Создание нового пользователя |
| `base44.entities.User.update(id, data)` | `PATCH /api/users/:id` | Редактирование пользователя |
| `base44.entities.User.delete(id)` | `DELETE /api/users/:id` | Удаление пользователя |

**Вывод:** с технической точки зрения страница уже работает через NestJS. Проблема — в абстракции: вызовы идут через универсальный proxy-слой вместо типизированных API-модулей, что затрудняет дебаггинг, типизацию и поддержку.

---

## 2. Масштаб проблемы: сколько файлов используют base44?

### Итог
- **104 файла** (компоненты + страницы + utils) продолжают использовать `base44.*`
- **1 файл** — сам shim (`src/api/base44Client.js`)

### Разбивка по категориям

| Категория | Кол-во файлов |
|---|---|
| `src/pages/` — страницы (admin, employer, candidate, crm, platform, recruiter и др.) | ~65 |
| `src/components/` — переиспользуемые компоненты | ~30 |
| `src/lib/` — AuthContext, roleAliasResolver и т.д. | 2 |
| `src/api/` — tokenStorage | 1 |

### Топ-10 наиболее используемых сущностей

| Сущность / вызов | Кол-во вхождений |
|---|---|
| `base44.entities.Job` | 36 |
| `base44.functions.invoke` | 34 |
| `base44.entities.Application` | 33 |
| `base44.entities.Organization` | 18 |
| `base44.integrations.Core` | 16 |
| `base44.entities.Interview` | 15 |
| `base44.entities.Candidate` | 15 |
| `base44.entities.Company` | 14 |
| `base44.entities.Staff` | 13 |
| `base44.entities.CompensationPlan` | 10 |

---

## 3. Полный список используемых сущностей (base44.entities.*)

Все 28 сущностей, которые фронтенд вызывает через шим:

```
Application        ApplicationPipeline   ApplicationTimeline
AuditLog           Candidate             CandidateAccess
CandidateImportBatch  CandidateProfile   CommunicationLog
Company            CompanyReview         CompensationPlan
Domain             ImportSource          Interview
Job                Message               Notification
Organization       PermissionMatrix      Role
RoleAlias          RoleTemplate          SavedJob
Specialization     Staff                 StaffInvite
User
```

---

## 4. Все `functions.invoke()` — серверные функции

22 серверные функции вызываются через `base44.functions.invoke('name', params)` → `POST /api/functions/name`:

| Функция | Область применения |
|---|---|
| `getDashboardStats` | Дашборды статистики |
| `smartSearch` | AI-поиск кандидатов/вакансий |
| `getRecommendedJobs` | AI-рекомендации вакансий |
| `scoreApplication` | AI-скоринг заявок |
| `extractAndTranslateResume` | Парсинг и перевод резюме |
| `parseResumeBatch` | Batch-обработка резюме |
| `importResumeFiles` | Импорт файлов резюме |
| `importCandidatesFromFile` | Импорт кандидатов из CSV |
| `createBulkCandidates` | Массовое создание кандидатов |
| `validateImportBatch` | Валидация импорт-батча |
| `createApplicationTimeline` | Создание истории заявки |
| `createAuditLog` | Запись в аудит-лог |
| `updateCompanyProfile` | Обновление профиля компании |
| `loadTaxonomy` | Загрузка справочников |
| `crawlCareerPage` | Краулинг карьерных страниц |
| `importJobicy` / `importElbit` / `importNovolog` / `importNvidia` / `importShafir` / `importAlljobs` | Интеграции импорта вакансий |
| `getLocationFromIP` | Геолокация по IP |

---

## 5. Интеграции (base44.integrations.Core.*)

| Метод | Backend endpoint | Назначение |
|---|---|---|
| `UploadFile({ file })` | `POST /api/integrations/upload` | Загрузка файлов (резюме, логотипы) |
| `SendEmail(data)` | `POST /api/integrations/send-email` | Отправка писем (приглашения, уведомления) |
| `InvokeLLM(data)` | `POST /api/integrations/invoke-llm` | AI-запросы (анализ рынка, рекомендации) |

---

## 6. Состояние NestJS backend

Все необходимые модули **уже реализованы** в `backend/src/modules/`:

```
applications/    candidates/    companies/     compensation/
import-sources/  integrations/  interviews/    jobs/
messages/        notifications/ organizations/ permissions/
salary/          taxonomy/      users/         audit/
communication/   functions/
```

Auth: `backend/src/auth/` — JWT, login, register, me, logout, forgot-password, reset-password.

**Единственный gap** — `Staff` (модуль `/staff`) и `StaffInvite` — надо проверить, есть ли они в backend.

---

## 7. Назначение функционала UsersManagementPage

Страница `/platform/users` — это **панель суперадминистратора платформы** для:

1. **Просмотра всех пользователей** системы (все роли, все организации)
2. **Фильтрации** по роли и поиску по имени/email
3. **KPI-плашки**: всего / admins / recruiters / candidates
4. **Создания нового пользователя** с выбором роли, организации, статуса
5. **Редактирования** существующего пользователя
6. **Удаления** пользователя

---

## 8. Почему нужно убрать зависимость от shim?

Хотя shim уже маршрутизирует вызовы на NestJS, его использование несёт риски:

| Проблема | Описание |
|---|---|
| **Отсутствие типизации** | `base44.entities.User` возвращает `any` — нет TypeScript типов |
| **Нет error handling контракта** | Каждый компонент делает `.catch(() => [])` по-разному |
| **Скрытая логика маршрутизации** | Proxy через `ENTITY_CONFIG` — трудно дебажить |
| **Невозможно отключить shim** | Пока хотя бы 1 файл зависит, shim должен жить |
| **Polling-based subscriptions** | `subscribe()` поллит каждые 15 сек вместо WebSocket/SSE |
| **Vendor lock-in** | Архитектурно выглядит как зависимость от внешнего вендора |

---

## 9. План миграции на прямые NestJS API вызовы

### Цель
Заменить `base44.*` → типизированные API-модули (`src/api/`) с прямыми HTTP-вызовами через `httpClient`.

### Принцип
```
БЫЛО:  base44.entities.User.list(...)    → proxy → httpClient.get('/users?...')
СТАНЕТ: usersApi.list(params)             →         httpClient.get('/users?...')
```

---

### Фаза 1 — Подготовка инфраструктуры (1-2 дня)

**1.1. Создать типизированные DTO в frontend**

```
src/api/
  types/
    user.types.ts           ← User, CreateUserDto, UpdateUserDto
    organization.types.ts
    job.types.ts
    candidate.types.ts
    application.types.ts
    interview.types.ts
    ... (остальные сущности)
```

**1.2. Создать API-модули**

```
src/api/
  users.api.ts              ← list, get, create, update, delete
  organizations.api.ts
  jobs.api.ts
  candidates.api.ts
  applications.api.ts
  interviews.api.ts
  auth.api.ts               ← me, login, register, logout, updateMe
  functions.api.ts          ← invoke(name, params)
  integrations.api.ts       ← uploadFile, sendEmail, invokeLLM
  staff.api.ts
  compensationPlans.api.ts
  importSources.api.ts
  notifications.api.ts
  messages.api.ts
  auditLog.api.ts
  taxonomy.api.ts           ← domains, roles, specializations и т.д.
  permissions.api.ts
```

Шаблон API-модуля:
```typescript
// src/api/users.api.ts
import { httpClient } from '@/api/client/httpClient';
import type { User, CreateUserDto, UpdateUserDto, UsersListParams } from './types/user.types';

export const usersApi = {
  list: (params?: UsersListParams) =>
    httpClient.get<User[]>('/users', { params }),
  get: (id: string) =>
    httpClient.get<User>(`/users/${id}`),
  create: (dto: CreateUserDto) =>
    httpClient.post<User>('/users', dto),
  update: (id: string, dto: UpdateUserDto) =>
    httpClient.patch<User>(`/users/${id}`, dto),
  delete: (id: string) =>
    httpClient.delete(`/users/${id}`),
};
```

---

### Фаза 2 — Миграция критических компонентов (3-5 дней)

Приоритет: компоненты с наибольшим количеством вызовов и наибольшей бизнес-критичностью.

#### 2.1. AuthContext (src/lib/AuthContext.jsx)
```typescript
// base44.auth.me, base44.auth.updateMe, base44.entities.Organization.filter
// → authApi.me(), authApi.updateMe(), organizationsApi.filter()
```

#### 2.2. UsersManagementPage.jsx (текущая задача)
```typescript
// Заменить:
base44.entities.User.list('-created_date', 500)
// На:
usersApi.list({ sort: 'created_date', order: 'DESC', limit: 500 })

base44.entities.Organization.list('', 500)
// На:
organizationsApi.list({ limit: 500 })

base44.entities.User.create(data)       → usersApi.create(data)
base44.entities.User.update(id, data)   → usersApi.update(id, data)
base44.entities.User.delete(id)         → usersApi.delete(id)
```

#### 2.3. Страницы с высокой частотой использования
- `pages/employer/Jobs.jsx` — jobsApi
- `pages/crm/EmployerCRMDashboard.jsx` — jobsApi, applicationsApi, interviewsApi
- `pages/admin/ManageCandidates.jsx` — candidatesApi
- `pages/employer/KanbanDashboard.jsx` — applicationsApi

---

### Фаза 3 — Миграция Platform-страниц (2-3 дня)

Все страницы из `src/pages/platform/`:
- `OrganizationsPage.jsx` → organizationsApi
- `PlatformDashboard.jsx` → functionsApi.invoke('getDashboardStats')
- `UsersManagementPage.jsx` → usersApi (из Фазы 2)
- `FlagsPage.jsx`, `InvoicesPage.jsx`, `SubscriptionsPage.jsx`

---

### Фаза 4 — Миграция Admin-страниц (3-5 дней)

Большой блок страниц из `src/pages/admin/` и `src/components/admin/`:
- `CandidateImport.jsx` / `ImportDashboard.jsx` → functionsApi.invoke('importCandidatesFromFile' / 'parseResumeBatch')
- `AuditLogPage.jsx` → auditLogApi
- `PermissionsPage.jsx` → permissionsApi
- `ManageJobs.jsx` / `ManageJobsPage.jsx` → jobsApi
- `RoleSettingsPage.jsx` → taxonomyApi

---

### Фаза 5 — Миграция AI и Integrations (2-3 дня)

- `src/components/ai/CandidateRecommendationsPanel.jsx` → functionsApi.invoke('smartSearch' / 'getRecommendedJobs')
- `src/pages/MarketStats.jsx` → integrationsApi.invokeLLM()
- `src/pages/ai/AIMatchingPage.jsx` → functionsApi.invoke('scoreApplication')
- `src/components/employer/CompanyProfileSettings.jsx` → integrationsApi.uploadFile(), functionsApi.invoke('updateCompanyProfile')

---

### Фаза 6 — Удаление shim (1 день)

После того как **все 104 файла** перешли на прямые API:

1. Удалить `src/api/base44Client.js`
2. Удалить все `import { base44 } from '@/api/base44Client'`
3. Убедиться, что `ENTITY_CONFIG` и proxy-слой больше не нужны
4. Оставить `httpClient`, `tokenStorage` — они переиспользуются

---

### Фаза 7 — WebSocket/SSE вместо polling subscriptions (опционально, 3-5 дней)

Текущий `subscribe()` в shim использует polling каждые 15 секунд.  
Для компонентов, которые используют real-time подписки, реализовать:

**Backend:**
```typescript
// backend/src/modules/notifications/notifications.gateway.ts
@WebSocketGateway()
export class NotificationsGateway { ... }
```

**Frontend:**
```typescript
// src/hooks/useRealtimeSubscription.ts
import { io } from 'socket.io-client';
```

---

## 10. Конкретные следующие шаги (Quick Wins)

| Задача | Время | Файлы |
|---|---|---|
| Создать `src/api/types/` с TypeScript DTO | 4 ч | новые файлы |
| Создать `usersApi.ts` + `organizationsApi.ts` | 2 ч | новые файлы |
| Мигрировать `UsersManagementPage.jsx` | 1 ч | 1 файл |
| Мигрировать `AuthContext.jsx` | 2 ч | 1 файл |
| Мигрировать `OrganizationsPage.jsx` | 1 ч | 1 файл |
| Создать все оставшиеся API-модули | 1 день | ~15 файлов |
| Массовая миграция pages/ и components/ | 5-7 дней | ~100 файлов |
| Удаление shim | 2 ч | 1 файл |

**Итого: ~10-12 дней** на полную миграцию 104 файлов.

---

## 11. Приоритизация рисков

| Риск | Вероятность | Митигация |
|---|---|---|
| Несовместимость query-параметров шима с backend | Средняя | Сверить `buildQueryString()` с DTO валидацией на backend |
| `Staff` / `StaffInvite` — отсутствие backend модуля | Низкая | Проверить `backend/src/modules/` и создать при необходимости |
| Real-time polling → потеря live-обновлений | Высокая | Перейти на WebSocket в Фазе 7 |
| Регрессии при массовом рефакторинге | Высокая | Писать E2E тесты перед миграцией каждой фазы |

---

## Вывод

`base44` в `UsersManagementPage.jsx` и 103 других файлах — это **временный совместимостный слой**, который уже маршрутизирует вызовы на работающий NestJS backend. Технически система работает. Архитектурно — это технический долг, который нужно погасить, заменив шим на типизированные API-модули. Рекомендуется начать с `UsersManagementPage.jsx` и `AuthContext.jsx` как самых критичных, и двигаться итерационно по фазам.

