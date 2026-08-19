import { Column, Entity, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"
import { UserRole } from "../../common/enums/user-role.enum"

@Entity("agency_invitations")
@Index(["token_hash"], { unique: true })
@Index(["organization_id", "status"])
export class AgencyInvitationEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int" })
  organization_id: number

  @Column({ type: "varchar", length: 255 })
  email: string

  @Column({ name: "full_name", type: "varchar", length: 255 })
  full_name: string

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null

  @Column({ type: "enum", enum: UserRole })
  role: UserRole

  @Column({ name: "team_id", type: "int", nullable: true })
  team_id: number | null

  @Column({ name: "token_hash", type: "varchar", length: 64 })
  token_hash: string

  @Column({
    type: "enum",
    enum: ["pending", "accepted", "cancelled", "expired"],
    default: "pending",
  })
  status: string

  @Column({ name: "invited_by", type: "int" })
  invited_by: number

  @Column({ name: "expires_at", type: "datetime" })
  expires_at: Date

  @Column({ name: "accepted_at", type: "datetime", nullable: true })
  accepted_at: Date | null
}
