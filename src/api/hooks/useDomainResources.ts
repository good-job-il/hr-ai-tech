import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  agencyClientService,
  type AgencyClientQuery,
  type CreateAgencyClientInput,
  type UpdateAgencyClientInput,
} from "../services/agencyClientService"
import {
  applicationService,
  type ApplicationQuery,
  type CreateApplicationInput,
  type UpdateApplicationInput,
} from "../services/applicationService"
import {
  candidateService,
  type CandidateQuery,
  type CreateCandidateInput,
  type UpdateCandidateInput,
} from "../services/candidateService"
import {
  jobService,
  type JobQuery,
  type CreateJobInput,
  type UpdateJobInput,
} from "../services/jobService"
import { queryKeys } from "../queryKeys"

export function useJobs(query: JobQuery = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list(query),
    queryFn: () => jobService.listPage(query),
  })
}

export function useJob(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id ?? "missing"),
    queryFn: () => jobService.get(id!),
    enabled: id !== undefined,
  })
}

export function useJobMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.jobs.all })
  return {
    create: useMutation({
      mutationFn: (payload: CreateJobInput) => jobService.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: UpdateJobInput }) =>
        jobService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number | string) => jobService.remove(id),
      onSuccess: invalidate,
    }),
  }
}

export function useCandidates(query: CandidateQuery = {}) {
  return useQuery({
    queryKey: queryKeys.candidates.list(query),
    queryFn: () => candidateService.listPage(query),
  })
}

export function useCandidate(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.candidates.detail(id ?? "missing"),
    queryFn: () => candidateService.get(id!),
    enabled: id !== undefined,
  })
}

export function useCandidateMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.candidates.all })
  return {
    create: useMutation({
      mutationFn: (payload: CreateCandidateInput) => candidateService.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: UpdateCandidateInput }) =>
        candidateService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number | string) => candidateService.remove(id),
      onSuccess: invalidate,
    }),
  }
}

export function useApplications(query: ApplicationQuery = {}) {
  return useQuery({
    queryKey: queryKeys.applications.list(query),
    queryFn: () => applicationService.listPage(query),
  })
}

export function useApplication(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id ?? "missing"),
    queryFn: () => applicationService.get(id!),
    enabled: id !== undefined,
  })
}

export function useApplicationMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.applications.all })
  return {
    create: useMutation({
      mutationFn: (payload: CreateApplicationInput) => applicationService.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: UpdateApplicationInput }) =>
        applicationService.update(id, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number | string) => applicationService.remove(id),
      onSuccess: invalidate,
    }),
  }
}

export function useAgencyClients(query: AgencyClientQuery = {}) {
  return useQuery({
    queryKey: queryKeys.agencyClients.list(query),
    queryFn: () => agencyClientService.listPage(query),
  })
}

export function useAgencyClient(id: number | string | undefined) {
  return useQuery({
    queryKey: queryKeys.agencyClients.detail(id ?? "missing"),
    queryFn: () => agencyClientService.get(id!),
    enabled: id !== undefined,
  })
}

export function useAgencyClientMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.agencyClients.all })
  return {
    create: useMutation({
      mutationFn: (payload: CreateAgencyClientInput) => agencyClientService.create(payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: UpdateAgencyClientInput }) =>
        agencyClientService.update(id, payload),
      onSuccess: invalidate,
    }),
    archive: useMutation({
      mutationFn: (id: number | string) => agencyClientService.archive(id),
      onSuccess: invalidate,
    }),
  }
}
