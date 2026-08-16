import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type BackgroundJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type BackgroundJobType = 'candidate_file_import' | 'import_source_sync';

@Entity('background_jobs')
@Index(['status', 'run_after'])
@Index(['idempotency_key'], { unique: true })
export class BackgroundJobEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  type: BackgroundJobType;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: BackgroundJobStatus;

  @Column({ type: 'varchar', length: 160 })
  idempotency_key: string;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @Column({ type: 'json', nullable: true })
  result: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'int', nullable: true })
  organization_id: number | null;

  @Column({ type: 'int' })
  requested_by: number;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 3 })
  max_attempts: number;

  @Column({ type: 'datetime', nullable: true })
  run_after: Date | null;

  @Column({ type: 'datetime', nullable: true })
  locked_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}
