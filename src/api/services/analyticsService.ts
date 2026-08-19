import { httpClient } from "@/api/client/httpClient"

export const analyticsService = {
  dashboard: () => httpClient.get("/analytics/dashboard", { cache: false }),
}
