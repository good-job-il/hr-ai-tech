import { httpClient } from "@/api/client/httpClient"

export interface IntegrationConnection {
  provider: string
  name: string
  feature_available: boolean
  required_scopes: string[]
  status: "pending" | "connected" | "error" | "disconnected"
  scopes: string[]
  external_account_label: string | null
  last_sync_at: string | null
  last_sync_status: "success" | "error" | null
  last_error: string | null
  connected_at: string | null
}

export const integrationConnectionService = {
  list: () => httpClient.get<IntegrationConnection[]>("/integration-connections", { cache: false }),
  connect: (provider: string) =>
    httpClient.post<{ authorization_url: string }>(
      `/integration-connections/${provider}/connect`,
      {},
    ),
  reconnect: (provider: string) =>
    httpClient.post<{ authorization_url: string }>(
      `/integration-connections/${provider}/reconnect`,
      {},
    ),
  disconnect: (provider: string) => httpClient.delete(`/integration-connections/${provider}`),
}
