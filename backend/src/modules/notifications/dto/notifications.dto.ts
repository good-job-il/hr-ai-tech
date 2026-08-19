import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const CreateNotificationSchema = z.object({
  organization_id: z.number().int().optional().nullable(),
  recipient_email: z.string().email(),
  type: z.enum([
    "new_application",
    "interview_scheduled",
    "message",
    "job_closed",
    "job_match",
    "interview_reminder",
  ]),
  title: z.string().min(1),
  content: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  is_read: z.boolean().optional().default(false),
})
export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}

export const QueryNotificationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(20),
  sort: z.enum(["created_date"]).default("created_date"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
  is_read: z.coerce.boolean().optional(),
  type: z.string().optional(),
})
export class QueryNotificationsDto extends createZodDto(QueryNotificationsSchema) {}
