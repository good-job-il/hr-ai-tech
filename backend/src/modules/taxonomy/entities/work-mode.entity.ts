import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity("work_modes")
export class WorkModeEntity {
  @PrimaryColumn({ name: "mode_id", type: "int" })
  mode_id: number

  @Column({ type: "varchar", length: 100 })
  name: string
}
