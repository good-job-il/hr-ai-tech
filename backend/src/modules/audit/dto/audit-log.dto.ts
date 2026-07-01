import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AUDIT_ENTITY_TYPES, AUDIT_ACTIONS } from '../audit-log.entity';

export const CreateAuditLogSchema = z.object({
  organization_id: z.string().optional().nullable(),
  actor_user_id: z.string().optional().nullable(),
  actor_email: z.string().email().optional().nullable(),
  actor_role: z.string().optional().nullable(),
  entity_type: z.enum(AUDIT_ENTITY_TYPES),
  entity_id: z.string(),
  entity_label: z.string().optional().nullable(),
  action: z.enum(AUDIT_ACTIONS),
  metadata: z.record(z.any()).optional().nullable(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
});
export class CreateAuditLogDto extends createZodDto(CreateAuditLogSchema) {}

export const QueryAuditLogsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  entity_type: z.enum(AUDIT_ENTITY_TYPES).optional(),
  entity_id: z.string().optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  actor_user_id: z.string().optional(),
});
export class QueryAuditLogsDto extends createZodDto(QueryAuditLogsSchema) {}

