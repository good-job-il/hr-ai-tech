# 🏛️ System Architecture — HeadHunter Platform

**Version:** 1.0  
**Status:** Phase 1 Governance  
**Last Updated:** 2026-05-13

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    HeadHunter Platform                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │         Presentation Layer (React)            │   │
│  │  (Pages, Components, Layouts, UI System)      │   │
│  └────────────────────────────────────────────────┘   │
│                        ↓ ↑                             │
│  ┌────────────────────────────────────────────────┐   │
│  │    Feature Modules (Isolated Business Logic)  │   │
│  │  • Candidate                                  │   │
│  │  • Recruitment (ATS)                         │   │
│  │  • Employer (CRM)                            │   │
│  │  • Recruiter (Workspace)                     │   │
│  │  • Admin (Control)                           │   │
│  │  • AI (Analysis + Matching)                  │   │
│  └────────────────────────────────────────────────┘   │
│                        ↓ ↑                             │
│  ┌────────────────────────────────────────────────┐   │
│  │         State Management Layer                │   │
│  │  • React Query (server state)                 │   │
│  │  • React Context (global state)               │   │
│  │  • useState (local state)                     │   │
│  │  • react-hook-form (form state)               │   │
│  └────────────────────────────────────────────────┘   │
│                        ↓ ↑                             │
│  ┌────────────────────────────────────────────────┐   │
│  │         API Layer (Abstraction)               │   │
│  │  • Services (grouped API calls)              │   │
│  │  • Hooks (useQuery, useMutation)             │   │
│  │  • Mappers (response normalization)          │   │
│  │  • Validators (Zod schemas)                  │   │
│  └────────────────────────────────────────────────┘   │
│                        ↓ ↑                             │
│  ┌────────────────────────────────────────────────┐   │
│  │         Backend API (Deno Functions)          │   │
│  │  • Authentication                             │   │
│  │  • Entity CRUD operations                     │   │
│  │  • AI integrations                            │   │
│  │  • Business logic                             │   │
│  └────────────────────────────────────────────────┘   │
│                        ↓ ↑                             │
│  ┌────────────────────────────────────────────────┐   │
│  │         Data Layer (Base44 Backend)           │   │
│  │  • Entities (Candidate, Job, Application...) │   │
│  │  • Relationships                              │   │
│  │  • Permissions (RLS)                          │   │
│  │  • Transactions                               │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. LAYER RESPONSIBILITIES

### Presentation Layer
**What:** React components, layouts, pages  
**Responsibility:** Render UI, handle user interaction  
**NOT:** API calls, business logic, data transformation  

```
src/
  layouts/                # Global layout wrappers
  shared/components/      # Reusable UI components
  features/{feature}/pages/      # Feature pages
  features/{feature}/components/ # Feature components
```

### Feature Modules
**What:** Isolated business domains  
**Responsibility:** Business logic, state management, API integration  
**NOT:** Cross-feature dependencies  

```
features/{feature}/
  pages/          # Smart components
  components/     # Dumb components
  hooks/          # Custom hooks
  api/            # API calls
  services/       # Business logic
  state/          # State management
  types/          # Type definitions
  utils/          # Utilities
  constants/      # Constants
  index.ts        # Exports only
```

### State Management Layer
**What:** Data flow orchestration  
**Responsibility:** Fetch, cache, sync, transform  
**NOT:** UI presentation  

```
React Query     → Server state (users, jobs, candidates)
Context         → Global state (user, auth, theme)
useState        → Local UI state (modals, filters)
react-hook-form → Form state (validation, submission)
```

### API Layer
**What:** Server communication abstraction  
**Responsibility:** Request/response handling, normalization, error handling  
**NOT:** Component logic  

```
api/services/   → Grouped API endpoints
api/hooks/      → useQuery/useMutation wrappers
api/mappers/    → Response transformation
api/validators/ → Zod schemas
```

### Backend API
**What:** Deno functions, business rules  
**Responsibility:** Authentication, authorization, transactions  
**NOT:** Client-side logic  

