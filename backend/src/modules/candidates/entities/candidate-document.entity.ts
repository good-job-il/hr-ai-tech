import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('candidate_documents')
@Index(['candidate_id'])
@Index(['organization_id'])
export class CandidateDocumentEntity extends BaseEntity {
  @Column({ name: 'organization_id', type: 'varchar', length: 36, nullable: true })
  organization_id: string | null;

  @Column({ name: 'candidate_id', type: 'varchar', length: 36 })
  candidate_id: string;

  @Column({ name: 'candidate_email', type: 'varchar', length: 255, nullable: true })
  candidate_email: string | null;

  @Column({ name: 'doc_type', type: 'varchar', length: 50 })
  doc_type: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filename: string | null;

  @Column({ name: 'file_url', type: 'text' })
  file_url: string;

  @Column({ name: 'original_file_url', type: 'text', nullable: true })
  original_file_url: string | null;

  @Column({ name: 'original_file_type', type: 'varchar', length: 20, nullable: true })
  original_file_type: string | null;

  @Column({ name: 'original_filename', type: 'varchar', length: 500, nullable: true })
  original_filename: string | null;

  @Column({ name: 'docx_url', type: 'text', nullable: true })
  docx_url: string | null;

  @Column({ name: 'docx_filename', type: 'varchar', length: 500, nullable: true })
  docx_filename: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  file_size: number | null;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 255, nullable: true })
  uploaded_by: string | null;

  @Column({ name: 'uploaded_at', type: 'datetime', nullable: true })
  uploaded_at: Date | null;

  @Column({ name: 'is_latest_cv', type: 'boolean', default: false })
  is_latest_cv: boolean;

  @Column({ name: 'conversion_status', type: 'enum', enum: ['pending', 'success', 'failed'], default: 'pending', nullable: true })
  conversion_status: string | null;

  @Column({ name: 'conversion_error', type: 'text', nullable: true })
  conversion_error: string | null;

  @Column({ name: 'parsing_status', type: 'enum', enum: ['pending', 'success', 'partial', 'failed'], default: 'pending', nullable: true })
  parsing_status: string | null;

  @Column({ name: 'parsing_error', type: 'text', nullable: true })
  parsing_error: string | null;

  @Column({ name: 'parsed_data', type: 'json', nullable: true })
  parsed_data: Record<string, any> | null;

  @Column({ name: 'import_batch_id', type: 'varchar', length: 36, nullable: true })
  import_batch_id: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}

