import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('experience_levels')
export class ExperienceLevelEntity {
  @PrimaryColumn({ name: 'level_id', type: 'int' })
  level_id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;
}

