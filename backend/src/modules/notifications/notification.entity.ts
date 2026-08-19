import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("notifications")
@Index(["organization_id"])
@Index(["recipient_email"])
@Index(["recipient_user_id"])
@Index(["is_read"])
export class NotificationEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "recipient_email", type: "varchar", length: 255 })
  recipient_email: string

  @Column({ name: "recipient_user_id", type: "int", nullable: true })
  recipient_user_id: number | null

  @Column({
    type: "enum",
    enum: [
      "new_application",
      "interview_scheduled",
      "message",
      "job_closed",
      "job_match",
      "interview_reminder",
    ],
  })
  type: string

  @Column({ type: "varchar", length: 255 })
  title: string

  @Column({ type: "text", nullable: true })
  content: string | null

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null

  @Column({ name: "is_read", type: "boolean", default: false })
  is_read: boolean
}
