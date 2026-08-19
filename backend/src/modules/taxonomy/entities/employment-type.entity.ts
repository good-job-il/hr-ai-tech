import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity("employment_types")
export class EmploymentTypeEntity {
  @PrimaryColumn({ name: "type_id", type: "int" })
  type_id: number

  @Column({ type: "varchar", length: 100 })
  name: string
}
