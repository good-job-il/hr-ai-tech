import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('candidate_tags')
@Index(['candidate_id'])
export class CandidateTagEntity extends BaseEntity {
  @Column({ name: 'candidate_id', type: 'varchar', length: 36 })
  candidate_id: string;

  @Column({ type: 'varchar', length: 100 })
  tag: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null;

  @Column({ name: 'added_by', type: 'varchar', length: 255, nullable: true })
  added_by: string | null;
}

