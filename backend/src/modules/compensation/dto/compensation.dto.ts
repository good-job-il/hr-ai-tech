import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const CompTypeEnum = z.enum(["fixed", "percent"])

export const CreateCompensationPlanSchema = z.object({
  job_id: z.number().int().optional().nullable(),
  employer_company_id: z.number().int().optional().nullable(),
  agency_client_id: z.number().int().optional().nullable(),
  total_fee: z.number().optional().nullable(),
  warranty_period_days: z.number().int().default(30),
  recruiter_id: z.number().int().optional().nullable(),
  team_manager_id: z.number().int().optional().nullable(),
  recruitment_manager_id: z.number().int().optional().nullable(),
  recruiter_compensation: z.number().optional().nullable(),
  recruiter_compensation_type: CompTypeEnum.default("percent"),
  team_manager_compensation: z.number().optional().nullable(),
  team_manager_compensation_type: CompTypeEnum.default("percent"),
  recruitment_manager_compensation: z.number().optional().nullable(),
  recruitment_manager_compensation_type: CompTypeEnum.default("percent"),
  notes: z.string().optional().nullable(),
})
export class CreateCompensationPlanDto extends createZodDto(CreateCompensationPlanSchema) {}

export const UpdateCompensationPlanSchema = CreateCompensationPlanSchema.partial()
export class UpdateCompensationPlanDto extends createZodDto(UpdateCompensationPlanSchema) {}

export const QueryCompensationPlansSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z
    .enum(["created_date", "updated_date", "client_name", "total_fee"])
    .default("created_date"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
  job_id: z.coerce.number().int().optional(),
  employer_company_id: z.coerce.number().int().optional(),
  recruiter_id: z.coerce.number().int().optional(),
})
export class QueryCompensationPlansDto extends createZodDto(QueryCompensationPlansSchema) {}
