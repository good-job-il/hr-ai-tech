export const queryKeys = {
  auth: ['auth'] as const,
  organizations: (query: Record<string, unknown> = {}) => ['organizations', query] as const,
  users: (query: Record<string, unknown> = {}) => ['users', query] as const,
  audit: (query: Record<string, unknown> = {}) => ['audit-logs', query] as const,
  permissionMatrices: (query: Record<string, unknown> = {}) => ['permission-matrices', query] as const,
  roleTemplates: (query: Record<string, unknown> = {}) => ['role-templates', query] as const,
  taxonomy: ['taxonomy'] as const,
  agencyClients: (query: Record<string, unknown> = {}) => ['agency-clients', query] as const,
  jobs: (query: Record<string, unknown> = {}) => ['jobs', query] as const,
  candidates: (query: Record<string, unknown> = {}) => ['candidates', query] as const,
  applications: (query: Record<string, unknown> = {}) => ['applications', query] as const,
};
