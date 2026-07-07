import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('companies')
@Index(['name'])
@Index(['is_deleted'])
export class CompanyEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  initials: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logo_url: string | null;

  @Column({ name: 'job_count', type: 'int', default: 0 })
  job_count: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deleted_at: Date | null;

  @Column({ name: 'deleted_by', type: 'int', nullable: true })
  deleted_by: number | null;
}

@Entity('company_reviews')
@Index(['company_id'])
@Index(['reviewer_email'])
export class CompanyReviewEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'int' })
  company_id: number;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  company_name: string | null;

  @Column({ name: 'reviewer_email', type: 'varchar', length: 255 })
  reviewer_email: string;

  @Column({ name: 'reviewer_name', type: 'varchar', length: 255, nullable: true })
  reviewer_name: string | null;

  @Column({ name: 'rating_overall', type: 'decimal', precision: 3, scale: 1 })
  rating_overall: number;

  @Column({ name: 'rating_salary', type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating_salary: number | null;

  @Column({ name: 'rating_management', type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating_management: number | null;

  @Column({ name: 'rating_worklife', type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating_worklife: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  pros: string | null;

  @Column({ type: 'text', nullable: true })
  cons: string | null;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  is_anonymous: boolean;
}

@Entity('staff')
@Index(['company_id'])
@Index(['email'])
export class StaffEntity extends BaseEntity {
  @Column({ name: 'company_id', type: 'varchar', length: 255 })
  company_id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({ type: 'enum', enum: ['hiring_manager', 'team_manager', 'recruiter'] })
  role: string;

  @Column({ name: 'manager_email', type: 'varchar', length: 255, nullable: true })
  manager_email: string | null;
}

