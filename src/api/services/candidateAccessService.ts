import { ResourceService, ResourceQuery } from "./resourceService"

export interface CandidateAccessRecord {
  id: number
  is_active?: boolean
  [key: string]: unknown
}
export const candidateAccessService = new ResourceService<CandidateAccessRecord, ResourceQuery>(
  "/candidates/access",
)
