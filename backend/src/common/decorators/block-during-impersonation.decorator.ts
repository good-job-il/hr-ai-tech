import { SetMetadata } from '@nestjs/common';

export const BLOCK_DURING_IMPERSONATION_KEY = 'blockDuringImpersonation';

/**
 * Marks a route as platform-only: an ADMIN who is currently "inside" an
 * organization's workspace (see /auth/organizations/:id/enter) may NOT call
 * it. Use on true super-admin actions (create/delete organizations, billing,
 * platform-wide user management, etc.) so an impersonation session can't be
 * (ab)used to reach outside the organization it was scoped to.
 *
 * Pair with NoImpersonationGuard.
 */
export const BlockDuringImpersonation = () => SetMetadata(BLOCK_DURING_IMPERSONATION_KEY, true);

