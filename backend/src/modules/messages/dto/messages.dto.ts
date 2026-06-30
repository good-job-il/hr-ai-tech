import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateMessageSchema = z.object({
  application_id: z.string().uuid(),
  sender_email: z.string().email(),
  sender_role: z.enum(['employer', 'candidate', 'recruiter']).optional().nullable(),
  content: z.string().min(1),
  is_read: z.boolean().optional().default(false),
});
export class CreateMessageDto extends createZodDto(CreateMessageSchema) {}

export const UpdateMessageSchema = z.object({ is_read: z.boolean() });
export class UpdateMessageDto extends createZodDto(UpdateMessageSchema) {}

export const QueryMessagesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  application_id: z.string().uuid().optional(),
  sender_email: z.string().optional(),
  is_read: z.coerce.boolean().optional(),
});
export class QueryMessagesDto extends createZodDto(QueryMessagesSchema) {}

