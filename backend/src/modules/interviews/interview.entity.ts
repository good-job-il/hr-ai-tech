import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("interviews")
@Index(["organization_id"])
@Index(["application_id"])
@Index(["candidate_id"])
@Index(["candidate_user_id"])
@Index(["recruiter_id"])
@Index(["team_id"])
export class InterviewEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "application_id", type: "int", nullable: true })
  application_id: number | null

  @Column({ name: "candidate_id", type: "int", nullable: true })
  candidate_id: number | null

  @Column({ name: "candidate_user_id", type: "int", nullable: true })
  candidate_user_id: number | null

  @Column({ name: "job_id", type: "int", nullable: true })
  job_id: number | null

  @Column({ name: "job_title", type: "varchar", length: 255, nullable: true })
  job_title: string | null

  @Column({ name: "employer_id", type: "varchar", length: 255, nullable: true })
  employer_id: string | null

  @Column({ name: "recruiter_id", type: "int", nullable: true })
  recruiter_id: number | null

  @Column({ name: "team_id", type: "int", nullable: true })
  team_id: number | null

  @Column({ name: "team_manager_id", type: "int", nullable: true })
  team_manager_id: number | null

  @Column({ name: "recruitment_manager_id", type: "int", nullable: true })
  recruitment_manager_id: number | null

  @Column({ name: "candidate_name", type: "varchar", length: 255 })
  candidate_name: string

  @Column({ name: "candidate_email", type: "varchar", length: 255, nullable: true })
  candidate_email: string | null

  @Column({ type: "date" })
  date: string

  @Column({ type: "varchar", length: 10 })
  time: string

  @Column({ name: "duration_minutes", type: "int", default: 45 })
  duration_minutes: number

  @Column({
    type: "enum",
    enum: ["phone", "video", "in_person", "technical", "hr", "final"],
    default: "video",
  })
  type: string

  @Column({
    type: "enum",
    enum: ["screening", "first", "second", "third", "technical", "hr", "final", "offer"],
    default: "first",
    nullable: true,
  })
  stage: string | null

  @Column({ name: "location_or_link", type: "text", nullable: true })
  location_or_link: string | null

  @Column({ name: "interviewer_name", type: "varchar", length: 255, nullable: true })
  interviewer_name: string | null

  @Column({ name: "interviewer_email", type: "varchar", length: 255, nullable: true })
  interviewer_email: string | null

  @Column({ type: "text", nullable: true })
  notes: string | null

  @Column({ type: "text", nullable: true })
  feedback: string | null

  @Column({ type: "decimal", precision: 3, scale: 1, nullable: true })
  rating: number | null

  @Column({ type: "enum", enum: ["strong_yes", "yes", "maybe", "no", "strong_no"], nullable: true })
  recommendation: string | null

  @Column({
    type: "enum",
    enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show", "rescheduled"],
    default: "scheduled",
  })
  status: string

  @Column({ name: "reminder_sent", type: "boolean", default: false })
  reminder_sent: boolean

  @Column({ name: "candidate_confirmed", type: "boolean", default: false })
  candidate_confirmed: boolean
}
