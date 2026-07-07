import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('application_timelines')
@Index(['application_id'])
@Index(['organization_id'])
export class ApplicationTimelineEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int', nullable: true })
  organization_id: number | null;

  @Column({ name: 'application_id', type: 'int' })
  application_id: number;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: ['submitted', 'status_changed', 'note_added', 'interview_scheduled', 'interview_completed', 'offer_made', 'rejected', 'assigned', 'resume_viewed'],
  })
  event_type: string;

  @Column({ name: 'previous_value', type: 'varchar', length: 100, nullable: true })
  previous_value: string | null;

  @Column({ name: 'new_value', type: 'varchar', length: 100, nullable: true })
  new_value: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'performed_by', type: 'varchar', length: 255, nullable: true })
  performed_by: string | null;

  @Column({
    name: 'performed_by_role',
    type: 'enum',
    enum: ['candidate', 'employer', 'recruiter', 'team_manager', 'recruitment_manager', 'org_admin', 'admin'],
    nullable: true,
  })
  performed_by_role: string | null;
}

