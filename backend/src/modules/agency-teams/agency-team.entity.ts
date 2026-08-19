import { Column, Entity, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("agency_teams")
@Index(["organization_id", "name"], { unique: true })
export class AgencyTeamEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int" })
  organization_id: number

  @Column({ type: "varchar", length: 120 })
  name: string

  @Column({ type: "text", nullable: true })
  description: string | null

  @Column({ name: "manager_id", type: "int", nullable: true })
  manager_id: number | null

  @Column({ name: "is_active", type: "boolean", default: true })
  is_active: boolean
}
