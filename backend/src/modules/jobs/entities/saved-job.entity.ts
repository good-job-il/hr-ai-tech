import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("saved_jobs")
@Index(["user_id"])
@Index(["user_email"])
@Index(["job_id"])
export class SavedJobEntity extends BaseEntity {
  @Column({ name: "user_id", type: "int", nullable: true })
  user_id: number | null

  @Column({ name: "user_email", type: "varchar", length: 255 })
  user_email: string

  @Column({ name: "job_id", type: "int" })
  job_id: number

  @Column({ name: "job_title", type: "varchar", length: 255, nullable: true })
  job_title: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  company: string | null
}
