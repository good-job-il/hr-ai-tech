import { ResourceService, ResourceQuery } from "./resourceService"
export interface StaffRecord {
  id: number
  [key: string]: unknown
}
export const staffService = new ResourceService<StaffRecord, ResourceQuery>("/staff")