### Data Layer
**What:** Base44 entities and relationships  
**Responsibility:** Data persistence, RLS, transactions  
**NOT:** Business logic  

---

## 3. DATA FLOW

### Read Flow (Fetch Data)
```
Component
  ↓
useQuery Hook (from feature)
  ↓
API Service (from feature/api/)
  ↓
API Response
  ↓
Mapper (normalize response)
  ↓
Validator (Zod validation)
  ↓
React Query Cache
  ↓
Re-render with data
```

### Write Flow (Create/Update)
```
Component (form submission)
  ↓
react-hook-form (validation)
  ↓
useMutation Hook (from feature)
  ↓
API Service (POST/PATCH request)
  ↓
Backend Function (authentication, authorization)
  ↓
Entity Update (Base44)
  ↓
Audit Log
  ↓
Notification (if needed)
  ↓
Cache Invalidation
  ↓
Re-fetch and update UI
```

### Error Flow
```
Component Action
  ↓
API Call
  ↓
Error Response
  ↓
Error Normalizer
  ↓
Global Error Boundary
  ↓
User Notification (toast)
  ↓
Logging + Analytics
```

---

## 4. ROUTING ARCHITECTURE

### Route Hierarchy
```
/                           → Public landing
  /jobs                     → Job listings (public)
  /companies                → Company directory (public)
  /pricing, /about, etc.    → Marketing pages

/login, /register, etc.     → Auth flows

/candidate                  → Candidate dashboard
  /candidate/profile        → Profile management
  /candidate/applications   → Applications list
  /candidate/interviews     → Interview history
  /candidate/messages       → Recruiter messages

/recruiter                  → Recruiter workspace
  /recruiter/candidates     → Candidate list
  /recruiter/tasks          → Task management
  /recruiter/sourcing       → Sourcing board

/employer                   → Employer CRM
  /employer/jobs            → Job management
  /employer/candidates      → Pipeline
  /employer/team            → Team management

/recruitment-manager       → Recruitment management
  /recruitment-manager/jobs → Jobs overview
  /recruitment-manager/team → Recruiter management

/admin                      → Admin control
  /admin/users              → User management
  /admin/jobs               → Job moderation
  /admin/companies          → Company management

/ai                         → AI workspace
  /ai/analysis              → Candidate analysis
  /ai/matching              → Job matching
```

### Layout Structure
```
<AuthProvider>
  <QueryClientProvider>
    <BrowserRouter>
      <Routes>
        
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        
        {/* Protected by role */}
        <Route element={<ProtectedRoute requiredRoles={['candidate']} />}>
          <Route element={<CandidateLayout />}>
            <Route path="/candidate/profile" element={<Profile />} />
            ...
          </Route>
        </Route>
        
        <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/users" element={<Users />} />
            ...
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
</AuthProvider>
```

---

## 5. STATE MANAGEMENT ARCHITECTURE

### Decision Matrix
```
┌──────────────────┬──────────────────┬─────────────────────────┐
│ Data Type        │ Storage          │ When to Use             │
├──────────────────┼──────────────────┼─────────────────────────┤
│ Server data      │ React Query      │ All API responses       │
│ User profile     │ Context + RQ     │ Auth + global state     │
│ Form state       │ react-hook-form  │ All forms               │
│ Modal/drawer     │ useState          │ UI toggles              │
│ Filters/search   │ useState + RQ     │ Temporary UI state      │
│ Theme/locale     │ Context          │ App-wide settings       │
│ Notifications    │ Context + queue  │ Toast/alerts            │
└──────────────────┴──────────────────┴─────────────────────────┘
```

### React Query Strategy
```typescript
// Feature-level hooks
features/candidate/hooks/useCandidatesList.ts
features/candidate/hooks/useCandidateProfile.ts
features/candidate/hooks/useUpdateCandidate.ts

// Hooks use services
features/candidate/api/getCandidates.ts
features/candidate/api/getCandidate.ts
features/candidate/api/updateCandidate.ts

// Query keys organized
const candidateKeys = {
  all: ['candidates'],
  lists: () => [...candidateKeys.all, 'list'],
  list: (filters) => [...candidateKeys.lists(), filters],
  details: () => [...candidateKeys.all, 'detail'],
  detail: (id) => [...candidateKeys.details(), id],
};
```

