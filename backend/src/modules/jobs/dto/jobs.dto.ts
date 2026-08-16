import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── Create Job ───────────────────────────────────────────────────────────
export const CreateJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  company_initials: z.string().optional().nullable(),
  company_color: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  salary_min: z.number().int().optional().nullable(),
  salary_max: z.number().int().optional().nullable(),
  category: z.string().optional().nullable(),
  type: z.enum(['full', 'part', 'daily', 'remote']).default('full'),
  description: z.string().optional().nullable(),
  employer_company_id: z.number().int().optional().nullable(),
  recruiter_id: z.number().int().optional().nullable(),
  team_manager_id: z.number().int().optional().nullable(),
  recruitment_manager_id: z.number().int().optional().nullable(),
  domain_id: z.number().int().optional().nullable(),
  role_id: z.number().int().optional().nullable(),
  specialization_id: z.number().int().optional().nullable(),
  is_closed: z.boolean().optional().default(false),
  is_anonymous: z.boolean().optional().default(false),
  show_company_name: z.boolean().optional().default(true),
  show_company_info: z.boolean().optional().default(true),
  show_contact_details: z.boolean().optional().default(false),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  required_skills: z.array(z.string()).optional().nullable(),
  preferred_skills: z.array(z.string()).optional().nullable(),
  role_domain: z.string().optional().nullable(),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'manager', 'director', 'any']).optional(),
  years_experience_required: z.number().int().optional().nullable(),
  ai_keywords: z.array(z.string()).optional().nullable(),
  apply_url: z.string().optional().nullable(),
  external_id: z.string().optional().nullable(),
});
export class CreateJobDto extends createZodDto(CreateJobSchema) {}

// ─── Update Job ───────────────────────────────────────────────────────────
export const UpdateJobSchema = CreateJobSchema.partial().extend({
  views: z.number().int().optional(),
  applications_count: z.number().int().optional(),
  job_code: z.string().optional().nullable(),
  apply_email: z.string().optional().nullable(),
  is_deleted: z.boolean().optional(),
  deleted_by: z.string().optional().nullable(),
});
export class UpdateJobDto extends createZodDto(UpdateJobSchema) {}

// ─── Query Jobs ───────────────────────────────────────────────────────────
export const QueryJobsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.enum(['created_date', 'updated_date', 'views', 'title', 'company']).default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  search: z.string().optional(),
  organization_id: z.coerce.number().int().optional(),
  employer_company_id: z.coerce.number().int().optional(),
  recruiter_id: z.coerce.number().int().optional(),
  team_manager_id: z.coerce.number().int().optional(),
  domain_id: z.coerce.number().int().optional(),
  type: z.enum(['full', 'part', 'daily', 'remote']).optional(),
  is_closed: z.coerce.boolean().optional(),
  is_deleted: z.coerce.boolean().optional().default(false),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead', 'manager', 'director', 'any']).optional(),
  recommended_for: z.coerce.number().int().optional(),
});
export class QueryJobsDto extends createZodDto(QueryJobsSchema) {}

// ─── SavedJob ────────────────────────────────────────────────────────────
export const CreateSavedJobSchema = z.object({
  job_id: z.number().int(),
  job_title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
});
export class CreateSavedJobDto extends createZodDto(CreateSavedJobSchema) {}

// ─── JobAlert ────────────────────────────────────────────────────────────
export const CreateJobAlertSchema = z.object({
  keywords: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  job_type: z.string().optional().nullable(),
  salary_min: z.number().int().optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'instant']).optional(),
  is_active: z.boolean().optional().default(true),
});
export class CreateJobAlertDto extends createZodDto(CreateJobAlertSchema) {}
export const UpdateJobAlertSchema = CreateJobAlertSchema.partial();
export class UpdateJobAlertDto extends createZodDto(UpdateJobAlertSchema) {}
