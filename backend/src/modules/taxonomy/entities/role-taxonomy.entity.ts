import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

/**
 * Role (taxonomy) — job role within a domain.
 * Named RoleTaxonomyEntity to avoid collision with UserRole enum.
 */
@Entity('taxonomy_roles')
@Index(['domain_id'])
export class RoleTaxonomyEntity {
  @PrimaryColumn({ name: 'role_id', type: 'int' })
  role_id: number;

  @Column({ name: 'domain_id', type: 'int' })
  domain_id: number;

  @Column({ name: 'domain_name', type: 'varchar', length: 255, nullable: true })
  domain_name: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}

