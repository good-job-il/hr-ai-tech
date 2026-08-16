import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('candidate_profiles')
@Index(['user_id'], { unique: true })
@Index(['user_email'], { unique: true })
export class CandidateProfileEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: true, unique: true })
  user_id: number | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, unique: true })
  user_email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'json', nullable: true })
  skills: string[] | null;

  @Column({ name: 'experience_years', type: 'decimal', precision: 4, scale: 1, nullable: true })
  experience_years: number | null;

  /** Array of education objects */
  @Column({ type: 'json', nullable: true })
  education: any[] | null;

  /** Array of work experience objects */
  @Column({ type: 'json', nullable: true })
  experience: any[] | null;

  @Column({ name: 'desired_salary_min', type: 'int', nullable: true })
  desired_salary_min: number | null;

  @Column({ name: 'desired_salary_max', type: 'int', nullable: true })
  desired_salary_max: number | null;

  @Column({ name: 'job_type', type: 'varchar', length: 50, nullable: true })
  job_type: string | null;

  @Column({ type: 'json', nullable: true })
  categories: string[] | null;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  is_public: boolean;

  @Column({ name: 'is_open_to_work', type: 'boolean', default: false })
  is_open_to_work: boolean;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resume_url: string | null;
}
