/**
 * usePermissionMatrix
 * Loads the effective permission matrix for the current user's org.
 * Priority: org-specific override > default template for org_type.
 *
 * Usage:
 *   const { can, loading } = usePermissionMatrix();
 *   if (can('download_cv')) { ... }
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { httpClient } from '@/api/client/httpClient';
import { useAuth } from '@/lib/AuthContext';

// Roles that always have all permissions (bypass matrix)
const SUPER_ROLES = ['admin'];

// Map app roles → org_type for template lookup
const ROLE_TO_ORG_TYPE = {
  org_admin:            'staffing_agency',
  recruitment_manager:  'staffing_agency',
  team_manager:         'staffing_agency',
  recruiter:            'staffing_agency',
  hr_manager:           'organization',
  internal_recruiter:   'organization',
};

// Module-level cache: key = `${orgId}:${roleKey}` → permissions object
const _permCache = new Map();

export function invalidatePermissionMatrixCache({ organizationId, roleKey } = {}) {
  if (!organizationId && !roleKey) {
    _permCache.clear();
    return;
  }
  for (const key of _permCache.keys()) {
    const [cachedOrgId, cachedRoleKey] = key.split(':');
    if ((!organizationId || cachedOrgId === String(organizationId)) &&
        (!roleKey || cachedRoleKey === roleKey)) {
      _permCache.delete(key);
    }
  }
}

export function usePermissionMatrix() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (SUPER_ROLES.includes(user.role)) {
      setPermissions(_buildFullPermissions());
      setLoading(false);
      return;
    }
    loadPermissions(user);
  }, [user?.id, user?.role, user?.organization_id, user?.org_type]);

  const loadPermissions = async (user) => {
    if (loadingRef.current) return;
    const orgId = user.organization_id || null;
    const roleKey = user.role;
    const cacheKey = `${orgId}:${roleKey}`;

    // Return from cache if available
    if (_permCache.has(cacheKey)) {
      setPermissions(_permCache.get(cacheKey));
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    const orgType = user.org_type || ROLE_TO_ORG_TYPE[roleKey] || 'staffing_agency';

    // Filter by org — avoids loading all 200 records
    try {
      const [orgRecords, templateRecords] = await Promise.all([
        orgId
          ? httpClient.get(`/permission-matrices?organization_id=${encodeURIComponent(orgId)}&role_key=${encodeURIComponent(roleKey)}&limit=5`, { cache: false })
              .then(r => Array.isArray(r) ? r : (r?.data || []))
          : Promise.resolve([]),
        httpClient.get(`/permission-matrices?is_template=true&role_key=${encodeURIComponent(roleKey)}&org_type=${encodeURIComponent(orgType)}&limit=3`, { cache: false })
          .then(r => Array.isArray(r) ? r : (r?.data || [])),
      ]);

      const orgOverride = orgRecords.find(r => !r.is_template);
      const result = orgOverride?.permissions || templateRecords[0]?.permissions || _buildEmptyPermissions();

      _permCache.set(cacheKey, result);
      setPermissions(result);
    } catch {
      setPermissions(_buildEmptyPermissions());
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const can = useCallback((permKey) => {
    if (!permissions) return false;
    return !!permissions[permKey];
  }, [permissions]);

  const refresh = useCallback(() => {
    if (user) {
      invalidatePermissionMatrixCache({ organizationId: user.organization_id, roleKey: user.role });
      loadPermissions(user);
    }
  }, [user]);

  return { can, permissions, loading, refresh };
}

function _buildFullPermissions() {
  return {
    view: true, create: true, update: true, delete: true,
    export: true, download_cv: true, view_compensation: true,
    edit_compensation: true, manage_users: true, manage_settings: true
  };
}

function _buildEmptyPermissions() {
  return {
    view: false, create: false, update: false, delete: false,
    export: false, download_cv: false, view_compensation: false,
    edit_compensation: false, manage_users: false, manage_settings: false
  };
}
