import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const statusEnum = z.enum(['new','reviewed','phone_interview','recommended','employer_interview','offer','hired','probation','completed','rejected']);

export const CreateApplicationSchema = z.object({
  job_id: z.number().int(),
  candidate_id: z.number().int().optional().nullable(),
  job_title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  employer_company_id: z.number().int().optional().nullable(),
  recruiter_id: z.number().int().optional().nullable(),
  team_manager_id: z.number().int().optional().nullable(),
  recruitment_manager_id: z.number().int().optional().nullable(),
  candidate_name: z.string().min(1),
  candidate_email: z.string().email(),
  candidate_phone: z.string().optional().nullable(),
  resume_url: z.string().optional().nullable(),
  resume_filename: z.string().optional().nullable(),
  cover_letter: z.string().optional().nullable(),
  desired_salary_min: z.number().int().optional().nullable(),
  desired_salary_max: z.number().int().optional().nullable(),
  location: z.string().optional().nullable(),
  source: z.enum(['app','linkedin','facebook','jobsite','pool_assignment','email_intake','other']).optional(),
  status: statusEnum.optional().default('new'),
  notes: z.string().optional().nullable(),
  assigned_to: z.number().int().optional().nullable(),
});
export class CreateApplicationDto extends createZodDto(CreateApplicationSchema) {}

export const SubmitApplicationSchema = CreateApplicationSchema.pick({
  job_id: true,
  candidate_name: true,
  candidate_phone: true,
  resume_url: true,
  resume_filename: true,
  cover_letter: true,
  desired_salary_min: true,
  desired_salary_max: true,
  location: true,
}).extend({ candidate_name: z.string().min(1).optional() });
export class SubmitApplicationDto extends createZodDto(SubmitApplicationSchema) {}

export const AssignCandidateSchema = z.object({
  job_id: z.number().int(),
  candidate_id: z.number().int(),
});
export class AssignCandidateDto extends createZodDto(AssignCandidateSchema) {}

export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend({
  match_score: z.number().optional().nullable(),
  match_reason: z.string().optional().nullable(),
  internal_history: z.string().optional().nullable(),
  is_deleted: z.boolean().optional(),
  deleted_by: z.string().optional().nullable(),
});
export class UpdateApplicationDto extends createZodDto(UpdateApplicationSchema) {}

export const ChangeApplicationStatusSchema = z.object({ status: statusEnum });
export class ChangeApplicationStatusDto extends createZodDto(ChangeApplicationStatusSchema) {}

export const QueryApplicationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  job_id: z.coerce.number().int().optional(),
  candidate_id: z.coerce.number().int().optional(),
  candidate_email: z.string().email().optional(),
  status: statusEnum.optional(),
  recruiter_id: z.coerce.number().int().optional(),
  employer_company_id: z.coerce.number().int().optional(),
  organization_id: z.coerce.number().int().optional(),
  assigned_to: z.coerce.number().int().optional(),
  is_deleted: z.coerce.boolean().optional().default(false),
  search: z.string().optional(),
});
export class QueryApplicationsDto extends createZodDto(QueryApplicationsSchema) {}
