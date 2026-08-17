import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CandidateStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
  INACTIVE = 'inactive',
}

export enum CandidateSource {
  IMPORT = 'import',
  MANUAL = 'manual',
  LINKEDIN = 'linkedin',
  UPLOAD = 'upload',
  CRAWL = 'crawl',
  /** General talent pool assignment (see docs/GENERAL_POOL_FLOW.md) */
  POOL = 'pool',
}

export enum ParsingStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum ConversionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('candidates')
@Index(['organization_id'])
@Index(['recruiter_id'])
@Index(['team_manager_id'])
@Index(['status'])
@Index(['email'])
@Index(['is_deleted'])
@Index(['organization_id', 'import_batch_id', 'import_row_number'], { unique: true })
export class CandidateEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int', nullable: true })
  organization_id: number | null;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ name: 'domain_id', type: 'int', nullable: true })
  domain_id: number | null;

  @Column({ name: 'domain_name', type: 'varchar', length: 255, nullable: true })
  domain_name: string | null;

  @Column({ name: 'role_id', type: 'int', nullable: true })
  role_id: number | null;

  @Column({ name: 'role_name', type: 'varchar', length: 255, nullable: true })
  role_name: string | null;

  @Column({ name: 'specialization_id', type: 'int', nullable: true })
  specialization_id: number | null;

  @Column({ name: 'specialization_name', type: 'varchar', length: 255, nullable: true })
  specialization_name: string | null;

  @Column({ name: 'experience_years', type: 'decimal', precision: 4, scale: 1, nullable: true })
  experience_years: number | null;

  @Column({ name: 'desired_salary_min', type: 'int', nullable: true })
  desired_salary_min: number | null;

  @Column({ name: 'desired_salary_max', type: 'int', nullable: true })
  desired_salary_max: number | null;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resume_url: string | null;

  @Column({ name: 'original_resume_url', type: 'text', nullable: true })
  original_resume_url: string | null;

  @Column({ name: 'converted_resume_url', type: 'text', nullable: true })
  converted_resume_url: string | null;

  @Column({ name: 'resume_filename', type: 'varchar', length: 500, nullable: true })
  resume_filename: string | null;

  @Column({ name: 'original_file_type', type: 'enum', enum: ['pdf', 'doc', 'docx', 'txt'], nullable: true })
  original_file_type: string | null;

  @Column({ name: 'converted_file_type', type: 'varchar', length: 10, default: 'docx', nullable: true })
  converted_file_type: string | null;

  @Column({ name: 'converted_resume_filename', type: 'varchar', length: 500, nullable: true })
  converted_resume_filename: string | null;

  @Column({ name: 'original_resume_filename', type: 'varchar', length: 500, nullable: true })
  original_resume_filename: string | null;

  @Column({ name: 'resume_file_size', type: 'bigint', nullable: true })
  resume_file_size: number | null;

  @Column({ name: 'resume_uploaded_at', type: 'datetime', nullable: true })
  resume_uploaded_at: Date | null;

  @Column({ name: 'resume_upload_source', type: 'enum', enum: ['manual', 'import_zip', 'api', 'crawl'], default: 'manual', nullable: true })
  resume_upload_source: string | null;

  @Column({ type: 'enum', enum: CandidateSource, default: CandidateSource.MANUAL, nullable: true })
  source: CandidateSource | null;

  @Column({ type: 'enum', enum: CandidateStatus, default: CandidateStatus.NEW })
  status: CandidateStatus;

  @Column({ name: 'recruiter_id', type: 'int', nullable: true })
  recruiter_id: number | null;

  @Column({ name: 'team_manager_id', type: 'int', nullable: true })
  team_manager_id: number | null;

  @Column({ name: 'recruitment_manager_id', type: 'int', nullable: true })
  recruitment_manager_id: number | null;

  @Column({ name: 'employer_company_id', type: 'int', nullable: true })
  employer_company_id: number | null;

  /** @deprecated use organization_id */
  @Column({ name: 'agency_company_id', type: 'int', nullable: true })
  agency_company_id: number | null;

  @Column({ type: 'json', nullable: true })
  skills: string[] | null;

  @Column({ type: 'json', nullable: true })
  languages: string[] | null;

  @Column({ name: 'previous_companies', type: 'json', nullable: true })
  previous_companies: string[] | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_duplicate_suspected', type: 'boolean', default: false })
  is_duplicate_suspected: boolean;

  @Column({ name: 'duplicate_of_id', type: 'int', nullable: true })
  duplicate_of_id: number | null;

  @Column({ name: 'import_batch_id', type: 'int', nullable: true })
  import_batch_id: number | null;

  @Column({ name: 'import_row_number', type: 'int', nullable: true })
  import_row_number: number | null;

  @Column({ name: 'data_quality_score', type: 'int', default: 0 })
  data_quality_score: number;

  @Column({ name: 'missing_data', type: 'json', nullable: true })
  missing_data: string[] | null;

  @Column({ name: 'parsing_status', type: 'enum', enum: ParsingStatus, default: ParsingStatus.PENDING })
  parsing_status: ParsingStatus;

  @Column({ name: 'parsing_confidence', type: 'int', default: 0 })
  parsing_confidence: number;

  @Column({ name: 'conversion_status', type: 'enum', enum: ConversionStatus, default: ConversionStatus.PENDING })
  conversion_status: ConversionStatus;

  @Column({ name: 'review_required', type: 'boolean', default: false })
  review_required: boolean;

  @Column({ name: 'imported_at', type: 'datetime', nullable: true })
  imported_at: Date | null;

  @Column({ name: 'imported_by', type: 'varchar', length: 255, nullable: true })
  imported_by: string | null;

  // ─── Soft delete ──────────────────────────────────────────────────────
  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;

  @Column({ name: 'deleted_by', type: 'int', nullable: true })
  deleted_by: number | null;
}
