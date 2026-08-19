import { httpClient } from "@/api/client/httpClient"
import { asList, buildQuery } from "./resourceService"
import type { PaginatedResponse } from "@/types/api"

export interface NotificationRecord {
  id: number
  type:
    | "new_application"
    | "interview_scheduled"
    | "message"
    | "job_closed"
    | "job_match"
    | "interview_reminder"
  title: string
  content: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_date: string
}

export type NotificationType = NotificationRecord["type"]

export const notificationService = {
  async list(
    query: { is_read?: boolean; type?: NotificationType; page?: number; limit?: number } = {},
  ): Promise<NotificationRecord[]> {
    const response = await httpClient.get<
      NotificationRecord[] | PaginatedResponse<NotificationRecord>
    >(`/notifications${buildQuery(query)}`, { cache: false })
    return asList(response)
  },
  markRead: (id: number) => httpClient.patch<NotificationRecord>(`/notifications/${id}/read`),
  markAllRead: () => httpClient.patch<void>("/notifications/read-all"),
  remove: (id: number) => httpClient.delete<void>(`/notifications/${id}`),
}
