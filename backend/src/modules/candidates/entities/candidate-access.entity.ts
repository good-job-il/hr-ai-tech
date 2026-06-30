import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('candidate_access')
@Index(['candidate_id'])
@Index(['owner_organization_id'])
export class CandidateAccessEntity extends BaseEntity {
  @Column({ name: 'candidate_id', type: 'varchar', length: 36 })
  candidate_id: string;

  @Column({ name: 'owner_organization_id', type: 'varchar', length: 36 })
  owner_organization_id: string;

  @Column({ name: 'accessor_organization_id', type: 'varchar', length: 36, nullable: true })
  accessor_organization_id: string | null;

  @Column({
    name: 'access_type',
    type: 'enum',
    enum: ['owner', 'shared', 'purchased'],
    default: 'owner',
  })
  access_type: string;

  @Column({ name: 'granted_by', type: 'varchar', length: 36, nullable: true })
  granted_by: string | null;

  @Column({ name: 'granted_at', type: 'datetime', nullable: true })
  granted_at: Date | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expires_at: Date | null;
}

