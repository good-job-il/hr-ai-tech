import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("import_sources")
@Index(["is_active"])
export class ImportSourceEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string

  @Column({ type: "varchar", length: 100, nullable: true })
  provider: string | null

  @Column({ type: "text" })
  url: string

  @Column({ name: "interval_hours", type: "int", default: 6 })
  interval_hours: number

  @Column({ name: "is_active", type: "boolean", default: true })
  is_active: boolean

  @Column({ name: "last_sync", type: "datetime", nullable: true })
  last_sync: Date | null

  @Column({
    name: "last_sync_status",
    type: "enum",
    enum: ["success", "error", "pending"],
    default: "pending",
  })
  last_sync_status: string

  @Column({ name: "last_error", type: "text", nullable: true })
  last_error: string | null

  @Column({ name: "jobs_added", type: "int", default: 0 })
  jobs_added: number

  @Column({ name: "jobs_updated", type: "int", default: 0 })
  jobs_updated: number

  @Column({ name: "jobs_closed", type: "int", default: 0 })
  jobs_closed: number

  @Column({ type: "json", nullable: true })
  logs: string[] | null

  @Column({ name: "retry_count", type: "int", default: 0 })
  retry_count: number

  @Column({ name: "last_retry_attempt", type: "datetime", nullable: true })
  last_retry_attempt: Date | null
}
