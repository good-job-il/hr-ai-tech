import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── Send Email ─────────────────────────────────────────────────────────────
export const SendEmailSchema = z.object({
  to: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().default(''),
  from_name: z.string().optional(),
});
export class SendEmailDto extends createZodDto(SendEmailSchema) {}

// ─── Invoke LLM ─────────────────────────────────────────────────────────────
export const InvokeLLMSchema = z.object({
  prompt: z.string().min(1),
  response_json_schema: z.record(z.any()).optional(),
  model: z.string().optional(),
});
export class InvokeLLMDto extends createZodDto(InvokeLLMSchema) {}

