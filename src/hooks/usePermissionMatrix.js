/**
 * usePermissionMatrix
 * Loads the effective permission matrix for the current user's org.
 * Priority: org-specific override > default template for org_type.
 *
 * Usage:
 *   const { can, loading } = usePermissionMatrix();
 *   if (can('download_cv')) { ... }
 */
import { useState, useEffect, useCallback, useRef } from "react"
import { effectivePermissionService } from "@/api/services/permissionService"
import { useAuth } from "@/lib/AuthContext"

// Roles that always have all permissions (bypass matrix)
const SUPER_ROLES = ["admin"]

// Module-level cache: key = `${orgId}:${roleKey}` → permissions object
const _permCache = new Map()

export function invalidatePermissionMatrixCache({ organizationId, roleKey } = {}) {
  if (!organizationId && !roleKey) {
    _permCache.clear()
  } else {
    for (const key of _permCache.keys()) {
      const [cachedOrgId, cachedRoleKey] = key.split(":")
      if (
        (!organizationId || cachedOrgId === String(organizationId)) &&
        (!roleKey || cachedRoleKey === roleKey)
      ) {
        _permCache.delete(key)
      }
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("effective-permissions-invalidated", {
        detail: { organizationId, roleKey },
      }),
    )
  }
}

export function usePermissionMatrix() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (SUPER_ROLES.includes(user.role) && !user.impersonating) {
      setPermissions(_buildFullPermissions())
      setLoading(false)
      return
    }
    loadPermissions(user)
  }, [user?.id, user?.role, user?.organization_id, user?.org_type])

  useEffect(() => {
    if (!user) return undefined
    const reloadIfRelevant = (event) => {
      const { organizationId, roleKey } = event.detail || {}
      if (
        (!organizationId || String(organizationId) === String(user.organization_id)) &&
        (!roleKey || roleKey === user.role)
      ) {
        loadPermissions(user, { bypassCache: true })
      }
    }
    window.addEventListener("effective-permissions-invalidated", reloadIfRelevant)
    return () => window.removeEventListener("effective-permissions-invalidated", reloadIfRelevant)
  }, [user?.id, user?.role, user?.organization_id])

  const loadPermissions = async (user, { bypassCache = false } = {}) => {
    if (loadingRef.current) return
    const orgId = user.organization_id || null
    const roleKey = user.role
    const cacheKey = `${orgId}:${roleKey}`

    // Return from cache if available
    if (!bypassCache && _permCache.has(cacheKey)) {
      setPermissions(_permCache.get(cacheKey))
      setLoading(false)
      return
    }

    loadingRef.current = true
    setLoading(true)
    try {
      const effective = await effectivePermissionService.get()
      const result = effective.permissions || _buildEmptyPermissions()

      _permCache.set(cacheKey, result)
      setPermissions(result)
    } catch {
      setPermissions(_buildEmptyPermissions())
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const can = useCallback(
    (permKey) => {
      if (!permissions) return false
      return !!permissions[permKey]
    },
    [permissions],
  )

  const refresh = useCallback(() => {
    if (user) {
      invalidatePermissionMatrixCache({ organizationId: user.organization_id, roleKey: user.role })
      loadPermissions(user)
    }
  }, [user])

  return { can, permissions, loading, refresh }
}

function _buildFullPermissions() {
  return {
    view: true,
    create: true,
    update: true,
    delete: true,
    export: true,
    download_cv: true,
    view_compensation: true,
    edit_compensation: true,
    manage_users: true,
    manage_settings: true,
  }
}

function _buildEmptyPermissions() {
  return {
    view: false,
    create: false,
    update: false,
    delete: false,
    export: false,
    download_cv: false,
    view_compensation: false,
    edit_compensation: false,
    manage_users: false,
    manage_settings: false,
  }
}
