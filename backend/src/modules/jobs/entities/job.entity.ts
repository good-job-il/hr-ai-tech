import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("jobs")
@Index(["organization_id"])
@Index(["recruiter_id"])
@Index(["is_closed"])
@Index(["state"])
@Index(["is_deleted"])
@Index(["domain_id"])
export class JobEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int", nullable: true })
  organization_id: number | null

  @Column({ name: "domain_id", type: "int", nullable: true })
  domain_id: number | null

  @Column({ name: "role_id", type: "int", nullable: true })
  role_id: number | null

  @Column({ name: "specialization_id", type: "int", nullable: true })
  specialization_id: number | null

  @Column({ type: "varchar", length: 255 })
  title: string

  @Column({ type: "varchar", length: 255 })
  company: string

  @Column({ name: "company_initials", type: "varchar", length: 10, nullable: true })
  company_initials: string | null

  @Column({ name: "company_color", type: "varchar", length: 20, nullable: true })
  company_color: string | null

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string | null

  @Column({ name: "salary_min", type: "int", nullable: true })
  salary_min: number | null

  @Column({ name: "salary_max", type: "int", nullable: true })
  salary_max: number | null

  @Column({ type: "varchar", length: 100, nullable: true })
  category: string | null

  @Column({ type: "enum", enum: ["full", "part", "daily", "remote"], default: "full" })
  type: string

  @Column({ type: "int", default: 0 })
  views: number

  @Column({ type: "longtext", nullable: true })
  description: string | null

  @Column({ name: "employer_company_id", type: "int", nullable: true })
  employer_company_id: number | null

  /** @deprecated use organization_id */
  @Column({ name: "agency_company_id", type: "int", nullable: true })
  agency_company_id: number | null

  @Column({ name: "created_by_user_id", type: "int", nullable: true })
  created_by_user_id: number | null

  @Column({ name: "recruiter_id", type: "int", nullable: true })
  recruiter_id: number | null

  @Column({ name: "team_manager_id", type: "int", nullable: true })
  team_manager_id: number | null

  @Column({ name: "recruitment_manager_id", type: "int", nullable: true })
  recruitment_manager_id: number | null

  /** @deprecated use employer_company_id */
  @Column({ name: "employer_id", type: "varchar", length: 255, nullable: true })
  employer_id: string | null

  @Column({ name: "external_id", type: "varchar", length: 255, nullable: true })
  external_id: string | null

  @Column({ name: "is_closed", type: "boolean", default: false })
  is_closed: boolean

  @Column({ type: "enum", enum: ["draft", "open", "on_hold", "filled", "closed"], default: "open" })
  state: "draft" | "open" | "on_hold" | "filled" | "closed"

  @Column({ name: "is_anonymous", type: "boolean", default: false })
  is_anonymous: boolean

  @Column({ name: "show_company_name", type: "boolean", default: true })
  show_company_name: boolean

  @Column({ name: "show_company_info", type: "boolean", default: true })
  show_company_info: boolean

  @Column({ name: "show_contact_details", type: "boolean", default: false })
  show_contact_details: boolean

  @Column({ name: "contact_email", type: "varchar", length: 255, nullable: true })
  contact_email: string | null

  @Column({ name: "contact_phone", type: "varchar", length: 50, nullable: true })
  contact_phone: string | null

  @Column({ name: "applications_count", type: "int", default: 0 })
  applications_count: number

  @Column({ name: "required_skills", type: "json", nullable: true })
  required_skills: string[] | null

  @Column({ name: "preferred_skills", type: "json", nullable: true })
  preferred_skills: string[] | null

  @Column({ name: "role_domain", type: "varchar", length: 255, nullable: true })
  role_domain: string | null

  @Column({
    type: "enum",
    enum: ["junior", "mid", "senior", "lead", "manager", "director", "any"],
    default: "any",
    nullable: true,
  })
  seniority: string | null

  @Column({ name: "years_experience_required", type: "int", nullable: true })
  years_experience_required: number | null

  @Column({ name: "ai_keywords", type: "json", nullable: true })
  ai_keywords: string[] | null

  @Column({ name: "job_code", type: "varchar", length: 50, nullable: true, unique: true })
  job_code: string | null

  @Column({ name: "apply_email", type: "varchar", length: 255, nullable: true })
  apply_email: string | null

  @Column({ name: "apply_url", type: "text", nullable: true })
  apply_url: string | null

  // ─── Soft delete ──────────────────────────────────────────────────────
  @Column({ name: "is_deleted", type: "boolean", default: false })
  is_deleted: boolean

  @Column({ name: "deleted_at", type: "datetime", nullable: true })
  deleted_at: Date | null

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deleted_by: number | null
}
