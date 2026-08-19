import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("candidate_import_batches")
@Index(["organization_id"])
@Index(["team_id"])
@Index(["imported_by"])
@Index(["status"])
export class CandidateImportBatchEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "batch_name", type: "varchar", length: 255 })
  batch_name: string

  @Column({ name: "source_file", type: "varchar", length: 500, nullable: true })
  source_file: string | null

  @Column({ name: "file_type", type: "varchar", length: 20 })
  file_type: string

  @Column({ name: "imported_by", type: "varchar", length: 255 })
  imported_by: string

  @Column({ name: "employer_id", type: "int", nullable: true })
  employer_id: number | null

  @Column({ name: "recruiter_id", type: "int", nullable: true })
  recruiter_id: number | null

  @Column({ name: "team_id", type: "int", nullable: true })
  team_id: number | null

  @Column({ name: "team_manager_id", type: "int", nullable: true })
  team_manager_id: number | null

  @Column({ name: "recruitment_manager_id", type: "int", nullable: true })
  recruitment_manager_id: number | null

  @Column({ name: "total_records", type: "int", default: 0 })
  total_records: number

  @Column({ name: "successful_imports", type: "int", default: 0 })
  successful_imports: number

  @Column({ name: "failed_imports", type: "int", default: 0 })
  failed_imports: number

  @Column({ name: "duplicate_found", type: "int", default: 0 })
  duplicate_found: number

  @Column({ name: "review_required", type: "int", default: 0 })
  review_required: number

  @Column({ name: "missing_email", type: "int", default: 0 })
  missing_email: number

  @Column({ name: "missing_phone", type: "int", default: 0 })
  missing_phone: number

  @Column({ name: "missing_role", type: "int", default: 0 })
  missing_role: number

  @Column({ name: "missing_resume", type: "int", default: 0 })
  missing_resume: number

  @Column({ name: "conversion_failures", type: "int", default: 0 })
  conversion_failures: number

  @Column({ name: "parsing_failures", type: "int", default: 0 })
  parsing_failures: number

  @Column({
    type: "enum",
    enum: ["pending", "processing", "in_progress", "completed", "failed", "partial"],
    default: "pending",
  })
  status: string

  @Column({ name: "error_log", type: "json", nullable: true })
  error_log: any[] | null

  @Column({ name: "processing_started_at", type: "datetime", nullable: true })
  processing_started_at: Date | null

  @Column({ name: "processing_completed_at", type: "datetime", nullable: true })
  processing_completed_at: Date | null

  @Column({ type: "text", nullable: true })
  summary: string | null
}
