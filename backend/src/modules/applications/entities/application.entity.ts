import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('applications')
@Index(['organization_id'])
@Index(['job_id'])
@Index(['candidate_id'])
@Index(['recruiter_id'])
@Index(['status'])
@Index(['is_deleted'])
export class ApplicationEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'varchar', length: 36, nullable: true })
  organization_id: string | null;

  @Column({ name: 'job_id', type: 'varchar', length: 36 })
  job_id: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 36, nullable: true })
  candidate_id: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 255, nullable: true })
  job_title: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @Column({ name: 'employer_company_id', type: 'varchar', length: 36, nullable: true })
  employer_company_id: string | null;

  /** @deprecated use organization_id */
  @Column({ name: 'agency_company_id', type: 'varchar', length: 36, nullable: true })
  agency_company_id: string | null;

  @Column({ name: 'recruiter_id', type: 'varchar', length: 36, nullable: true })
  recruiter_id: string | null;

  @Column({ name: 'team_manager_id', type: 'varchar', length: 36, nullable: true })
  team_manager_id: string | null;

  @Column({ name: 'recruitment_manager_id', type: 'varchar', length: 36, nullable: true })
  recruitment_manager_id: string | null;

  @Column({ name: 'candidate_name', type: 'varchar', length: 255 })
  candidate_name: string;

  @Column({ name: 'candidate_email', type: 'varchar', length: 255 })
  candidate_email: string;

  @Column({ name: 'candidate_phone', type: 'varchar', length: 50, nullable: true })
  candidate_phone: string | null;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resume_url: string | null;

  @Column({ name: 'resume_filename', type: 'varchar', length: 500, nullable: true })
  resume_filename: string | null;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  cover_letter: string | null;

  @Column({ name: 'desired_salary_min', type: 'int', nullable: true })
  desired_salary_min: number | null;

  @Column({ name: 'desired_salary_max', type: 'int', nullable: true })
  desired_salary_max: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({
    type: 'enum',
    enum: ['app', 'linkedin', 'facebook', 'jobsite', 'pool_assignment', 'email_intake', 'other'],
    default: 'app',
    nullable: true,
  })
  source: string | null;

  @Column({
    type: 'enum',
    enum: ['new', 'reviewed', 'phone_interview', 'recommended', 'employer_interview', 'offer', 'hired', 'probation', 'completed', 'rejected'],
    default: 'new',
  })
  status: string;

  @Column({ name: 'match_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  match_score: number | null;

  @Column({ name: 'match_reason', type: 'text', nullable: true })
  match_reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'internal_history', type: 'text', nullable: true })
  internal_history: string | null;

  @Column({ name: 'assigned_to', type: 'varchar', length: 36, nullable: true })
  assigned_to: string | null;

  /** @deprecated use employer_company_id */
  @Column({ name: 'employer_id', type: 'varchar', length: 255, nullable: true })
  employer_id: string | null;

  // ─── Soft delete ──────────────────────────────────────────────────────
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;

  @Column({ name: 'deleted_by', type: 'varchar', length: 36, nullable: true })
  deleted_by: string | null;
}

