# 🏗️ Engineering Rules — HeadHunter Platform

**Status:** Strict Enforcement from Day 1  
**Version:** 1.0  
**Last Updated:** 2026-05-13

---

## 1. FOLDER STRUCTURE RULES

### Directory Organization
```
src/
  features/           # Feature modules (isolated)
  shared/             # Shared across features
  layouts/            # Global layouts
  pages/              # Global pages (wrapper only)
  api/                # API client layer
  theme/              # Design tokens
  lib/                # Core utilities
  hooks/              # Global hooks
  types/              # Global types
  config/             # Configuration
```

### Feature Structure (MANDATORY)
```
features/{feature}/
  pages/              # Page components (smart)
  components/         # Feature components (dumb)
  hooks/              # Feature-specific hooks
  api/                # API calls + mutations
  services/           # Business logic
  state/              # React Query + local state
  utils/              # Feature utilities
  types/              # Feature types
  constants/          # Feature constants
  index.ts            # Barrel export only
```

### Rules
- ✅ Feature directories are **isolated units**
- ❌ **NO cross-feature imports** (except through barrel exports)
- ✅ Each feature exports through `index.ts` only
- ❌ **NO relative imports above 2 levels** (`../..` forbidden)
- ✅ All imports are **absolute** (`@/features/candidate/...`)
- ❌ **NO direct imports** from subfolders (use barrel exports)

---

## 2. IMPORT RULES (STRICT)

### Absolute Imports Only
```javascript
// ✅ GOOD
import { useCandidateProfile } from '@/features/candidate/hooks';
import { CandidateCard } from '@/features/candidate/components';
import { getCandidateAPI } from '@/features/candidate/api';

// ❌ BAD
import { useCandidateProfile } from '../../../features/candidate/hooks/useCandidateProfile';
import { CandidateCard } from '@/features/candidate/components/CandidateCard';
```

### Barrel Exports (MANDATORY)
```javascript
// features/candidate/components/index.ts
export { CandidateCard } from './CandidateCard';
export { CandidateProfile } from './CandidateProfile';
export * from './types';

// features/candidate/hooks/index.ts
export { useCandidateProfile } from './useCandidateProfile';
export { useCandidates } from './useCandidates';

// features/candidate/index.ts (barrel of barrels)
export * from './components';
export * from './hooks';
export * from './api';
export * from './types';
```

### Import Order (enforced by ESLint)
1. React + libraries
2. Absolute imports from `@/`
3. Relative imports (if needed)
4. Side effects (`import './styles.css'`)

---

## 3. COMPONENT RULES

### Smart vs Dumb Components
```
Smart Component (Page / Container):
- Connected to API
- Manages state
- Handles loading/errors
- Calls mutations
- Location: features/{feature}/pages/

Dumb Component (Presentational):
- No API calls
- Pure data display
- Only props
- Fully reusable
- Location: features/{feature}/components/
```

### Component Size Limits
- **Max 300 lines** (page component)
- **Max 150 lines** (presentational component)
- If larger → split into smaller components

### Props Convention
```typescript
interface ComponentProps {
  // Required first
  requiredProp: string;
  
  // Optional after
  optionalProp?: boolean;
  
  // Callbacks last
  onAction?: () => void;
  onChange?: (value: string) => void;
}
```

### Component Export
```javascript
// ✅ GOOD
export default function CandidateProfile({ candidateId }: Props) { }

// ❌ BAD
export function CandidateProfile({ candidateId }: Props) { }
```

---

## 4. STATE MANAGEMENT RULES

### Decision Matrix
| Scenario | Solution | Reason |
|----------|----------|--------|
| **Server state** (users, jobs, candidates) | React Query | Caching + sync |
| **UI state** (modals, drawers, filters) | useState | Local, temporary |
| **Form state** | react-hook-form + Zod | Validation + sync |
| **Global state** (user profile, auth) | Context + useReducer | Single source of truth |
| **Derived state** | useMemo / useCallback | Performance |

### React Query Rules
```typescript
// ✅ GOOD
const { data: candidates, isLoading, error } = useQuery({
  queryKey: ['candidates', filters],
  queryFn: () => getCandidates(filters),
});

// ❌ BAD
const [candidates, setCandidates] = useState([]);
useEffect(() => {
  getCandidates().then(setCandidates);
}, []);
```

### Local State Rules
- Use for **UI state only** (modal open, tab active, etc)
- Use for **form state** (with react-hook-form)
- **Never** for server data
- **Never** for async operations

---

## 5. API LAYER RULES

### Structure
```
api/
  client/             # Axios instance + config
  services/           # Grouped API calls
  hooks/              # useQuery + useMutation hooks
  mappers/            # Response transformations
  validators/         # Response validation
  errors.ts           # Error handling
  constants.ts        # API constants
```

### No Direct API Calls in Components
```typescript
// ❌ BAD
function CandidateList() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/candidates').then(r => r.json()).then(setData);
  }, []);
}

// ✅ GOOD
function CandidateList() {
  const { data } = useCandidatesList();
}

// Hook lives in: features/candidate/hooks/useCandidatesList.ts
// Which calls: features/candidate/api/getCandidates.ts
```

