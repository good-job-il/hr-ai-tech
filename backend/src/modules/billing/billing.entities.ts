import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('billing_accounts')
@Index(['organization_id'], { unique: true })
export class BillingAccountEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int' }) organization_id: number;
  @Column({ type: 'varchar', length: 50, nullable: true }) provider: string | null;
  @Column({ name: 'provider_customer_id', type: 'varchar', length: 255, nullable: true }) provider_customer_id: string | null;
  @Column({ name: 'subscription_status', type: 'enum', enum: ['trialing', 'active', 'past_due', 'cancelled', 'unpaid', 'not_configured'], default: 'not_configured' }) subscription_status: string;
  @Column({ name: 'payment_status', type: 'enum', enum: ['paid', 'pending', 'failed', 'not_configured'], default: 'not_configured' }) payment_status: string;
  @Column({ name: 'current_period_end', type: 'datetime', nullable: true }) current_period_end: Date | null;
  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false }) cancel_at_period_end: boolean;
}

@Entity('billing_invoices')
@Index(['organization_id', 'issued_at'])
@Index(['provider_invoice_id'], { unique: true })
export class BillingInvoiceEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'int' }) organization_id: number;
  @Column({ name: 'provider_invoice_id', type: 'varchar', length: 255 }) provider_invoice_id: string;
  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true }) invoice_number: string | null;
  @Column({ name: 'amount_minor', type: 'int' }) amount_minor: number;
  @Column({ type: 'varchar', length: 3, default: 'ILS' }) currency: string;
  @Column({ type: 'enum', enum: ['draft', 'open', 'paid', 'void', 'uncollectible'], default: 'open' }) status: string;
  @Column({ name: 'issued_at', type: 'datetime' }) issued_at: Date;
  @Column({ name: 'due_at', type: 'datetime', nullable: true }) due_at: Date | null;
  @Column({ name: 'paid_at', type: 'datetime', nullable: true }) paid_at: Date | null;
  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true }) hosted_invoice_url: string | null;
  @Column({ name: 'invoice_pdf_url', type: 'text', nullable: true }) invoice_pdf_url: string | null;
}
