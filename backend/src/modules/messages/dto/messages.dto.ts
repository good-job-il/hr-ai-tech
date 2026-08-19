import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const CreateMessageSchema = z.object({
  application_id: z.number().int(),
  content: z.string().min(1),
})
export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}

export const UpdateMessageSchema = z.object({ is_read: z.boolean() })
export class UpdateMessageDto extends createZodDto(UpdateMessageSchema) {}

export const QueryMessagesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  sort: z.enum(["created_date"]).default("created_date"),
  order: z.enum(["ASC", "DESC"]).default("ASC"),
  application_id: z.coerce.number().int().optional(),
  is_read: z.coerce.boolean().optional(),
})
export class QueryMessagesDto extends createZodDto(QueryMessagesSchema) {}
