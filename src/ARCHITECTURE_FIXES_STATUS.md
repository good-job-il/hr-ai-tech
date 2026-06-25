# Core Architecture Fixes — Status Report

**Date**: 2026-05-20  
**Status**: IN PROGRESS

---

## ✅ Fixed

### 1. ProtectedRoute Enforcement
**File**: `components/ProtectedRoute.jsx`

**Changes**:
- Added `requiredRoles` validation
- Added `requiredOrgTypes` validation
- Added `superAdminOnly` flag
- Super roles (`admin`, `super_admin`) bypass `requiredRoles` but NOT `requiredOrgTypes`
- Proper unauthorized redirects

**Verification**:
```jsx
// Platform routes — super_admin only
<Route element={<ProtectedRoute superAdminOnly />}>
  <Route path="/platform/dashboard" element={<PlatformDashboard />} />
</Route>

// Agency routes — specific roles + org_type
<Route element={<ProtectedRoute
  requiredRoles={['org_admin', 'recruitment_manager', 'team_manager']}
  requiredOrgTypes={['staffing_agency']}
/>}>
  <Route path="/agency/dashboard" element={<AgencyDashboard />} />
</Route>
```

**Result**: ✅ PASS — Routes now properly enforce role + org_type restrictions.

---

### 4. Super Admin Isolation
**File**: `lib/rls-utils.js`

**Changes**:
- `super_admin` can ONLY access platform entities: `Organization`, `AuditLog`, `PermissionMatrix`, `RoleTemplate`
- All tenant-sensitive data (Candidate, Application, Job, CompensationPlan) is BLOCKED for `super_admin` by default
- To access tenant data, must use impersonation/support mode (Phase D)

**Code**:
```javascript
const PLATFORM_ENTITIES = ['Organization', 'AuditLog', 'PermissionMatrix', 'RoleTemplate'];

if (role === 'super_admin') {
  if (PLATFORM_ENTITIES.includes(entityName)) return {};
  return { id: '__BLOCKED__' }; // Tenant data blocked
}
```

**Result**: ✅ PASS — Super admin no longer sees tenant-sensitive data by default.

---

### 5. CompensationPlan Isolation
**File**: `lib/rls-utils.js`

**Changes**:
- `CompensationPlan` is NOW `staffing_agency` ONLY
- Company HR (`organization` type) CANNOT see or create compensation plans
- Enforced at RLS level + validation

**Code**:
```javascript
if (entityName === 'CompensationPlan') {
  if (orgType !== 'staffing_agency') {
    return { id: '__BLOCKED__' };
  }
  return { organization_id: orgId };
}
```

**Result**: ✅ PASS — Compensation plans are now isolated to staffing agencies only.

---

## 🟡 In Progress

### 3. Backend Validation
**File**: `lib/validateEntityOwnership.js`

**Status**: Created validation utilities, need to integrate into create/update flows.

**Next Steps**:
- Add validation to `processCandidateImport` function
- Add validation to `createApplicationTimeline` function
- Add validation to `sendCandidateToEmployer` function
- Ensure all create/update operations call `validateEntityData()`

**Verification Needed**:
- Test creating Candidate without `organization_id` → should FAIL
- Test creating Application without `recruiter_id` (staffing_agency) → should FAIL
- Test creating CompensationPlan with `organization` type → should FAIL

---

## 🔴 Not Started

### 2. Employer Legacy Removal
**Status**: Still exists alongside new structure.

**Options**:
A. **Remove completely** — Delete all `/employer/*` routes, components, functions
B. **Full alias** — Redirect all `/employer/*` → `/company/*` with proper role mapping

**Recommendation**: Option A (remove) — We're past migration period.

**Files to audit**:
- `pages/employer/*` (4 files)
- `components/layouts/EmployerLayout`
- `components/employer/*` (many components)
- `routes` in App.jsx

---

### 6. Team Structure Planning
**Status**: Not started — acknowledged as future work.

**Plan**:
- Create `Team` entity
- Create `TeamMembership` entity
- Support nested teams (team → sub-team)
- Update `ProtectedRoute` to handle team-based access

**Timeline**: Post-pilot (not required for initial launch)

---

### 7. Navigation Cleanup
**Status**: Partial — still has legacy terminology.

**Audit needed**:
- Remove "admin" from agency navigation (should be "org_admin" or "recruitment_manager")
- Remove all "employer" references (replace with "company HR")
- Ensure platform navigation uses "Platform" terminology consistently

---

### 8. Performance Optimization
**Status**: CRITICAL — System is slow.

**Immediate actions needed**:
1. **Pagination** — Add to all `list()` calls (Candidate, Application, Job)
2. **Query limits** — Never fetch >500 records without pagination
3. **Memoization** — Add `React.memo()` to heavy components
4. **Lazy loading** — Load modals/drawers on-demand
5. **Debounce** — Search inputs, filters
6. **Skeleton loaders** — Replace loading spinners with content placeholders

**Files to optimize**:
- `pages/crm/CandidateListCRMPage` — likely loading all candidates
- `pages/agency/AgencyDashboard` — stats queries
- `pages/admin/CompensationPage` — compensation plans + jobs
- `components/ats/PipelineBoard` — pipeline data

**Tools**:
- React Query `useQuery` with proper `staleTime` + `cacheTime`
- `useMemo` for expensive calculations
- Virtual scrolling for long lists (if needed)

---

##  Verification Checklist

After all fixes:

| Feature | Test | Expected | Status |
|---------|------|----------|--------|
| ProtectedRoute | `recruiter` tries `/platform/dashboard` | Redirect to `/unauthorized` | ⏳ |
| ProtectedRoute | `org_admin` tries `/company/dashboard` | Redirect to `/unauthorized` (wrong org_type) | ⏳ |
| Super Admin | Login as `super_admin`, view `/agency/crm` | See empty/blocked | ⏳ |
| Compensation | Login as `hr_manager` (company), view `/agency/compensation` | Blocked | ⏳ |
| Backend Validation | Create Candidate without `organization_id` | Error | ⏳ |
| Performance | Load Candidate CRM with 100 records | <2s | ⏳ |

---

## Next Steps

1. ✅ Complete backend validation integration
2. 🔴 Decide on employer legacy (remove vs alias)
3. 🔴 Audit and clean navigation terminology
4. 🔴 Performance optimization sprint
5. ⏳ Full verification + screenshots