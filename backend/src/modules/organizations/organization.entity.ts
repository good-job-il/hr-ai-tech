import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrgType } from '../../common/enums/org-type.enum';

export enum OrgStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum OrgPlan {
  TRIAL = 'trial',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('organizations')
@Index(['org_type'])
@Index(['status'])
export class OrganizationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'org_type',
    type: 'enum',
    enum: OrgType,
  })
  org_type: OrgType;

  @Column({
    type: 'enum',
    enum: OrgStatus,
    default: OrgStatus.ACTIVE,
  })
  status: OrgStatus;

  /** Free-form JSON settings object */
  @Column({ type: 'json', nullable: true })
  settings: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: OrgPlan,
    default: OrgPlan.TRIAL,
  })
  plan: OrgPlan;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logo_url: string | null;
}