### API Response Normalization
```typescript
// API returns inconsistent data
// Mapper normalizes it

interface RawCandidate { ... }
interface Candidate { ... }

export const candidateMapper = {
  fromAPI: (raw: RawCandidate): Candidate => { },
  toAPI: (candidate: Candidate): RawCandidate => { },
};
```

---

## 6. STYLING RULES (NO INLINE STYLES)

### Token Usage Only
```typescript
// ✅ GOOD
<div className="px-6 py-4 rounded-lg bg-white border border-[#E4ECFF]">
  {/* Uses theme tokens + Tailwind */}
</div>

// ❌ BAD
<div style={{ padding: '24px 16px', borderRadius: '14px', background: '#ffffff' }}>
  {/* Inline styles forbidden */}
</div>
```

### Approved Values Only
- **Colors:** `theme/tokens.js` only
- **Spacing:** 4px scale only (1 = 4px)
- **Shadows:** Predefined shadows only
- **Gradients:** `GRADIENTS` object only
- **Typography:** `typographyClasses` only
- **Border Radius:** `RADIUS` scale only

---

## 6a. BUTTON RULES (MANDATORY)

### ❌ NEVER use raw `<button>` with Tailwind color classes

```jsx
// ❌ FORBIDDEN — raw button with Tailwind bg colors
<button className="bg-purple-600 text-white hover:bg-purple-700 rounded-lg px-4 py-2">
  Save
</button>

// ❌ FORBIDDEN — raw button with inline gradient
<button style={{ background: 'linear-gradient(...)' }}>
  Save
</button>
```

### ✅ ALWAYS use the shared `Button` component

```jsx
import { Button } from '@/components/ui/Button';

// ✅ Primary action (gradient: #9136f0 → #575de8 → #5a8eee)
<Button variant="primary" size="md" onClick={handleSave}>
  Save
</Button>

// ✅ With icon — icon inherits white color automatically
<Button variant="primary" size="sm" onClick={handleCreate}>
  <Plus className="w-4 h-4" /> New Organization
</Button>

// ✅ Secondary (white + border)
<Button variant="secondary" size="sm" onClick={handleCancel}>
  Cancel
</Button>

// ✅ With disabled + loading state
<Button variant="primary" size="md" onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>

// ✅ Danger action (red — semantic, do NOT use gradient here)
<Button variant="danger" size="sm" onClick={handleDelete}>
  Delete
</Button>
```

### Available Variants
| Variant | Use case | Style |
|---|---|---|
| `primary` | Main CTA, form submit, create | Gradient `#9136f0 → #575de8 → #5a8eee`, white text |
| `secondary` | Cancel, back, secondary action | White bg, gray border |
| `ghost` | Toolbar, icon actions, minimal | Transparent |
| `outline` | Outlined CTA | Transparent + colored border |
| `danger` | Delete, suspend, destructive | Red — semantic |
| `success` | Approve, activate | Green — semantic |

### Available Sizes
| Size | Height | Use case |
|---|---|---|
| `xs` | 32px | Table actions, tags |
| `sm` | 40px | Modals, compact UI |
| `md` | 48px | Default, forms |
| `lg` | 56px | Hero CTA, landing |

### Primary Gradient (source of truth)
```css
background: linear-gradient(90deg, #9136f0 0%, #575de8 50%, #5a8eee 100%);
border-radius: 12px; /* md size */
color: #ffffff;
```
Defined once in: `src/components/ui/Button.jsx` → `buttonVariants.primary`  
CSS class: `.btn-primary` in `src/index.css`  
CSS variable: `--gradient-brand` in `src/index.css`

### Rules
- ✅ Use `<Button variant="primary">` for all main action buttons
- ✅ Use `<Button variant="secondary">` for Cancel/Back buttons
- ✅ Use `<Button variant="danger">` for destructive actions (delete, suspend)
- ✅ Icons inside `<Button>` inherit white color automatically — no extra styling needed
- ✅ Pass `disabled={isLoading}` — the component handles `opacity: 0.5` + `cursor: not-allowed`
- ❌ Never add `bg-purple-*`, `bg-blue-*`, `hover:bg-*` classes to `<button>` elements
- ❌ Never override the gradient with `className` or `style` on a `<button>` directly
- ❌ Never create a new button component — extend `Button.jsx` variants instead

### Variant System (for complex components)
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

---

## 7. NAMING CONVENTIONS

### Files & Folders
```
✅ PascalCase for components: CandidateCard.jsx
✅ camelCase for utilities: getCandidate.ts
✅ camelCase for hooks: useCandidateProfile.ts
✅ kebab-case for folders: candidate-list/
✅ UPPER_SNAKE_CASE for constants: MAX_CANDIDATES = 100
```