### Context for Global State
```typescript
// auth context
<AuthProvider>  // user, login, logout, loading
  {children}
</AuthProvider>

// notifications context
<NotificationProvider>  // notifications, add, remove, clear
  {children}
</NotificationProvider>

// theme context
<ThemeProvider>  // theme, toggleTheme
  {children}
</ThemeProvider>
```

---

## 6. PERMISSIONS & ROLES MATRIX

### Roles (Enumerated)
```
GUEST           → No authentication
CANDIDATE       → Can apply to jobs, view profile
RECRUITER       → Can source, manage candidates
RECRUITMENT_MANAGER → Can manage recruiters, jobs, team
EMPLOYER        → Can post jobs, view pipeline
ADMIN           → System administration
SUPER_ADMIN     → Full system control
AI_OPERATOR     → AI model management
```

### Permission Model
```
Permission = Action + Resource + Conditions

Examples:
- candidates:view       → View own profile
- candidates:view:all   → View all candidates (recruiter)
- jobs:create           → Create job posting
- jobs:edit:own         → Edit own jobs
- jobs:edit:all         → Edit all jobs (admin)
- applications:review   → Review applications
- analytics:view        → View analytics
- users:manage          → User management (admin)
- ai:control            → AI settings (admin)
- billing:view          → View billing
- billing:manage        → Manage billing (admin)
```

### Implementation
```typescript
// features/auth/hooks/usePermission.ts
function usePermission(permission: string): boolean {
  const { user } = useAuth();
  return checkPermission(user.role, permission);
}

// Usage in components
if (usePermission('jobs:create')) {
  return <CreateJobButton />;
}
```

---

## 7. ENTITY RELATIONSHIPS

```
User (Authentication)
  ↓
  ├─→ Candidate (CV, profile, skills)
  │     ↓
  │     ├─→ Application (to job)
  │     │     ↓
  │     │     └─→ Interview (phone/video/in-person)
  │     ├─→ SavedJob
  │     └─→ Notification
  │
  ├─→ Employer (company, billing)
  │     ↓
  │     ├─→ Job (postings)
  │     │     ↓
  │     │     └─→ Application (from candidate)
  │     ├─→ PipelineStage
  │     └─→ Recruiter (assignment)
  │
  ├─→ Recruiter (placement tracking)
  │     ↓
  │     ├─→ Placement (successful hire)
  │     ├─→ Task (sourcing task)
  │     └─→ Activity (tracked actions)
  │
  ├─→ RecruitmentManager (oversight)
  │     ↓
  │     └─→ Team (recruiter management)
  │
  └─→ Admin (system control)
        ↓
        ├─→ AuditLog
        ├─→ SubscriptionPlan
        └─→ AIModel
```

---

## 8. API CONTRACT STANDARD

### Request Format
```typescript
interface ApiRequest {
  // Path parameters
  id?: string;
  
  // Query parameters (for GET)
  filters?: {
    status?: string;
    location?: string;
    [key: string]: any;
  };
  pagination?: {
    page: number;
    limit: number;
    sort?: string;
    order?: 'asc' | 'desc';
  };
  
  // Body (for POST/PATCH)
  data?: {
    [key: string]: any;
  };
}
```

### Response Format (Normalized)
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  timestamp: string;
}
```

### Pagination Standard
```typescript
interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  cursor?: string;  // for cursor-based pagination
}
```

### Error Normalization
```typescript
// Server returns various error formats
// Normalizer converts all to:

interface NormalizedError {
  code: string;           // 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED'
  message: string;        // User-friendly message
  field?: string;         // For form validation errors
  details?: Record<string, any>;
}
```

---

## 9. CACHING STRATEGY

### React Query Caching
```typescript
// Cache lifetimes
const CACHE_TIMES = {
  SHORT: 1 * 60 * 1000,      // 1 minute (user searches)
  MEDIUM: 5 * 60 * 1000,     // 5 minutes (lists)
  LONG: 30 * 60 * 1000,      // 30 minutes (static data)
  INFINITE: Infinity,         // Jobs, companies
};

// Usage
const { data } = useQuery({
  queryKey: ['candidates', filters],
  queryFn: () => getCandidates(filters),
  staleTime: CACHE_TIMES.MEDIUM,
  cacheTime: CACHE_TIMES.LONG,
});
```

### Invalidation Rules
```typescript
// When to invalidate
- User creates/updates/deletes entity → invalidate list
- User applies to job → invalidate applications + job
- Recruiter moves candidate → invalidate pipeline
- Interview scheduled → invalidate candidate + interview list

// Implementation
queryClient.invalidateQueries({
  queryKey: ['candidates'],
});
```

---

## 10. ERROR HANDLING ARCHITECTURE

### Error Boundaries
```
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Global error handling
- Catches React component errors
- Displays fallback UI
- Logs to monitoring

// API error handling
- Normalizes errors
- Shows user-friendly messages
- Retries on failure
- Logs detailed info
```

### Error Types
```
AuthError       → Login required, token expired
ValidationError → Form validation, required fields
NotFoundError   → Resource not found
ConflictError   → Resource already exists
ServerError     → 500+ errors
NetworkError    → Connection issues
TimeoutError    → Request timeout
```

---

## 11. EVENT & ANALYTICS FOUNDATION

### Event Categories
```
User Events:
- user.login
- user.logout
- user.register
- user.profile_updated

Candidate Events:
- candidate.profile_created
- candidate.profile_updated
- candidate.cv_uploaded
- candidate.job_applied
- candidate.job_saved
- candidate.interview_scheduled

Recruiter Events:
- recruiter.candidate_sourced
- recruiter.candidate_moved
- recruiter.interview_scheduled
- recruiter.offer_sent

Employer Events:
- employer.job_posted
- employer.job_closed
- employer.candidate_reviewed
- employer.interview_scheduled

AI Events:
- ai.analysis_run
- ai.matching_performed
- ai.score_generated
```

### Audit Logging
```typescript
// Every important action logged
interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## 12. PERFORMANCE ARCHITECTURE

### Lazy Loading Strategy
```typescript
// Route-based code splitting
const AdminDashboard = lazy(() => import('@/features/admin/pages/Dashboard'));
const RecruiterWorkspace = lazy(() => import('@/features/recruiter/pages/Workspace'));

// Suspense boundaries for loading states
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Image Optimization
```typescript
// Use Next-gen formats
- WEBP for modern browsers
- PNG fallback for old browsers
- Lazy loading for images below fold
- Responsive images (srcset)
```

### Virtual Scrolling
```typescript
// For lists > 100 items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={candidates.length}
  itemSize={80}
>
  {CandidateRow}
</FixedSizeList>
```

---

## 13. ACCESSIBILITY ARCHITECTURE

### WCAG 2.1 Compliance (AA Level)
```
✅ Keyboard navigation
✅ Focus management
✅ ARIA labels
✅ Color contrast (4.5:1 for text)
✅ Screen reader support
✅ Form error messages
✅ Skip to main content link
```

### Component Accessibility
```typescript
// Form input with label
<label htmlFor="email">Email</label>
<input id="email" type="email" required />

// Icon button with label
<button aria-label="Close modal">
  <CloseIcon />
</button>

// Loading indicator
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : content}
</div>
```

---

## ENFORCEMENT MECHANISM

This architecture is **NOT optional**.

- 🚫 PRs violating rules are **rejected**
- 🚫 Builds fail on **lint violations**
- 🚫 Deployments blocked on **security issues**
- 📊 Metrics tracked: performance, errors, accessibility

**We build systems, not prototypes.**