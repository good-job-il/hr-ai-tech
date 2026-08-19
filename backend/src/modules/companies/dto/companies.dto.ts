import { z } from "zod"
import { createZodDto } from "nestjs-zod"

// ─── Company ──────────────────────────────────────────────────────────────
export const CreateCompanySchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional().nullable(),
  initials: z.string().max(5).optional().nullable(),
  color: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
})
export class CreateCompanyDto extends createZodDto(CreateCompanySchema) {}
export const UpdateCompanySchema = CreateCompanySchema.partial().extend({
  job_count: z.number().int().optional(),
  is_deleted: z.boolean().optional(),
  deleted_by: z.number().int().optional().nullable(),
})
export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
export const QueryCompaniesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.enum(["name", "created_date", "job_count"]).default("name"),
  order: z.enum(["ASC", "DESC"]).default("ASC"),
  search: z.string().optional(),
  industry: z.string().optional(),
  is_deleted: z.coerce.boolean().optional().default(false),
})
export class QueryCompaniesDto extends createZodDto(QueryCompaniesSchema) {}

// ─── Company Review ───────────────────────────────────────────────────────
export const CreateCompanyReviewSchema = z.object({
  company_id: z.number().int(),
  company_name: z.string().optional().nullable(),
  rating_overall: z.number().min(1).max(5),
  rating_salary: z.number().min(1).max(5).optional().nullable(),
  rating_management: z.number().min(1).max(5).optional().nullable(),
  rating_worklife: z.number().min(1).max(5).optional().nullable(),
  title: z.string().optional().nullable(),
  pros: z.string().optional().nullable(),
  cons: z.string().optional().nullable(),
  is_anonymous: z.boolean().optional().default(false),
})
export class CreateCompanyReviewDto extends createZodDto(CreateCompanyReviewSchema) {}

// ─── Staff ────────────────────────────────────────────────────────────────
export const CreateStaffSchema = z.object({
  company_id: z.string(),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  role: z.enum(["hiring_manager", "team_manager", "recruiter"]),
  manager_email: z.string().email().optional().nullable(),
})
export class CreateStaffDto extends createZodDto(CreateStaffSchema) {}
export const UpdateStaffSchema = CreateStaffSchema.partial()
export class UpdateStaffDto extends createZodDto(UpdateStaffSchema) {}
