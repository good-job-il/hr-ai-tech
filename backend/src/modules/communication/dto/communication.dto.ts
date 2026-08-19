import { z } from "zod"
import { createZodDto } from "nestjs-zod"

// ─── CommunicationLog ───────────────────────────────────────────────────────
export const CreateCommunicationLogSchema = z.object({
  candidate_id: z.number().int(),
  channel: z.enum(["email", "whatsapp", "phone", "sms", "in_app", "other"]).default("email"),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  subject: z.string().optional().nullable(),
  content: z.string().min(1),
  status: z.enum(["sent", "delivered", "read", "failed", "pending"]).default("sent"),
  related_application_id: z.number().int().optional().nullable(),
  related_job_id: z.number().int().optional().nullable(),
})
export class CreateCommunicationLogDto extends createZodDto(CreateCommunicationLogSchema) {}

export const QueryCommunicationLogsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default("created_date"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
  candidate_id: z.coerce.number().int().optional(),
  channel: z.enum(["email", "whatsapp", "phone", "sms", "in_app", "other"]).optional(),
})
export class QueryCommunicationLogsDto extends createZodDto(QueryCommunicationLogsSchema) {}

export const PresentCandidateSchema = z.object({
  candidate_id: z.number().int(),
  job_id: z.number().int(),
  recruiter_note: z.string().max(4000).optional().nullable(),
})
export class PresentCandidateDto extends createZodDto(PresentCandidateSchema) {}

// ─── EmployerTimeline ───────────────────────────────────────────────────────
export const CreateEmployerTimelineSchema = z.object({
  employer_email: z.string().email(),
  event_type: z.enum([
    "account_created",
    "job_posted",
    "application_received",
    "candidate_viewed",
    "status_changed",
    "note_added",
    "team_member_added",
    "setting_changed",
    "import_completed",
  ]),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional().nullable(),
})
export class CreateEmployerTimelineDto extends createZodDto(CreateEmployerTimelineSchema) {}

export const QueryEmployerTimelineSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  employer_email: z.string().email(),
})
export class QueryEmployerTimelineDto extends createZodDto(QueryEmployerTimelineSchema) {}
