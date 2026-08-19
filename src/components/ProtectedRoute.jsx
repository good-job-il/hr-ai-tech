import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

// Roles that bypass all checks
const SUPER_ROLES = ["admin"]

/**
 * ProtectedRoute
 * Supports:
 * - requiredRoles: string[]   — user.role must be in list
 * - requiredOrgTypes: string[] — orgType must be in list ('staffing_agency' | 'organization')
 * - superAdminOnly: boolean   — only admin
 * Super roles bypass requiredRoles but NOT requiredOrgTypes (by design).
 */
export default function ProtectedRoute({
  requiredRoles = [],
  requiredOrgTypes = [],
  superAdminOnly = false,
  fallback = null,
  unauthenticatedElement = <Navigate to="/login" replace />,
  unauthorizedElement = <Navigate to="/unauthorized" replace />,
}) {
  const { user, isLoadingAuth, authError, orgType } = useAuth()

  if (isLoadingAuth) {
    return (
      fallback || (
        <div className="fixed inset-0 flex items-center justify-center bg-[#F7FBFF]">
          <div className="w-8 h-8 border-4 border-[#E4ECFF] border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      )
    )
  }

  if (authError || !user) return unauthenticatedElement

  const rawRole = user.role || user.user_type
  const effectiveRole = rawRole === "hiring_manager" ? "employer" : rawRole
  const isSuperAdmin = SUPER_ROLES.includes(effectiveRole)

  // superAdminOnly routes
  if (superAdminOnly && !isSuperAdmin) return unauthorizedElement

  // Role check (super admins bypass)
  if (requiredRoles.length > 0 && !isSuperAdmin && !requiredRoles.includes(effectiveRole)) {
    return unauthorizedElement
  }

  // OrgType check (never bypassed — even admin must be explicit)
  if (requiredOrgTypes.length > 0 && !requiredOrgTypes.includes(orgType)) {
    // Super admin has no org, allow them through org-type gates
    if (!isSuperAdmin) {
      console.warn("Blocked by orgType:", { user, orgType, requiredOrgTypes })
      return unauthorizedElement
    }
  }

  return <Outlet />
}
