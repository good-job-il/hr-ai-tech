import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ROLES = [
  'candidate', 'employer', 'recruiter', 'team_manager',
  'recruitment_manager', 'org_admin', 'admin', 'super_admin',
  'hr_manager', 'internal_recruiter',
] as const;

// ─── Create User (admin only) ─────────────────────────────────────────────
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  full_name: z.string().min(1, { message: 'Full name is required' }),
  phone: z.string().optional(),
  role: z.enum(ROLES).default('candidate'),
  organization_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// ─── Update User ──────────────────────────────────────────────────────────
export const UpdateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(ROLES).optional(),
  organization_id: z.string().uuid().nullable().optional(),
  org_type: z.enum(['staffing_agency', 'organization']).nullable().optional(),
  team_manager_id: z.string().uuid().nullable().optional(),
  recruitment_manager_id: z.string().uuid().nullable().optional(),
  employer_company_id: z.string().uuid().nullable().optional(),
  display_role_name: z.string().optional(),
  is_active: z.boolean().optional(),
});
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

// ─── Query Users ──────────────────────────────────────────────────────────
export const QueryUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.string().default('created_date'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
  role: z.string().optional(),
  organization_id: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
export class QueryUsersDto extends createZodDto(QueryUsersSchema) {}

