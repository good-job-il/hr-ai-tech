import { Entity, Column, PrimaryColumn } from "typeorm"

/**
 * Domain — job domain / field (e.g. Software Engineering, Finance)
 * Uses the integer domain_id as its primary key.
 */
@Entity("domains")
export class DomainEntity {
  @PrimaryColumn({ name: "domain_id", type: "int" })
  domain_id: number

  @Column({ type: "varchar", length: 255 })
  name: string
}
