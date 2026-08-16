import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AUDIT_ENTITY_TYPES, AUDIT_ACTIONS } from '../audit-log.entity';

export const CreateAuditLogSchema = z.object({
  entity_type: z.enum(AUDIT_ENTITY_TYPES),
  entity_id: z.number().int(),
  entity_label: z.string().optional().nullable(),
  action: z.enum(AUDIT_ACTIONS),
  metadata: z.record(z.any()).optional().nullable(),
});
export class CreateAuditLogDto extends createZodDto(CreateAuditLogSchema) {}

export const QueryAuditLogsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.enum(['created_date', 'entity_type', 'action', 'actor_email']).default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  entity_type: z.enum(AUDIT_ENTITY_TYPES).optional(),
  entity_id: z.coerce.number().int().optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  actor_user_id: z.coerce.number().int().optional(),
});
export class QueryAuditLogsDto extends createZodDto(QueryAuditLogsSchema) {}
