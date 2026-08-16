import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export const AUDIT_ENTITY_TYPES = [
  'Candidate', 'Application', 'Job', 'Company', 'CandidateDocument',
  'CompensationPlan', 'User', 'Organization', 'Interview', 'CommunicationLog',
  'AgencyTeam', 'AgencyInvitation',
] as const;

export const AUDIT_ACTIONS = [
  'view', 'create', 'update', 'delete', 'cv_download', 'cv_view',
  'status_change', 'send_to_employer', 'export', 'compensation_change',
  'login', 'impersonate', 'restore', 'role_display_name_update', 'permission_update',
  'deactivate', 'resend', 'cancel',
] as const;

@Entity('audit_logs')
@Index(['organization_id'])
@Index(['entity_type', 'entity_id'])
@Index(['actor_user_id'])
export class AuditLogEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'varchar', length: 36, nullable: true })
  organization_id: string | null;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 36, nullable: true })
  actor_user_id: string | null;

  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actor_email: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 50, nullable: true })
  actor_role: string | null;

  @Column({ name: 'entity_type', type: 'enum', enum: AUDIT_ENTITY_TYPES })
  entity_type: string;

  /**
   * Polymorphic entity ID — stores the integer PK of the referenced entity.
   * All entities now use INT auto-increment PKs.
   */
  @Column({ name: 'entity_id', type: 'int' })
  entity_id: number;

  @Column({ name: 'entity_label', type: 'varchar', length: 255, nullable: true })
  entity_label: string | null;

  @Column({ type: 'enum', enum: AUDIT_ACTIONS })
  action: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  user_agent: string | null;
}
