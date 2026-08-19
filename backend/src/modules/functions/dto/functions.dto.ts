import { z } from "zod"
import { createZodDto } from "nestjs-zod"

// ─── getJobRecommendations ───────────────────────────────────────────────────
export const GetJobRecommendationsSchema = z.object({
  job_id: z.number().int(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
})
export class GetJobRecommendationsDto extends createZodDto(GetJobRecommendationsSchema) {}

// ─── smartSearch ─────────────────────────────────────────────────────────────
export const SmartSearchSchema = z.object({
  query: z.string().optional().default(""),
  filters: z
    .object({
      type: z.array(z.string()).optional(),
      location: z.string().optional(),
      category: z.array(z.string()).optional(),
      salary_min: z.coerce.number().optional(),
      salary_max: z.coerce.number().optional(),
    })
    .optional()
    .default({}),
  type: z.enum(["search", "autocomplete", "recommendations"]).optional().default("search"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export class SmartSearchDto extends createZodDto(SmartSearchSchema) {}

// ─── extractAndTranslateResume ───────────────────────────────────────────────
export const ExtractResumeFnSchema = z.object({
  file_url: z.string().url(),
})
export class ExtractResumeFnDto extends createZodDto(ExtractResumeFnSchema) {}

// ─── importCandidatesFromFile ────────────────────────────────────────────────
export const ImportCandidatesFromFileSchema = z.object({
  fileUrl: z.string().url(),
  batchId: z.number().int().optional().nullable(),
  fileName: z.string().optional(),
  retryFailedOnly: z.boolean().optional().default(false),
})
export class ImportCandidatesFromFileDto extends createZodDto(ImportCandidatesFromFileSchema) {}

// ─── createBulkCandidates ────────────────────────────────────────────────────
export const CreateBulkCandidatesSchema = z.object({
  candidates_data: z
    .array(
      z.object({
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
        skills: z.array(z.string()).optional().nullable(),
        languages: z.array(z.string()).optional().nullable(),
        previous_companies: z.array(z.string()).optional().nullable(),
        summary: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        recruiter_id: z.number().int().optional().nullable(),
        team_manager_id: z.number().int().optional().nullable(),
        recruitment_manager_id: z.number().int().optional().nullable(),
        employer_company_id: z.number().int().optional().nullable(),
        data_quality_score: z.number().int().min(0).max(100).optional(),
        parsing_confidence: z.number().int().min(0).max(100).optional(),
        review_required: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(500),
  import_batch_id: z.number().int().optional().nullable(),
})
export class CreateBulkCandidatesDto extends createZodDto(CreateBulkCandidatesSchema) {}

// ─── validateImportBatch ─────────────────────────────────────────────────────
export const ValidateImportBatchSchema = z.object({
  import_batch_id: z.number().int(),
})
export class ValidateImportBatchDto extends createZodDto(ValidateImportBatchSchema) {}

// ─── importResumeFiles ───────────────────────────────────────────────────────
export const ImportResumeFilesSchema = z.object({
  files: z.array(
    z.object({
      file_url: z.string().url(),
      filename: z.string().optional(),
      file_size: z.number().optional(),
    }),
  ),
  batchId: z.number().int().optional().nullable(),
  employer_id: z.number().int().optional().nullable(),
  recruiter_id: z.number().int().optional().nullable(),
})
export class ImportResumeFilesDto extends createZodDto(ImportResumeFilesSchema) {}

// ─── parseResumeBatch ────────────────────────────────────────────────────────
export const ParseResumeBatchSchema = z.object({
  zip_file_url: z.string().url(),
  import_batch_id: z.number().int().optional().nullable(),
  employer_id: z.number().int().optional().nullable(),
  recruiter_id: z.number().int().optional().nullable(),
  source: z.string().optional().default("import_zip"),
  initial_status: z.string().optional().default("new"),
})
export class ParseResumeBatchDto extends createZodDto(ParseResumeBatchSchema) {}

// ─── crawlCareerPage ──────────────────────────────────────────────────────────
export const CrawlCareerPageSchema = z.object({
  url: z.string().url(),
  source_id: z.number().int().optional().nullable(),
  company_name: z.string().optional().default("חברה"),
})
export class CrawlCareerPageDto extends createZodDto(CrawlCareerPageSchema) {}
