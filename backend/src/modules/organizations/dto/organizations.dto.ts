import { z } from "zod"
import { createZodDto } from "nestjs-zod"

// ─── Create ───────────────────────────────────────────────────────────────
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1),
  org_type: z.enum(["staffing_agency", "organization"]),
  status: z.enum(["active", "suspended", "inactive"]).default("active"),
  settings: z.record(z.any()).optional(),
  plan: z.enum(["trial", "starter", "pro", "enterprise"]).default("trial"),
  contact_email: z.string().email().optional(),
  logo_url: z.string().url().optional(),
})
export class CreateOrganizationDto extends createZodDto(CreateOrganizationSchema) {}

// ─── Update ───────────────────────────────────────────────────────────────
export const UpdateOrganizationSchema = CreateOrganizationSchema.partial()
export class UpdateOrganizationDto extends createZodDto(UpdateOrganizationSchema) {}

// ─── Self-service onboarding (org_admin, no organization yet) ─────────────
export const OnboardAgencySchema = z.object({
  name: z.string().min(1),
  contact_email: z.string().email().optional(),
  logo_url: z.string().url().optional(),
})
export class OnboardAgencyDto extends createZodDto(OnboardAgencySchema) {}

// ─── Query ────────────────────────────────────────────────────────────────
export const QueryOrganizationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sort: z.enum(["created_date", "updated_date", "name", "status", "plan"]).default("created_date"),
  order: z.enum(["ASC", "DESC"]).default("DESC"),
  org_type: z.enum(["staffing_agency", "organization"]).optional(),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  search: z.string().optional(),
})
export class QueryOrganizationsDto extends createZodDto(QueryOrganizationsSchema) {}
