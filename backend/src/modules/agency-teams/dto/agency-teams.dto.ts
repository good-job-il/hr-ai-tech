import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const AgencyRole = z.enum(['org_admin', 'recruitment_manager', 'team_manager', 'recruiter']);

export class CreateAgencyTeamDto extends createZodDto(z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  manager_id: z.number().int().positive().optional().nullable(),
})) {}

export class UpdateAgencyTeamDto extends createZodDto(z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  manager_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional(),
})) {}

export class InviteAgencyMemberDto extends createZodDto(z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(2).max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  role: AgencyRole,
  team_id: z.number().int().positive().optional().nullable(),
})) {}

export class UpdateAgencyMemberDto extends createZodDto(z.object({
  full_name: z.string().trim().min(2).max(255).optional(),
  phone: z.string().trim().max(50).optional().nullable(),
  role: AgencyRole.optional(),
  team_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional(),
})) {}

export class AcceptAgencyInvitationDto extends createZodDto(z.object({
  token: z.string().min(32),
  password: z.string().min(8),
})) {}
