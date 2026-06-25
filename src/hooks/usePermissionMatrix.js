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
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Roles that always have all permissions (bypass matrix)
const SUPER_ROLES = ['admin', 'super_admin'];

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
  }, [user?.id, user?.role]);

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
    const orgType = ROLE_TO_ORG_TYPE[roleKey] || 'staffing_agency';

    // Filter by org — avoids loading all 200 records
    const [orgRecords, templateRecords] = await Promise.all([
      orgId
        ? base44.entities.PermissionMatrix.filter({ organization_id: orgId, role_key: roleKey }, '', 5)
        : Promise.resolve([]),
      base44.entities.PermissionMatrix.filter({ is_template: true, role_key: roleKey, org_type: orgType }, '', 3),
    ]);

    const orgOverride = orgRecords.find(r => !r.is_template);
    const result = orgOverride?.permissions || templateRecords[0]?.permissions || _buildEmptyPermissions();

    _permCache.set(cacheKey, result);
    setPermissions(result);
    setLoading(false);
    loadingRef.current = false;
  };

  const can = useCallback((permKey) => {
    if (!permissions) return false;
    return !!permissions[permKey];
  }, [permissions]);

  const refresh = useCallback(() => {
    if (user) {
      const cacheKey = `${user.organization_id || null}:${user.role}`;
      _permCache.delete(cacheKey);
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