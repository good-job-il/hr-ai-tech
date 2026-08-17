import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const statusEnum = z.enum(['new', 'contacted', 'interview', 'offer', 'hired', 'rejected', 'inactive']);
const sourceEnum = z.enum(['import', 'manual', 'linkedin', 'upload', 'crawl', 'pool']);
const parsingStatusEnum = z.enum(['pending', 'success', 'partial', 'failed']);
const conversionStatusEnum = z.enum(['pending', 'success', 'failed']);

// ─── Create Candidate ─────────────────────────────────────────────────────
export const CreateCandidateSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  domain_id: z.number().int().optional().nullable(),
  domain_name: z.string().optional().nullable(),
  role_id: z.number().int().optional().nullable(),
  role_name: z.string().optional().nullable(),
  specialization_id: z.number().int().optional().nullable(),
  specialization_name: z.string().optional().nullable(),
  experience_years: z.number().optional().nullable(),
  desired_salary_min: z.number().int().optional().nullable(),
  desired_salary_max: z.number().int().optional().nullable(),
  resume_url: z.string().optional().nullable(),
  resume_filename: z.string().optional().nullable(),
  source: sourceEnum.optional(),
  status: statusEnum.optional().default('new'),
  recruiter_id: z.number().int().optional().nullable(),
  team_manager_id: z.number().int().optional().nullable(),
  recruitment_manager_id: z.number().int().optional().nullable(),
  employer_company_id: z.number().int().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  languages: z.array(z.string()).optional().nullable(),
  previous_companies: z.array(z.string()).optional().nullable(),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  import_batch_id: z.number().int().optional().nullable(),
  parsing_status: parsingStatusEnum.optional(),
  conversion_status: conversionStatusEnum.optional(),
  review_required: z.boolean().optional(),
});
export class CreateCandidateDto extends createZodDto(CreateCandidateSchema) {}

// ─── Update Candidate ─────────────────────────────────────────────────────
export const UpdateCandidateSchema = CreateCandidateSchema.partial().extend({
  is_deleted: z.boolean().optional(),
  deleted_by: z.string().optional().nullable(),
  data_quality_score: z.number().int().min(0).max(100).optional(),
  parsing_confidence: z.number().int().min(0).max(100).optional(),
  is_duplicate_suspected: z.boolean().optional(),
  duplicate_of_id: z.number().int().optional().nullable(),
  original_resume_url: z.string().optional().nullable(),
  converted_resume_url: z.string().optional().nullable(),
});
export class UpdateCandidateDto extends createZodDto(UpdateCandidateSchema) {}

// ─── Query Candidates ─────────────────────────────────────────────────────
export const QueryCandidatesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  search: z.string().optional(),
  status: statusEnum.optional(),
  domain_id: z.coerce.number().int().optional(),
  role_id: z.coerce.number().int().optional(),
  recruiter_id: z.coerce.number().int().optional(),
  team_manager_id: z.coerce.number().int().optional(),
  organization_id: z.coerce.number().int().optional(),
  is_deleted: z.coerce.boolean().optional().default(false),
  parsing_status: parsingStatusEnum.optional(),
  review_required: z.coerce.boolean().optional(),
  import_batch_id: z.coerce.number().int().optional(),
  active: z.coerce.boolean().optional(),
  in_pipeline: z.coerce.boolean().optional(),
});
export class QueryCandidatesDto extends createZodDto(QueryCandidatesSchema) {}

export const CreateCandidateImportBatchSchema = z.object({
  batch_name: z.string().min(1).max(255),
  source_file: z.string().max(500).optional().nullable(),
  file_type: z.enum(['csv', 'xlsx', 'json', 'zip']),
  employer_id: z.number().int().optional().nullable(),
  recruiter_id: z.number().int().optional().nullable(),
  team_manager_id: z.number().int().optional().nullable(),
  recruitment_manager_id: z.number().int().optional().nullable(),
  total_records: z.number().int().min(0).optional().default(0),
});
export class CreateCandidateImportBatchDto extends createZodDto(CreateCandidateImportBatchSchema) {}

// ─── Create Candidate Note ────────────────────────────────────────────────
export const CreateCandidateNoteSchema = z.object({
  content: z.string().min(1),
  visibility: z.enum(['private', 'team', 'all', 'internal']).default('team').optional(),
  is_pinned: z.boolean().optional().default(false),
  note_type: z.string().optional().nullable(),
  related_application_id: z.number().int().optional().nullable(),
  related_interview_id: z.number().int().optional().nullable(),
});
export class CreateCandidateNoteDto extends createZodDto(CreateCandidateNoteSchema) {}
export const UpdateCandidateNoteSchema = CreateCandidateNoteSchema.partial();
export class UpdateCandidateNoteDto extends createZodDto(UpdateCandidateNoteSchema) {}

// ─── Create Candidate Tag ─────────────────────────────────────────────────
export const CreateCandidateTagSchema = z.object({
  tag: z.string().min(1).max(100),
  color: z.string().optional().nullable(),
});
export class CreateCandidateTagDto extends createZodDto(CreateCandidateTagSchema) {}

// ─── Create Candidate Profile ─────────────────────────────────────────────
export const CreateCandidateProfileSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  experience_years: z.number().optional().nullable(),
  education: z.union([z.array(z.any()), z.string()]).optional().nullable(),
  experience: z.array(z.any()).optional().nullable(),
  desired_salary_min: z.number().int().optional().nullable(),
  desired_salary_max: z.number().int().optional().nullable(),
  job_type: z.string().optional().nullable(),
  categories: z.array(z.string()).optional().nullable(),
  is_public: z.boolean().optional().default(false),
  is_open_to_work: z.boolean().optional().default(false),
  resume_url: z.string().optional().nullable(),
});
export class CreateCandidateProfileDto extends createZodDto(CreateCandidateProfileSchema) {}
export const UpdateCandidateProfileSchema = CreateCandidateProfileSchema.partial();
export class UpdateCandidateProfileDto extends createZodDto(UpdateCandidateProfileSchema) {}

// ─── Create Candidate Document ────────────────────────────────────────────
export const CreateCandidateDocumentSchema = z.object({
  doc_type: z.string().min(1).default('cv'),
  filename: z.string().min(1),
  file_url: z.string().min(1),
  file_size: z.number().optional().nullable(),
  is_latest_cv: z.boolean().optional().default(false),
});
export class CreateCandidateDocumentDto extends createZodDto(CreateCandidateDocumentSchema) {}

export const CreateCandidateTimelineSchema = z.object({
  event_type: z.string().min(1).max(100),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional().nullable(),
  is_visible_to_candidate: z.boolean().optional().default(false),
  is_visible_to_employer: z.boolean().optional().default(false),
});
export class CreateCandidateTimelineDto extends createZodDto(CreateCandidateTimelineSchema) {}
