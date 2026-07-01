import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateSalaryDataSchema = z.object({
  job_title: z.string().min(1),
  category: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  salary_avg: z.number().int().optional().nullable(),
  salary_min: z.number().int().optional().nullable(),
  salary_max: z.number().int().optional().nullable(),
  sample_count: z.number().int().default(0),
  year: z.number().int().optional().nullable(),
});
export class CreateSalaryDataDto extends createZodDto(CreateSalaryDataSchema) {}

export const UpdateSalaryDataSchema = CreateSalaryDataSchema.partial();
export class UpdateSalaryDataDto extends createZodDto(UpdateSalaryDataSchema) {}

export const QuerySalaryDataSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  job_title: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
});
export class QuerySalaryDataDto extends createZodDto(QuerySalaryDataSchema) {}

