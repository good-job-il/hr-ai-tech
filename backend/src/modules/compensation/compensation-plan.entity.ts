import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("compensation_plans")
@Index(["organization_id"])
@Index(["job_id"])
@Index(["employer_company_id"])
@Index(["agency_client_id"])
export class CompensationPlanEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "job_id", type: "int", nullable: true })
  job_id: number | null

  @Column({ name: "employer_company_id", type: "int", nullable: true })
  employer_company_id: number | null

  @Column({ name: "agency_client_id", type: "int", nullable: true })
  agency_client_id: number | null

  /** Display-only snapshot. Relationships use employer_company_id/agency_client_id. */
  @Column({ name: "client_name", type: "varchar", length: 255 })
  client_name: string

  /** @deprecated use organization_id */
  @Column({ name: "agency_company_id", type: "int", nullable: true })
  agency_company_id: number | null

  @Column({ name: "total_fee", type: "decimal", precision: 12, scale: 2, nullable: true })
  total_fee: number | null

  @Column({ name: "warranty_period_days", type: "int", default: 30 })
  warranty_period_days: number

  @Column({ name: "recruiter_id", type: "int", nullable: true })
  recruiter_id: number | null

  @Column({ name: "team_manager_id", type: "int", nullable: true })
  team_manager_id: number | null

  @Column({ name: "recruitment_manager_id", type: "int", nullable: true })
  recruitment_manager_id: number | null

  @Column({
    name: "recruiter_compensation",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  recruiter_compensation: number | null

  @Column({
    name: "recruiter_compensation_type",
    type: "enum",
    enum: ["fixed", "percent"],
    default: "percent",
  })
  recruiter_compensation_type: string

  @Column({
    name: "team_manager_compensation",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  team_manager_compensation: number | null

  @Column({
    name: "team_manager_compensation_type",
    type: "enum",
    enum: ["fixed", "percent"],
    default: "percent",
  })
  team_manager_compensation_type: string

  @Column({
    name: "recruitment_manager_compensation",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  recruitment_manager_compensation: number | null

  @Column({
    name: "recruitment_manager_compensation_type",
    type: "enum",
    enum: ["fixed", "percent"],
    default: "percent",
  })
  recruitment_manager_compensation_type: string

  @Column({ type: "text", nullable: true })
  notes: string | null

  @Column({ name: "created_by_role", type: "varchar", length: 50, nullable: true })
  created_by_role: string | null
}
