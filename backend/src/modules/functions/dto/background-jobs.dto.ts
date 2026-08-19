import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const QueueCandidateImportSchema = z.object({
  file_url: z.string().url(),
  file_name: z.string().max(255).optional(),
  idempotency_key: z.string().min(8).max(120),
})
export class QueueCandidateImportDto extends createZodDto(QueueCandidateImportSchema) {}

export const QueueImportSourceSchema = z.object({
  idempotency_key: z.string().min(8).max(120),
})
export class QueueImportSourceDto extends createZodDto(QueueImportSourceSchema) {}

export const PreviewImportSourceSchema = z.object({
  url: z.string().url(),
  company_name: z.string().min(1).max(255).default("חברה"),
})
export class PreviewImportSourceDto extends createZodDto(PreviewImportSourceSchema) {}
