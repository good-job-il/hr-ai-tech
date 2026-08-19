import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("candidate_timelines")
@Index(["candidate_id"])
@Index(["organization_id"])
export class CandidateTimelineEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "candidate_id", type: "int" })
  candidate_id: number

  @Column({ name: "candidate_email", type: "varchar", length: 255, nullable: true })
  candidate_email: string | null

  @Column({ name: "event_type", type: "varchar", length: 100 })
  event_type: string

  @Column({ type: "text" })
  description: string

  @Column({ name: "performed_by", type: "varchar", length: 255, nullable: true })
  performed_by: string | null

  @Column({ name: "performed_by_name", type: "varchar", length: 255, nullable: true })
  performed_by_name: string | null

  @Column({ name: "performed_by_role", type: "varchar", length: 100, nullable: true })
  performed_by_role: string | null

  @Column({ type: "json", nullable: true })
  metadata: Record<string, any> | null

  @Column({ name: "is_visible_to_candidate", type: "boolean", default: false })
  is_visible_to_candidate: boolean

  @Column({ name: "is_visible_to_employer", type: "boolean", default: false })
  is_visible_to_employer: boolean
}
