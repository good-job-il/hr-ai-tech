# Organization ID Migration Plan

**Date**: 2026-05-20  
**Status**: PLANNED  
**Goal**: Remove hardcoded `TAASUKA_TOVA_ORG_ID` and implement proper multi-tenant SaaS architecture

---

## Current State (Problem)

### Hardcoded Organization ID

```javascript
// ❌ BAD - Hardcoded in multiple places
const TAASUKA_TOVA_ORG_ID = "6a0d7291e1bc86f20a5aef28"

// Used in:
;-functions / emailPoolIntakeHandler.js -
  functions / emailIntakeHandler.js -
  functions / processCandidateImport.js -
  functions / sendCandidateToEmployer.js -
  functions / createCandidateTimeline.js -
  functions / createApplicationTimeline.js -
  lib / rls -
  utils.js
```

### Problems

1. **Not SaaS-ready** — Only works for single pilot organization
2. **No tenant isolation** — All data goes to same org
3. **Cannot onboard new customers** — Hardcoded to one org
4. **Service functions break** — No way to resolve org context

---

## Target Architecture

### 1. Organization Resolution Flow

```
User Login → Auth Context → organization_id from user.data
                              ↓
                    ProtectedRoute validates org_type
                              ↓
                    Pages/Components use user.organization_id
                              ↓
                    Backend functions get org from user context
```

### 2. Where organization_id Should Come From

| Context            | Source                                      | Example                                |
| ------------------ | ------------------------------------------- | -------------------------------------- |
| **Frontend**       | `useAuth().user.organization_id`            | `const { user } = useAuth();`          |
| **Frontend**       | `useAuth().organization`                    | Full org object                        |
| **Backend**        | `base44.auth.me()` → `user.organization_id` | `const user = await base44.auth.me();` |
| **Backend**        | Request context (service role)              | `base44.asServiceRole`                 |
| **Email Intake**   | From job_code → Job → organization_id       | Lookup via job                         |
| **Pool Intake**    | Default org for unassigned candidates       | Configurable default                   |
| **Scheduled Jobs** | Service role with explicit org_id           | Pass as parameter                      |

### 3. New Organization Onboarding

```javascript
// Step 1: Create Organization
const org = await base44.entities.Organization.create({
  name: "New Staffing Agency",
  org_type: "staffing_agency",
  status: "active",
  contact_email: "admin@agency.com",
  plan: "trial"
});

// Step 2: Create org_admin user
await base44.users.inviteUser("admin@agency.com", "admin");

// Step 3: Set user.data.organization_id
await base44.auth.updateMe({
  organization_id: org.id,
  org_type: "staffing_agency"
});

// Step 4: Create RoleTemplate + PermissionMatrix for org
await base44.entities.RoleTemplate.create({...});
await base44.entities.PermissionMatrix.create({...});
```

### 4. Backend Function Patterns

#### Pattern A: User-Context Functions (Most Common)

```javascript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req)
  const user = await base44.auth.me()

  if (!user || !user.organization_id) {
    return Response.json({ error: "Unauthorized: No organization context" }, { status: 401 })
  }

  const organizationId = user.organization_id

  // Use organizationId for all operations
  const candidates = await base44.entities.Candidate.filter({
    organization_id: organizationId,
  })
})
```

#### Pattern B: Service Role Functions (Admin/Scheduled)

```javascript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req)

  // For scheduled jobs or admin operations
  // organization_id must be passed explicitly or resolved from context
  const { organizationId } = await req.json()

  if (!organizationId) {
    return Response.json({ error: "organization_id required" }, { status: 400 })
  }

  // Use service role for elevated permissions
  const allCandidates = await base44.asServiceRole.entities.Candidate.filter({
    organization_id: organizationId,
  })
})
```

#### Pattern C: Email Intake (Job-Code Based)

```javascript
// Resolve organization from job_code
const job = await base44.asServiceRole.entities.Job.filter(
  {
    job_code: jobCode,
  },
  "",
  1,
)

if (!job.length) {
  return Response.json({ error: "Job not found" }, { status: 404 })
}

const organizationId = job[0].organization_id

// Create candidate with resolved organization_id
await base44.entities.Candidate.create({
  organization_id: organizationId,
  // ... rest of data
})
```

#### Pattern D: Pool Intake (Default Organization)

```javascript
// For general pool (no job_code)
// Option 1: Use platform-configured default org
const defaultOrgId = await getPlatformDefaultOrg(base44)

// Option 2: Require explicit organization_id from context
const user = await base44.auth.me()
const organizationId = user?.organization_id

// Option 3: Create "unassigned" pool with null organization_id (NOT RECOMMENDED)
// This breaks multi-tenant isolation - avoid!
```

---

## Migration Steps

### Phase 1: Preparation (Week 1)

1. **Create Platform Settings Entity**

   ```json
   {
     "name": "PlatformSettings",
     "properties": {
       "default_pool_organization_id": { "type": "string" },
       "onboarding_enabled": { "type": "boolean" },
       "max_organizations": { "type": "number" }
     }
   }
   ```

2. **Add Organization Onboarding UI**
   - Super admin dashboard → Create Organization
   - Auto-create RoleTemplate + PermissionMatrix
   - Invite org_admin user

3. **Update Auth Context**
   - Ensure `user.organization_id` is always populated
   - Add org loading to AuthContext
   - Handle orphaned users (no org)

### Phase 2: Backend Function Migration (Week 2)

**Priority Order**:

