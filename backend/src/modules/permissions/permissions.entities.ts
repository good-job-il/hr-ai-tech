import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export interface PermissionSet {
  view?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  export?: boolean;
  download_cv?: boolean;
  view_compensation?: boolean;
  edit_compensation?: boolean;
  manage_users?: boolean;
  manage_settings?: boolean;
}

export type PermissionKey = keyof PermissionSet;

@Entity('permission_matrices')
@Index(['organization_id'])
@Index(['role_key'])
export class PermissionMatrixEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int', nullable: true })
  organization_id: number | null;

  @Column({ name: 'org_type', type: 'enum', enum: ['staffing_agency', 'organization'], nullable: true })
  org_type: string | null;

  @Column({ name: 'role_key', type: 'varchar', length: 100 })
  role_key: string;

  @Column({ name: 'is_template', type: 'boolean', default: false })
  is_template: boolean;

  @Column({ type: 'json' })
  permissions: PermissionSet;
}

@Entity('role_templates')
@Index(['organization_id'])
@Index(['system_role_key'])
export class RoleTemplateEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int', nullable: true })
  organization_id: number | null;

  @Column({ name: 'org_type', type: 'enum', enum: ['staffing_agency', 'organization'] })
  org_type: string;

  @Column({ name: 'system_role_key', type: 'varchar', length: 100 })
  system_role_key: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  display_name: string;

  @Column({ name: 'parent_role_key', type: 'varchar', length: 100, nullable: true })
  parent_role_key: string | null;

  @Column({ name: 'hierarchy_level', type: 'int', nullable: true })
  hierarchy_level: number | null;

  @Column({ name: 'is_editable_name', type: 'boolean', default: true })
  is_editable_name: boolean;

  @Column({ name: 'is_system_required', type: 'boolean', default: true })
  is_system_required: boolean;

  @Column({ name: 'permissions_template_id', type: 'int', nullable: true })
  permissions_template_id: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}

@Entity('role_aliases')
export class RoleAliasEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  alias: string;

  @Column({ name: 'canonical_role', type: 'varchar', length: 100 })
  canonical_role: string;
}

@Entity('user_position_access')
@Index(['company_email'])
@Index(['user_email'])
export class UserPositionAccessEntity extends BaseEntity {
  @Column({ name: 'company_email', type: 'varchar', length: 255 })
  company_email: string;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  user_email: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  user_name: string | null;

  @Column({ name: 'user_type', type: 'enum', enum: ['team_manager', 'recruiter'] })
  user_type: string;

  @Column({ name: 'position_ids', type: 'json', nullable: true })
  position_ids: number[] | null;

  @Column({ name: 'can_review_applications', type: 'boolean', default: true })
  can_review_applications: boolean;

  @Column({ name: 'can_schedule_interviews', type: 'boolean', default: true })
  can_schedule_interviews: boolean;

  @Column({ name: 'can_send_messages', type: 'boolean', default: true })
  can_send_messages: boolean;
}

@Entity('positions')
@Index(['company_email'])
export class PositionEntity extends BaseEntity {
  @Column({ name: 'company_email', type: 'varchar', length: 255 })
  company_email: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'required_experience', type: 'int', nullable: true })
  required_experience: number | null;

  @Column({ type: 'json', nullable: true })
  skills: string[] | null;

  @Column({ name: 'salary_min', type: 'int', nullable: true })
  salary_min: number | null;

  @Column({ name: 'salary_max', type: 'int', nullable: true })
  salary_max: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;
}
