import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('agency_clients')
@Index(['organization_id', 'company_id'], { unique: true })
@Index(['organization_id', 'status'])
export class AgencyClientEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int' })
  organization_id: number;

  @Column({ name: 'company_id', type: 'int' })
  company_id: number;

  @Column({ type: 'enum', enum: ['prospect', 'active', 'inactive', 'archived'], default: 'active' })
  status: string;

  @Column({ name: 'account_manager_id', type: 'int', nullable: true })
  account_manager_id: number | null;

  @Column({ name: 'contact_name', type: 'varchar', length: 255, nullable: true })
  contact_name: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contact_email: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  contact_phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ name: 'contract_type', type: 'varchar', length: 100, nullable: true })
  contract_type: string | null;

  @Column({ name: 'contract_start_date', type: 'date', nullable: true })
  contract_start_date: string | null;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contract_end_date: string | null;

  @Column({ name: 'placement_fee_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  placement_fee_percent: number | null;

  @Column({ name: 'payment_terms_days', type: 'int', nullable: true })
  payment_terms_days: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'archived_at', type: 'datetime', nullable: true })
  archived_at: Date | null;

  @Column({ name: 'archived_by', type: 'int', nullable: true })
  archived_by: number | null;
}
