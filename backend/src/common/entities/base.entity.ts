import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base entity with auto-increment integer pk + timestamps.
 * Migrated from UUID (varchar 36) to INT AUTO_INCREMENT for MySQL performance.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_date' })
  created_date: Date;

  @UpdateDateColumn({ name: 'updated_date' })
  updated_date: Date;
}

