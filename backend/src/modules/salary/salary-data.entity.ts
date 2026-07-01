import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('salary_data')
@Index(['job_title'])
@Index(['category'])
export class SalaryDataEntity extends BaseEntity {
  @Column({ name: 'job_title', type: 'varchar', length: 255 })
  job_title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ name: 'salary_avg', type: 'int', nullable: true })
  salary_avg: number | null;

  @Column({ name: 'salary_min', type: 'int', nullable: true })
  salary_min: number | null;

  @Column({ name: 'salary_max', type: 'int', nullable: true })
  salary_max: number | null;

  @Column({ name: 'sample_count', type: 'int', default: 0 })
  sample_count: number;

  @Column({ type: 'int', nullable: true })
  year: number | null;
}