1. ✅ `emailIntakeHandler` — Resolve from job_code → Job → organization_id
2. ✅ `emailPoolIntakeHandler` — Use authenticated user's organization_id OR platform default
3. ✅ `processCandidateImport` — Use candidate.organization_id from payload
4. ✅ `createCandidateTimeline` — Use user.organization_id from context
5. ✅ `createApplicationTimeline` — Use user.organization_id from context
6. ✅ `sendCandidateToEmployer` — Use user.organization_id from context

**Migration Pattern**:

```javascript
// ❌ BEFORE
const TAASUKA_TOVA_ORG_ID = "6a0d7291e1bc86f20a5aef28"
await base44.entities.Candidate.create({
  organization_id: TAASUKA_TOVA_ORG_ID,
  // ...
})

// ✅ AFTER
const user = await base44.auth.me()
if (!user?.organization_id) {
  throw new Error("Unauthorized: No organization context")
}

await base44.entities.Candidate.create({
  organization_id: user.organization_id,
  // ...
})
```

### Phase 3: Frontend Migration (Week 3)

**Files to Update**:

- `pages/crm/CandidateListCRMPage.js` — Use `user.organization_id` from context
- `pages/agency/AgencyDashboard.js` — Use `user.organization_id` from context
- `pages/admin/CompensationPage.js` — Use `user.organization_id` from context
- All other pages — Remove hardcoded org_id references

**Pattern**:

```javascript
// ❌ BEFORE
const orgId = "6a0d7291e1bc86f20a5aef28"
const data = await base44.entities.Candidate.filter({
  organization_id: orgId,
})

// ✅ AFTER
const { user, organization } = useAuth()
const data = await base44.entities.Candidate.filter({
  organization_id: user.organization_id,
})
```

### Phase 4: RLS Cleanup (Week 4)

**Update `lib/rls-utils.js`**:

```javascript
// ❌ REMOVE
export const TAASUKA_TOVA_ORG_ID = '6a0d7291e1bc86f20a5aef28';

// ✅ UPDATE getRLSFilter to require organizationId
case 'org_admin': {
  if (!organizationId) return { id: '__BLOCKED__' };
  return getOrgFilter(entityName, organizationId, null, null, null, employerCompanyId, email);
}
```

**Remove Fallback Logic**:

```javascript
// ❌ REMOVE - No fallback to hardcoded org
const orgId = organization_id || TAASUKA_TOVA_ORG_ID

// ✅ REQUIRE - organization_id is mandatory
if (!organization_id) {
  throw new Error("organization_id is required")
}
```

### Phase 5: Testing & Validation (Week 5)

**Test Scenarios**:

1. ✅ Create new organization via super admin dashboard
2. ✅ Invite org_admin user to new org
3. ✅ Login as org_admin → Verify can only see own org data
4. ✅ Create candidate → Verify organization_id is set correctly
5. ✅ Email intake → Verify resolves org from job_code
6. ✅ Pool intake → Verify uses authenticated user's org
7. ✅ Multi-org isolation → User A cannot see User B's data

---

## Temporary Fallback Strategy

**During Migration Only** (remove after Phase 4):

```javascript
// lib/organization-context.js
export async function resolveOrganizationId(base44, fallbackOrgId = null) {
  // 1. Try user context
  const user = await base44.auth.me()
  if (user?.organization_id) {
    return user.organization_id
  }

  // 2. Try platform default (temporary for pool intake)
  if (fallbackOrgId) {
    return fallbackOrgId
  }

  // 3. Try to fetch from PlatformSettings
  try {
    const settings = await base44.asServiceRole.entities.PlatformSettings.list("", 1)
    if (settings.length > 0 && settings[0].default_pool_organization_id) {
      return settings[0].default_pool_organization_id
    }
  } catch (e) {
    // PlatformSettings not yet created
  }

  // 4. CRITICAL: No fallback - throw error
  throw new Error("Cannot resolve organization_id: No organization context available")
}
```

**Usage** (temporary, remove after migration):

```javascript
// emailPoolIntakeHandler.js
const organizationId = await resolveOrganizationId(base44, TAASUKA_TOVA_ORG_ID)

// After migration:
const organizationId = await resolveOrganizationId(base44) // No fallback!
```

---

## Success Criteria

- ✅ Zero hardcoded organization IDs in code
- ✅ New organizations can be onboarded via super admin dashboard
- ✅ All backend functions resolve organization_id from context
- ✅ RLS enforces organization isolation
- ✅ Multi-tenant isolation verified (org A cannot see org B data)
- ✅ Email intake correctly resolves org from job_code
- ✅ Pool intake uses authenticated user's org
- ✅ Performance improved (no org lookup overhead)

---

## Rollback Plan

If migration fails:

1. Revert to hardcoded `TAASUKA_TOVA_ORG_ID` in `lib/rls-utils.js`
2. Restore previous backend function versions
3. All data still has organization_id field (no data loss)
4. Resume migration after fixing issues

---

## Timeline

| Phase                       | Duration | Dependencies        |
| --------------------------- | -------- | ------------------- |
| Phase 1: Preparation        | Week 1   | None                |
| Phase 2: Backend Migration  | Week 2   | Phase 1 complete    |
| Phase 3: Frontend Migration | Week 3   | Phase 2 complete    |
| Phase 4: RLS Cleanup        | Week 4   | Phase 3 complete    |
| Phase 5: Testing            | Week 5   | All phases complete |

**Total**: 5 weeks to full multi-tenant SaaS architecture

---

## Notes

- **DO NOT remove hardcoded org_id until Phase 4** — Keep as fallback during migration
- **Test each phase thoroughly** before proceeding to next
- **Monitor AuditLog** for ownership validation failures during migration
- **Performance should improve** after migration (no hardcoded org lookups)

**This migration is critical for scaling beyond pilot.**
