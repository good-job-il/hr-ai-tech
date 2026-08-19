import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("communication_logs")
@Index(["organization_id"])
@Index(["candidate_id"])
export class CommunicationLogEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "candidate_id", type: "int" })
  candidate_id: number

  @Column({ name: "candidate_email", type: "varchar", length: 255, nullable: true })
  candidate_email: string | null

  @Column({
    type: "enum",
    enum: ["email", "whatsapp", "phone", "sms", "in_app", "other"],
    default: "email",
  })
  channel: string

  @Column({ type: "enum", enum: ["inbound", "outbound"], default: "outbound" })
  direction: string

  @Column({ name: "sender_email", type: "varchar", length: 255 })
  sender_email: string

  @Column({ name: "sender_name", type: "varchar", length: 255, nullable: true })
  sender_name: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  subject: string | null

  @Column({ type: "text" })
  content: string

  @Column({
    type: "enum",
    enum: ["sent", "delivered", "read", "failed", "pending"],
    default: "sent",
  })
  status: string

  @Column({ name: "related_application_id", type: "int", nullable: true })
  related_application_id: number | null

  @Column({ name: "related_job_id", type: "int", nullable: true })
  related_job_id: number | null
}

@Entity("employer_timelines")
@Index(["employer_email"])
export class EmployerTimelineEntity extends BaseEntity {
  @Column({ name: "employer_email", type: "varchar", length: 255 })
  employer_email: string

  @Column({
    name: "event_type",
    type: "enum",
    enum: [
      "account_created",
      "job_posted",
      "application_received",
      "candidate_viewed",
      "status_changed",
      "note_added",
      "team_member_added",
      "setting_changed",
      "import_completed",
    ],
  })
  event_type: string

  @Column({ type: "text" })
  description: string

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null
}
