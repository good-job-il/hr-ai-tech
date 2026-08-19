import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AssignRecruitmentWorkSchema = z.object({
  job_ids: z.array(z.number().int().positive()).max(500).default([]),
  candidate_ids: z.array(z.number().int().positive()).max(500).default([]),
  application_ids: z.array(z.number().int().positive()).max(500).default([]),
  team_id: z.number().int().positive().nullable().optional(),
  recruiter_id: z.number().int().positive().nullable().optional(),
  reason: z.string().trim().min(3).max(1000),
}).superRefine((value, context) => {
  if (!value.job_ids.length && !value.candidate_ids.length && !value.application_ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['job_ids'], message: 'At least one record is required' });
  }
  if (value.team_id === undefined && value.recruiter_id === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['team_id'], message: 'An assignment target is required' });
  }
});

export class AssignRecruitmentWorkDto extends createZodDto(AssignRecruitmentWorkSchema) {}
