import { ResourceService, ResourceQuery } from './resourceService';

export interface AuditRecord { id: number; action: string; created_date?: string; [key: string]: unknown }
export const auditService = new ResourceService<AuditRecord, ResourceQuery>('/audit-logs');
