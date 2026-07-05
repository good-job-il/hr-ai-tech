import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('candidate_notes')
@Index(['candidate_id'])
@Index(['organization_id'])
export class CandidateNoteEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'varchar', length: 36, nullable: true })
  organization_id: string | null;

  @Column({ name: 'candidate_id', type: 'varchar', length: 36 })
  candidate_id: string;

  @Column({ name: 'candidate_email', type: 'varchar', length: 255, nullable: true })
  candidate_email: string | null;

  @Column({ name: 'author_email', type: 'varchar', length: 255 })
  author_email: string;

  @Column({ name: 'author_name', type: 'varchar', length: 255, nullable: true })
  author_name: string | null;

  @Column({ name: 'author_role', type: 'varchar', length: 100, nullable: true })
  author_role: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ['private', 'team', 'all', 'internal'], default: 'team', nullable: true })
  visibility: string | null;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  is_pinned: boolean;

  @Column({ name: 'note_type', type: 'varchar', length: 50, nullable: true })
  note_type: string | null;

  @Column({ name: 'related_application_id', type: 'varchar', length: 36, nullable: true })
  related_application_id: string | null;

  @Column({ name: 'related_interview_id', type: 'varchar', length: 36, nullable: true })
  related_interview_id: string | null;
}