### Functions & Variables
```
✅ camelCase for variables: const candidateList = []
✅ camelCase for functions: const fetchCandidates = async () => {}
✅ PascalCase for components: const CandidateCard = () => {}
✅ is/has prefix for booleans: const isLoading = true
✅ on prefix for handlers: const onCandidateSelect = () => {}
```

---

## 8. FEATURE BOUNDARIES (STRICT)

### What is a Feature?
- **Isolated business domain**
- **Own data, components, logic**
- **Exported only through barrel**
- **No shared state with other features**

### Examples
```
candidate/      → candidate profiles, experience, skills
recruitment/    → pipelines, stages, applications
employer/       → company dashboard, jobs, team
recruiter/      → tasks, sourcing, placements
admin/          → system controls, users, billing
ai/             → analysis, recommendations, scoring
```

### Cross-Feature Communication (FORBIDDEN)
```typescript
// ❌ FORBIDDEN
import { useCandidateState } from '@/features/candidate/state';
// (from recruiter feature)

// ✅ USE CALLBACKS INSTEAD
<CandidateCard 
  candidate={data}
  onSelect={(candidate) => handleCandidateSelected(candidate)}
/>
```

---

## 9. PERFORMANCE RULES

### Lazy Loading
```typescript
// ✅ GOOD - Route splitting
const AdminDashboard = lazy(() => import('@/features/admin/pages/Dashboard'));

<Routes>
  <Route path="/admin/dashboard" element={<Suspense><AdminDashboard /></Suspense>} />
</Routes>
```

### Memoization Rules
- Memo only if **actual performance issue**
- Use **when:** frequently re-renders + expensive render
- **NOT** when: rarely changes + simple component

### Virtual Scrolling
- **Use for:** lists > 100 items
- **Tool:** react-virtual or built-in virtualization

### Bundle Limits
- **Max total:** 500KB (gzip)
- **Max route:** 100KB (gzip)
- **Max component:** 50KB

---

## 10. ACCESSIBILITY RULES (WCAG 2.1)

### Keyboard Navigation
- ✅ All interactive elements focusable (`tabIndex={0}` if needed)
- ✅ Focus visible (never remove outline)
- ✅ Logical tab order
- ✅ Escape closes modals/drawers

### ARIA
- ✅ Labels for form inputs (`<label htmlFor="">`)
- ✅ aria-label for icon buttons
- ✅ aria-live for dynamic content
- ✅ role attributes when needed

### Color Contrast
- ✅ Minimum 4.5:1 for text
- ✅ 3:1 for UI components
- ✅ Never rely on color alone

---

## 11. DOCUMENTATION RULES

### Required for Every Feature
```markdown
# Feature: Candidate System

## Architecture
- What data flows where
- What components interact
- State management strategy

## Entity Relationships
- Candidate → Applications → Jobs
- Candidate → Interviews → Feedback

## Permissions
- Who can view candidates?
- Who can edit profiles?
- Audit trail requirements

## Events & Analytics
- What events trigger?
- What metrics to track?

## Edge Cases
- What if candidate has no experience?
- What if resume upload fails?
- What if job is deleted?
```

---

## 12. CODE QUALITY ENFORCEMENT

### ESLint Rules (Non-Negotiable)
```javascript
// enforced in .eslintrc.js
- no-console (except warn/error)
- no-unused-vars
- no-relative-imports-above-2-levels
- no-cross-feature-imports
- no-inline-styles
- no-unauthenticated-api-calls
```

### Type Safety
- ✅ Strict TypeScript mode
- ✅ No `any` types (use `unknown` instead)
- ✅ Exhaustive checks on enums

### Formatting
- ✅ Prettier auto-formatting
- ✅ 2-space indentation
- ✅ Single quotes for strings

---

## 13. COMMIT RULES

### Conventional Commits
```
feat(candidate): add CV parsing
fix(recruiter): resolve pipeline filtering
docs(api): update API contract
refactor(state): reorganize React Query hooks
perf(dashboard): optimize dashboard rendering
test(auth): add login flow tests
chore: update dependencies
```

---

## 14. FEATURE RELEASE CHECKLIST

Before shipping ANY feature:

- [ ] Architecture documented
- [ ] All components < 300 lines
- [ ] Zero inline styles
- [ ] **All primary buttons use `<Button variant="primary">` — no raw `<button className="bg-purple-*">` allowed**
- [ ] Full TypeScript types
- [ ] React Query hooks used
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Accessibility audit passed
- [ ] Mobile responsive verified
- [ ] Tests written (if applicable)
- [ ] No console.log left
- [ ] Barrel exports created
- [ ] ESLint passing
- [ ] Performance budget met
- [ ] Documentation written

---

## VIOLATIONS = BLOCKED

- 🚫 PR review **blocks** cross-feature imports
- 🚫 Builds **fail** on ESLint violations
- 🚫 Commits **rejected** without proper messaging
- 🚫 Features **not shipped** without documentation
- 🚫 **Raw `<button className="bg-purple-*">` is BLOCKED** — use `<Button variant="primary">` from `@/components/ui/Button`

**This is not optional.**

**This is how we build enterprise software.**
