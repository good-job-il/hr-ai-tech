import { httpClient } from '@/api/client/httpClient';
import { asList, asPage, buildQuery, ResourceQuery } from './resourceService';
import type { PaginatedResponse } from '@/types/api';

export const AUDIT_ENTITY_TYPES = [
  'Candidate', 'Application', 'Job', 'Company', 'CandidateDocument',
  'CompensationPlan', 'User', 'Organization', 'Interview', 'CommunicationLog',
  'AgencyTeam', 'AgencyInvitation', 'PermissionMatrix', 'RoleTemplate', 'Billing', 'Integration',
] as const;

export const AUDIT_ACTIONS = [
  'view', 'create', 'update', 'delete', 'cv_download', 'cv_view',
  'status_change', 'send_to_employer', 'export', 'compensation_change',
  'login', 'impersonate', 'restore', 'role_display_name_update', 'permission_update',
  'deactivate', 'resend', 'cancel',
] as const;

export type AuditEntityType = typeof AUDIT_ENTITY_TYPES[number];
export type AuditAction = typeof AUDIT_ACTIONS[number];

export interface AuditRecord {
  id: number;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  entity_type: AuditEntityType;
  entity_id: number;
  entity_label: string | null;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_date: string;
  updated_date: string;
}

export interface AuditQuery extends ResourceQuery {
  sort?: 'created_date' | 'entity_type' | 'action' | 'actor_email';
  entity_type?: AuditEntityType;
  entity_id?: number;
  action?: AuditAction;
  actor_user_id?: number;
  actor_email?: string;
  date_from?: string;
  date_to?: string;
}

// Actor and tenant identity are deliberately absent: the backend derives them
// from the authenticated request and rejects browser-authored attribution.
export interface CreateAuditInput {
  entity_type: AuditEntityType;
  entity_id: number;
  entity_label?: string | null;
  action: AuditAction;
  metadata?: Record<string, unknown> | null;
}

export const auditService = {
  async list(query: AuditQuery = {}): Promise<AuditRecord[]> {
    return asList(await this.listPage(query));
  },
  async listPage(query: AuditQuery = {}): Promise<PaginatedResponse<AuditRecord>> {
    const response = await httpClient.get<AuditRecord[] | PaginatedResponse<AuditRecord>>(
      `/audit-logs${buildQuery(query)}`,
      { cache: false },
    );
    return asPage(response);
  },
  create: (payload: CreateAuditInput) => httpClient.post<AuditRecord>('/audit-logs', payload),
};
