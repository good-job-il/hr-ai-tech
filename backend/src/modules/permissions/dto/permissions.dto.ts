import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const OrgTypeEnum = z.enum(['staffing_agency', 'organization']);

// ─── PermissionMatrix ───────────────────────────────────────────────────────
export const PermissionSetSchema = z.object({
  view: z.boolean().default(false),
  create: z.boolean().default(false),
  update: z.boolean().default(false),
  delete: z.boolean().default(false),
  export: z.boolean().default(false),
  download_cv: z.boolean().default(false),
  view_compensation: z.boolean().default(false),
  edit_compensation: z.boolean().default(false),
  manage_users: z.boolean().default(false),
  manage_settings: z.boolean().default(false),
});

export const CreatePermissionMatrixSchema = z.object({
  organization_id: z.number().int().optional().nullable(),
  org_type: OrgTypeEnum.optional().nullable(),
  role_key: z.string().min(1),
  is_template: z.boolean().default(false),
  permissions: PermissionSetSchema,
});
export class CreatePermissionMatrixDto extends createZodDto(CreatePermissionMatrixSchema) {}

export const UpdatePermissionMatrixSchema = CreatePermissionMatrixSchema.partial();
export class UpdatePermissionMatrixDto extends createZodDto(UpdatePermissionMatrixSchema) {}

export const QueryPermissionMatricesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  organization_id: z.coerce.number().int().optional(),
  org_type: OrgTypeEnum.optional(),
  role_key: z.string().optional(),
  is_template: z.coerce.boolean().optional(),
});
export class QueryPermissionMatricesDto extends createZodDto(QueryPermissionMatricesSchema) {}

// ─── RoleTemplate ───────────────────────────────────────────────────────────
export const CreateRoleTemplateSchema = z.object({
  organization_id: z.number().int().optional().nullable(),
  org_type: OrgTypeEnum,
  system_role_key: z.string().min(1),
  display_name: z.string().min(1),
  parent_role_key: z.string().optional().nullable(),
  hierarchy_level: z.number().int().optional().nullable(),
  is_editable_name: z.boolean().default(true),
  is_system_required: z.boolean().default(true),
  permissions_template_id: z.number().int().optional().nullable(),
  is_active: z.boolean().default(true),
});
export class CreateRoleTemplateDto extends createZodDto(CreateRoleTemplateSchema) {}

export const UpdateRoleTemplateSchema = CreateRoleTemplateSchema.partial();
export class UpdateRoleTemplateDto extends createZodDto(UpdateRoleTemplateSchema) {}

export const QueryRoleTemplatesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  organization_id: z.coerce.number().int().optional(),
  org_type: OrgTypeEnum.optional(),
});
export class QueryRoleTemplatesDto extends createZodDto(QueryRoleTemplatesSchema) {}

// ─── RoleAlias ──────────────────────────────────────────────────────────────
export const CreateRoleAliasSchema = z.object({
  alias: z.string().min(1),
  canonical_role: z.string().min(1),
});
export class CreateRoleAliasDto extends createZodDto(CreateRoleAliasSchema) {}

// ─── UserPositionAccess ─────────────────────────────────────────────────────
export const CreateUserPositionAccessSchema = z.object({
  company_email: z.string().email(),
  user_email: z.string().email(),
  user_name: z.string().optional().nullable(),
  user_type: z.enum(['team_manager', 'recruiter']),
  position_ids: z.array(z.number().int()).optional().nullable(),
  can_review_applications: z.boolean().default(true),
  can_schedule_interviews: z.boolean().default(true),
  can_send_messages: z.boolean().default(true),
});
export class CreateUserPositionAccessDto extends createZodDto(CreateUserPositionAccessSchema) {}

export const UpdateUserPositionAccessSchema = CreateUserPositionAccessSchema.partial();
export class UpdateUserPositionAccessDto extends createZodDto(UpdateUserPositionAccessSchema) {}

// ─── Position ───────────────────────────────────────────────────────────────
export const CreatePositionSchema = z.object({
  company_email: z.string().email(),
  title: z.string().min(1),
  department: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  required_experience: z.number().int().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  salary_min: z.number().int().optional().nullable(),
  salary_max: z.number().int().optional().nullable(),
  is_active: z.boolean().default(true),
});
export class CreatePositionDto extends createZodDto(CreatePositionSchema) {}

export const UpdatePositionSchema = CreatePositionSchema.partial();
export class UpdatePositionDto extends createZodDto(UpdatePositionSchema) {}

export const QueryPositionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  company_email: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});
export class QueryPositionsDto extends createZodDto(QueryPositionsSchema) {}
