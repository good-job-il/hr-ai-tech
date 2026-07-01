import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ─── createCompanyNotification ─────────────────────────────────────────────
export const CreateCompanyNotificationSchema = z.object({
  targetEmail: z.string().email(),
  type: z.enum(['new_application', 'interview_scheduled', 'message', 'job_closed', 'job_match', 'interview_reminder', 'candidate_sent']),
  title: z.string().min(1),
  content: z.string().optional().default(''),
  metadata: z.record(z.any()).optional().default({}),
});
export class CreateCompanyNotificationDto extends createZodDto(CreateCompanyNotificationSchema) {}

// ─── createApplicationTimeline ──────────────────────────────────────────────
export const CreateApplicationTimelineFnSchema = z.object({
  application_id: z.string(),
  event_type: z.enum([
    'submitted', 'status_changed', 'note_added', 'interview_scheduled',
    'interview_completed', 'offer_made', 'rejected', 'assigned', 'resume_viewed',
  ]),
  previous_value: z.string().optional().nullable(),
  new_value: z.string().optional().nullable(),
  description: z.string().min(1),
  performed_by_role: z.string().optional(),
  organization_id: z.string().optional().nullable(),
});
export class CreateApplicationTimelineFnDto extends createZodDto(CreateApplicationTimelineFnSchema) {}

// ─── createCandidateTimeline ─────────────────────────────────────────────────
export const CreateCandidateTimelineFnSchema = z.object({
  candidate_id: z.string().optional().nullable(),
  candidate_email: z.string().email(),
  event_type: z.string().min(1),
  description: z.string().min(1),
  metadata: z.record(z.any()).optional().default({}),
  organization_id: z.string().optional().nullable(),
});
export class CreateCandidateTimelineFnDto extends createZodDto(CreateCandidateTimelineFnSchema) {}

// ─── deleteCandidate ────────────────────────────────────────────────────────
export const DeleteCandidateFnSchema = z.object({
  candidate_id: z.string(),
});
export class DeleteCandidateFnDto extends createZodDto(DeleteCandidateFnSchema) {}

// ─── updateCompanyProfile ────────────────────────────────────────────────────
export const UpdateCompanyProfileFnSchema = z.object({
  companyEmail: z.string().email(),
  company_culture: z.string().optional().nullable(),
  benefits: z.array(z.string()).optional().nullable(),
  gallery_urls: z.array(z.string()).optional().nullable(),
  video_url: z.string().optional().nullable(),
  testimonials: z.array(z.record(z.any())).optional().nullable(),
});
export class UpdateCompanyProfileFnDto extends createZodDto(UpdateCompanyProfileFnSchema) {}

// ─── sendCandidateToEmployer ─────────────────────────────────────────────────
export const SendCandidateToEmployerSchema = z.object({
  candidateId: z.string(),
  to: z.string().email(),
  cc: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  recruiterNote: z.string().optional().nullable(),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email().optional().nullable(),
  jobId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  attachmentUrls: z
    .array(z.object({ url: z.string(), filename: z.string().optional(), doc_type: z.string().optional() }))
    .optional()
    .default([]),
});
export class SendCandidateToEmployerDto extends createZodDto(SendCandidateToEmployerSchema) {}

// ─── getJobRecommendations ───────────────────────────────────────────────────
export const GetJobRecommendationsSchema = z.object({
  job_id: z.string(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
export class GetJobRecommendationsDto extends createZodDto(GetJobRecommendationsSchema) {}

// ─── scoreApplication ────────────────────────────────────────────────────────
export const ScoreApplicationFnSchema = z.object({
  application_id: z.string(),
});
export class ScoreApplicationFnDto extends createZodDto(ScoreApplicationFnSchema) {}

// ─── smartSearch ─────────────────────────────────────────────────────────────
export const SmartSearchSchema = z.object({
  query: z.string().optional().default(''),
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
  type: z.enum(['search', 'autocomplete', 'recommendations']).optional().default('search'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export class SmartSearchDto extends createZodDto(SmartSearchSchema) {}

// ─── extractAndTranslateResume ───────────────────────────────────────────────
export const ExtractResumeFnSchema = z.object({
  file_url: z.string().url(),
  file_content_base64: z.string().optional().nullable(),
});
export class ExtractResumeFnDto extends createZodDto(ExtractResumeFnSchema) {}

// ─── importCandidatesFromFile ────────────────────────────────────────────────
export const ImportCandidatesFromFileSchema = z.object({
  fileUrl: z.string().url(),
  batchId: z.string(),
  fileName: z.string().optional(),
});
export class ImportCandidatesFromFileDto extends createZodDto(ImportCandidatesFromFileSchema) {}

// ─── createBulkCandidates ────────────────────────────────────────────────────
export const CreateBulkCandidatesSchema = z.object({
  candidates_data: z.array(z.record(z.any())).min(1),
  import_batch_id: z.string().optional().nullable(),
});
export class CreateBulkCandidatesDto extends createZodDto(CreateBulkCandidatesSchema) {}

// ─── validateImportBatch ─────────────────────────────────────────────────────
export const ValidateImportBatchSchema = z.object({
  import_batch_id: z.string(),
});
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
  batchId: z.string().optional().nullable(),
  employer_id: z.string().optional().default(''),
  recruiter_id: z.string().optional().nullable(),
});
export class ImportResumeFilesDto extends createZodDto(ImportResumeFilesSchema) {}

// ─── parseResumeBatch ────────────────────────────────────────────────────────
export const ParseResumeBatchSchema = z.object({
  zip_file_url: z.string().url(),
  import_batch_id: z.string().optional().nullable(),
  employer_id: z.string().optional().nullable(),
  recruiter_id: z.string().optional().nullable(),
  source: z.string().optional().default('import_zip'),
  initial_status: z.string().optional().default('new'),
});
export class ParseResumeBatchDto extends createZodDto(ParseResumeBatchSchema) {}

// ─── crawlCareerPage ──────────────────────────────────────────────────────────
export const CrawlCareerPageSchema = z.object({
  url: z.string().url(),
  source_id: z.string().optional().nullable(),
  company_name: z.string().optional().default('חברה'),
});
export class CrawlCareerPageDto extends createZodDto(CrawlCareerPageSchema) {}

