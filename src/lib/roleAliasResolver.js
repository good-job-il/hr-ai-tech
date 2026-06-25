import { base44 } from '@/api/base44Client';

let cachedAliases = null;
let cachedRoles = null;

/**
 * Resolve a role name (or alias) to the canonical role
 * e.g., "SDR", "Backend Engineer", "Frontend Developer" → canonical role name
 */
export async function resolveRoleAlias(roleNameOrAlias) {
  if (!roleNameOrAlias) return null;

  // Load aliases if not cached
  if (!cachedAliases) {
    try {
      cachedAliases = await base44.entities.RoleAlias.list('-created_date', 1000);
    } catch {
      return null;
    }
  }

  const normalized = roleNameOrAlias.toLowerCase().trim();

  // First, check if it's an alias
  const aliasMatch = cachedAliases.find(
    a => a.alias.toLowerCase() === normalized
  );
  if (aliasMatch?.canonical_role) {
    return aliasMatch.canonical_role;
  }

  // Otherwise, return as-is (assume it's already canonical)
  return roleNameOrAlias;
}

/**
 * Resolve a role name to its entity
 */
export async function resolveRoleEntity(roleNameOrAlias) {
  if (!roleNameOrAlias) return null;

  // Load roles if not cached
  if (!cachedRoles) {
    try {
      cachedRoles = await base44.entities.Role.list('-role_id', 1000);
    } catch {
      return null;
    }
  }

  // Resolve alias to canonical name
  const canonicalName = await resolveRoleAlias(roleNameOrAlias);

  // Find matching role
  return cachedRoles.find(r => r.name === canonicalName);
}

/**
 * Clear cache (call after taxonomy updates)
 */
export function clearRoleAliasCache() {
  cachedAliases = null;
  cachedRoles = null;
}