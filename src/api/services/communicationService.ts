import { httpClient } from "@/api/client/httpClient"
import { asList, buildQuery } from "./resourceService"
import type { PaginatedResponse } from "@/types/api"

export interface CommunicationLogInput {
  candidate_id: number
  channel: "email" | "whatsapp" | "phone" | "sms" | "in_app" | "other"
  direction?: "inbound" | "outbound"
  subject?: string | null
  content: string
  status?: "sent" | "delivered" | "read" | "failed" | "pending"
  related_application_id?: number | null
  related_job_id?: number | null
}

export const communicationService = {
  async list(
    query: {
      candidate_id?: number
      channel?: CommunicationLogInput["channel"]
      limit?: number
    } = {},
  ) {
    const response = await httpClient.get<unknown[] | PaginatedResponse<unknown>>(
      `/communication-logs${buildQuery({ ...query, sort: "created_date", order: "DESC" })}`,
      { cache: false },
    )
    return asList(response)
  },
  create: (payload: CommunicationLogInput) => httpClient.post("/communication-logs", payload),
  presentCandidate: (candidate_id: number, job_id: number, recruiter_note?: string) =>
    httpClient.post<{ success: true; communication_log_id: number }>(
      "/communication-logs/present-candidate",
      {
        candidate_id,
        job_id,
        recruiter_note,
      },
    ),
}
