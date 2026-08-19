import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const ManagementReportQuerySchema = z.object({
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  client_id: z.coerce.number().int().positive().optional(),
  job_id: z.coerce.number().int().positive().optional(),
  recruiter_id: z.coerce.number().int().positive().optional(),
  team_id: z.coerce.number().int().positive().optional(),
})

export class ManagementReportQueryDto extends createZodDto(ManagementReportQuerySchema) {}
