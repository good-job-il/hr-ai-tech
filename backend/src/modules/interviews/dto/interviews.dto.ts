import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateInterviewSchema = z.object({
  application_id: z.string().uuid().optional().nullable(),
  candidate_id: z.string().uuid().optional().nullable(),
  job_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().nullable(),
  employer_id: z.string().optional().nullable(),
  recruiter_id: z.string().optional().nullable(),
  candidate_name: z.string().min(1),
  candidate_email: z.string().email().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  duration_minutes: z.number().int().optional().default(45),
  type: z.enum(['phone', 'video', 'in_person', 'technical', 'hr', 'final']).optional().default('video'),
  stage: z.enum(['screening', 'first', 'second', 'third', 'technical', 'hr', 'final', 'offer']).optional(),
  location_or_link: z.string().optional().nullable(),
  interviewer_name: z.string().optional().nullable(),
  interviewer_email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional().default('scheduled'),
});
export class CreateInterviewDto extends createZodDto(CreateInterviewSchema) {}

export const UpdateInterviewSchema = CreateInterviewSchema.partial().extend({
  feedback: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().nullable(),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']).optional().nullable(),
  reminder_sent: z.boolean().optional(),
  candidate_confirmed: z.boolean().optional(),
});
export class UpdateInterviewDto extends createZodDto(UpdateInterviewSchema) {}

export const QueryInterviewsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('date'),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  application_id: z.string().uuid().optional(),
  candidate_id: z.string().uuid().optional(),
  recruiter_id: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled']).optional(),
  organization_id: z.string().uuid().optional(),
});
export class QueryInterviewsDto extends createZodDto(QueryInterviewsSchema) {}

