import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const ClientStatus = z.enum(["prospect", "active", "inactive", "archived"])
const MutableClientStatus = z.enum(["prospect", "active", "inactive"])

export const CreateAgencyClientSchema = z
  .object({
    company_id: z.number().int().optional().nullable(),
    name: z.string().trim().min(1).optional(),
    industry: z.string().trim().optional().nullable(),
    initials: z.string().max(5).optional().nullable(),
    color: z.string().max(20).optional().nullable(),
    logo_url: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    status: MutableClientStatus.optional().default("active"),
    account_manager_id: z.number().int().optional().nullable(),
    contact_name: z.string().optional().nullable(),
    contact_email: z.string().email().optional().nullable(),
    contact_phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    contract_type: z.string().optional().nullable(),
    contract_start_date: z.string().optional().nullable(),
    contract_end_date: z.string().optional().nullable(),
    placement_fee_percent: z.number().min(0).max(100).optional().nullable(),
    payment_terms_days: z.number().int().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (!value.company_id && !value.name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Client name is required when company_id is not provided",
      })
    }
  })
export class CreateAgencyClientDto extends createZodDto(CreateAgencyClientSchema) {}

export const UpdateAgencyClientSchema = z.object({
  name: z.string().trim().min(1).optional(),
  industry: z.string().trim().optional().nullable(),
  initials: z.string().max(5).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  logo_url: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  status: MutableClientStatus.optional(),
  account_manager_id: z.number().int().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contract_type: z.string().optional().nullable(),
  contract_start_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  placement_fee_percent: z.number().min(0).max(100).optional().nullable(),
  payment_terms_days: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})
export class UpdateAgencyClientDto extends createZodDto(UpdateAgencyClientSchema) {}

export const QueryAgencyClientsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  search: z.string().optional(),
  status: ClientStatus.optional(),
  industry: z.string().optional(),
})
export class QueryAgencyClientsDto extends createZodDto(QueryAgencyClientsSchema) {}
