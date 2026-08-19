import type { AgencyClientQuery } from "./services/agencyClientService"
import type { ApplicationQuery } from "./services/applicationService"
import type { CandidateQuery } from "./services/candidateService"
import type { JobQuery } from "./services/jobService"

function resourceKeys<TQuery extends object>(scope: string) {
  const all = [scope] as const
  return {
    all,
    lists: () => [...all, "list"] as const,
    list: (query: TQuery = {} as TQuery) => [...all, "list", query] as const,
    details: () => [...all, "detail"] as const,
    detail: (id: number | string) => [...all, "detail", id] as const,
  }
}

export const queryKeys = {
  auth: ["auth"] as const,
  organizations: resourceKeys<Record<string, unknown>>("organizations"),
  users: resourceKeys<Record<string, unknown>>("users"),
  audit: resourceKeys<Record<string, unknown>>("audit-logs"),
  permissionMatrices: resourceKeys<Record<string, unknown>>("permission-matrices"),
  roleTemplates: resourceKeys<Record<string, unknown>>("role-templates"),
  taxonomy: ["taxonomy"] as const,
  agencyClients: resourceKeys<AgencyClientQuery>("agency-clients"),
  jobs: resourceKeys<JobQuery>("jobs"),
  candidates: resourceKeys<CandidateQuery>("candidates"),
  applications: resourceKeys<ApplicationQuery>("applications"),
} as const
