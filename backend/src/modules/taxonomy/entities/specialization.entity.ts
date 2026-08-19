import { Entity, Column, PrimaryColumn, Index } from "typeorm"

@Entity("specializations")
@Index(["role_name"])
export class SpecializationEntity {
  @PrimaryColumn({ name: "specialization_id", type: "int" })
  specialization_id: number

  @Column({ name: "role_name", type: "varchar", length: 255 })
  role_name: string

  @Column({ type: "varchar", length: 255 })
  name: string
}
