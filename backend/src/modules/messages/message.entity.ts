import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('messages')
@Index(['application_id'])
@Index(['sender_email'])
export class MessageEntity extends BaseEntity {
  @Column({ name: 'application_id', type: 'varchar', length: 36 })
  application_id: string;

  @Column({ name: 'sender_email', type: 'varchar', length: 255 })
  sender_email: string;

  @Column({ name: 'sender_role', type: 'enum', enum: ['employer', 'candidate', 'recruiter'], nullable: true })
  sender_role: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  is_read: boolean;
}

