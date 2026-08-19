import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const CreateImportSourceSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  url: z.string().url(),
  interval_hours: z.number().int().default(6),
  is_active: z.boolean().default(true),
})
export class CreateImportSourceDto extends createZodDto(CreateImportSourceSchema) {}

export const UpdateImportSourceSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  url: z.string().url().optional(),
  interval_hours: z.number().int().optional(),
  is_active: z.boolean().optional(),
  last_sync: z.coerce.date().optional().nullable(),
  last_sync_status: z.enum(["success", "error", "pending"]).optional(),
  last_error: z.string().optional().nullable(),
  jobs_added: z.number().int().optional(),
  jobs_updated: z.number().int().optional(),
  jobs_closed: z.number().int().optional(),
  logs: z.array(z.string()).optional().nullable(),
  retry_count: z.number().int().optional(),
  last_retry_attempt: z.coerce.date().optional().nullable(),
})
export class UpdateImportSourceDto extends createZodDto(UpdateImportSourceSchema) {}

export const QueryImportSourcesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  is_active: z.coerce.boolean().optional(),
})
export class QueryImportSourcesDto extends createZodDto(QueryImportSourcesSchema) {}
