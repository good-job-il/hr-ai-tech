import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('job_alerts')
@Index(['user_id'])
@Index(['user_email'])
@Index(['is_active'])
export class JobAlertEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'int', nullable: true })
  user_id: number | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  user_email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  keywords: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ name: 'job_type', type: 'varchar', length: 50, nullable: true })
  job_type: string | null;

  @Column({ name: 'salary_min', type: 'int', nullable: true })
  salary_min: number | null;

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'instant'],
    default: 'weekly',
    nullable: true,
  })
  frequency: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'last_sent', type: 'datetime', nullable: true })
  last_sent: Date | null;
}
