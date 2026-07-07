import {
  Entity,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrgType } from '../../common/enums/org-type.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['organization_id'])
@Index(['role'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  })
  role: UserRole;

  @Column({
    name: 'organization_id',
    type: 'int',
    nullable: true,
  })
  organization_id: number | null;

  /** DEPRECATED in Base44 — keep for backward compat, maps to organization_id */
  @Column({ name: 'company_id', type: 'int', nullable: true })
  company_id: number | null;

  @Column({
    name: 'org_type',
    type: 'enum',
    enum: OrgType,
    nullable: true,
  })
  org_type: OrgType | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({
    name: 'team_manager_id',
    type: 'int',
    nullable: true,
  })
  team_manager_id: number | null;

  @Column({
    name: 'recruitment_manager_id',
    type: 'int',
    nullable: true,
  })
  recruitment_manager_id: number | null;

  /** Custom display name for their role (UI only) */
  @Column({
    name: 'display_role_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  display_role_name: string | null;

  /** Employer-specific: which company they represent */
  @Column({
    name: 'employer_company_id',
    type: 'int',
    nullable: true,
  })
  employer_company_id: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  last_login: Date | null;

  /** Hashed refresh token for token rotation */
  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Exclude()
  refresh_token_hash: string | null;

  /** Password reset token (hashed) */
  @Column({
    name: 'reset_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Exclude()
  reset_token_hash: string | null;

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true })
  @Exclude()
  reset_token_expires: Date | null;

  // ─── Employer company profile fields (used by updateCompanyProfile) ─────
  @Column({ name: 'company_culture', type: 'text', nullable: true })
  company_culture: string | null;

  @Column({ type: 'json', nullable: true })
  benefits: string[] | null;

  @Column({ name: 'gallery_urls', type: 'json', nullable: true })
  gallery_urls: string[] | null;

  @Column({ name: 'video_url', type: 'text', nullable: true })
  video_url: string | null;

  @Column({ type: 'json', nullable: true })
  testimonials: Record<string, any>[] | null;

  @BeforeInsert()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeUpdate()
  normalizeEmailOnUpdate() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }
}

