import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const ConnectIntegrationSchema = z.object({
  scopes: z.array(z.string().min(1)).max(20).optional(),
})
export class ConnectIntegrationDto extends createZodDto(ConnectIntegrationSchema) {}
