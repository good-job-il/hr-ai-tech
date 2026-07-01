import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('compensation_plans')
@Index(['organization_id'])
@Index(['job_id'])
export class CompensationPlanEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'varchar', length: 36, nullable: true })
  organization_id: string | null;

  @Column({ name: 'job_id', type: 'varchar', length: 36, nullable: true })
  job_id: string | null;

  @Column({ name: 'client_name', type: 'varchar', length: 255 })
  client_name: string;

  /** @deprecated use organization_id */
  @Column({ name: 'agency_company_id', type: 'varchar', length: 36, nullable: true })
  agency_company_id: string | null;

  @Column({ name: 'total_fee', type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_fee: number | null;

  @Column({ name: 'warranty_period_days', type: 'int', default: 30 })
  warranty_period_days: number;

  @Column({ name: 'recruiter_id', type: 'varchar', length: 36, nullable: true })
  recruiter_id: string | null;

  @Column({ name: 'team_manager_id', type: 'varchar', length: 36, nullable: true })
  team_manager_id: string | null;

  @Column({ name: 'recruitment_manager_id', type: 'varchar', length: 36, nullable: true })
  recruitment_manager_id: string | null;

  @Column({ name: 'recruiter_compensation', type: 'decimal', precision: 12, scale: 2, nullable: true })
  recruiter_compensation: number | null;

  @Column({ name: 'recruiter_compensation_type', type: 'enum', enum: ['fixed', 'percent'], default: 'percent' })
  recruiter_compensation_type: string;

  @Column({ name: 'team_manager_compensation', type: 'decimal', precision: 12, scale: 2, nullable: true })
  team_manager_compensation: number | null;

  @Column({ name: 'team_manager_compensation_type', type: 'enum', enum: ['fixed', 'percent'], default: 'percent' })
  team_manager_compensation_type: string;

  @Column({ name: 'recruitment_manager_compensation', type: 'decimal', precision: 12, scale: 2, nullable: true })
  recruitment_manager_compensation: number | null;

  @Column({ name: 'recruitment_manager_compensation_type', type: 'enum', enum: ['fixed', 'percent'], default: 'percent' })
  recruitment_manager_compensation_type: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by_role', type: 'varchar', length: 50, nullable: true })
  created_by_role: string | null;
}

