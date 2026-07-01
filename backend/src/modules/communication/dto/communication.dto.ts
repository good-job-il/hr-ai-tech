import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── CommunicationLog ───────────────────────────────────────────────────────
export const CreateCommunicationLogSchema = z.object({
  organization_id: z.string().optional().nullable(),
  candidate_id: z.string(),
  candidate_email: z.string().email().optional().nullable(),
  channel: z.enum(['email', 'whatsapp', 'phone', 'sms', 'in_app', 'other']).default('email'),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  sender_email: z.string().email(),
  sender_name: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  content: z.string().min(1),
  status: z.enum(['sent', 'delivered', 'read', 'failed', 'pending']).default('sent'),
  related_application_id: z.string().optional().nullable(),
  related_job_id: z.string().optional().nullable(),
});
export class CreateCommunicationLogDto extends createZodDto(CreateCommunicationLogSchema) {}

export const QueryCommunicationLogsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  candidate_id: z.string().optional(),
  channel: z.enum(['email', 'whatsapp', 'phone', 'sms', 'in_app', 'other']).optional(),
});
export class QueryCommunicationLogsDto extends createZodDto(QueryCommunicationLogsSchema) {}

// ─── EmployerTimeline ───────────────────────────────────────────────────────
export const CreateEmployerTimelineSchema = z.object({
  employer_email: z.string().email(),
  event_type: z.enum([
    'account_created', 'job_posted', 'application_received', 'candidate_viewed',
    'status_changed', 'note_added', 'team_member_added', 'setting_changed', 'import_completed',
  ]),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional().nullable(),
});
export class CreateEmployerTimelineDto extends createZodDto(CreateEmployerTimelineSchema) {}

export const QueryEmployerTimelineSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  employer_email: z.string().email(),
});
export class QueryEmployerTimelineDto extends createZodDto(QueryEmployerTimelineSchema) {}

