import { useAuth } from "@/lib/AuthContext"

// Roles that bypass all checks
const SUPER_ROLES = ["admin"]

/**
 * ProtectedRoute
 * Supports:
 * - requiredRoles: string[]   — user.role must be in list
 * - requiredOrgTypes: string[] — orgType must be in list ('staffing_agency' | 'organization')
 * - superAdminOnly: boolean   — only admin
 * - noOrgRedirect: string     — if an org_admin has no organization yet
 *   (blocking the orgType check below), send them here to onboard instead
 *   of showing "unauthorized" (e.g. '/agency/onboarding').
 * Super roles bypass role checks only. Tenant routes still require an explicit
 * scoped organization context; a platform session is never implicit tenancy.
 */
export default function ProtectedRoute({
  requiredRoles = [],
  requiredOrgTypes = [],
  superAdminOnly = false,
  noOrgRedirect = null,
  fallback = null,
  unauthenticatedElement = <Navigate to="/login" replace />,
  unauthorizedElement = <Navigate to="/unauthorized" replace />,
}) {
  const { user, isLoadingAuth, authError, orgType, organization } = useAuth()

  if (isLoadingAuth) {
    return (
      fallback || (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]">
          <div className="w-8 h-8 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      )
    )
  }

  if (authError || !user) {
    return unauthenticatedElement
  }

  const rawRole = user.role || user.user_type

  const effectiveRole = rawRole === "hiring_manager" ? "employer" : rawRole

  const isSuperAdmin = SUPER_ROLES.includes(effectiveRole)

  // superAdminOnly routes
  if (superAdminOnly && !isSuperAdmin) {
    return unauthorizedElement
  }

  // Role check (super admins bypass)
  if (requiredRoles.length > 0 && !isSuperAdmin && !requiredRoles.includes(effectiveRole)) {
    return unauthorizedElement
  }

  // OrgType check is never bypassed. Platform admins need a future explicit
  // impersonation/scoped session before entering a tenant workspace.
  if (requiredOrgTypes.length > 0 && !requiredOrgTypes.includes(orgType)) {
    // An org_admin with no organization row yet isn't "unauthorized" —
    // they just haven't onboarded. Send them to create their org instead.
    if (!organization && noOrgRedirect && effectiveRole === "org_admin") {
      return <Navigate to={noOrgRedirect} replace />
    }

    return unauthorizedElement
  }

  return <Outlet />
}
import { Navigate, Outlet } from "react-router-dom"
