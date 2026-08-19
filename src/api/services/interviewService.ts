import { ResourceService, ResourceQuery } from "./resourceService"

export type InterviewStatus =
  "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled"
export interface InterviewRecord {
  id: number
  application_id: number | null
  candidate_id: number | null
  job_id: number | null
  job_title: string | null
  candidate_name: string
  candidate_email: string | null
  date: string
  time: string
  duration_minutes: number
  type: "phone" | "video" | "in_person" | "technical" | "hr" | "final"
  status: InterviewStatus
  location_or_link: string | null
  [key: string]: unknown
}
export interface InterviewQuery extends ResourceQuery {
  sort?: "date"
  application_id?: number
  candidate_id?: number
  recruiter_id?: number
  team_manager_id?: number
  status?: InterviewStatus
  organization_id?: number
}
export interface CreateInterviewInput {
  application_id?: number | null
  candidate_id?: number | null
  job_id?: number | null
  job_title?: string | null
  candidate_name: string
  date: string
  time: string
  duration_minutes?: number
  type?: InterviewRecord["type"]
  stage?: "screening" | "first" | "second" | "third" | "technical" | "hr" | "final" | "offer"
  location_or_link?: string | null
  interviewer_name?: string | null
  interviewer_email?: string | null
  notes?: string | null
}
export interface UpdateInterviewInput extends Partial<CreateInterviewInput> {
  status?: InterviewStatus
  feedback?: string | null
  rating?: number | null
  recommendation?: "strong_yes" | "yes" | "maybe" | "no" | "strong_no" | null
  reminder_sent?: boolean
  candidate_confirmed?: boolean
}
export const interviewService = new ResourceService<
  InterviewRecord,
  InterviewQuery,
  CreateInterviewInput,
  UpdateInterviewInput
>("/interviews")
