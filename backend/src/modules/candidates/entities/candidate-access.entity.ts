import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("candidate_access")
@Index(["candidate_id"])
@Index(["owner_organization_id"])
export class CandidateAccessEntity extends BaseEntity {
  @Column({ name: "candidate_id", type: "int" })
  candidate_id: number

  @Column({ name: "owner_organization_id", type: "int" })
  owner_organization_id: number

  @Column({ name: "accessor_organization_id", type: "int", nullable: true })
  accessor_organization_id: number | null

  @Column({
    name: "access_type",
    type: "enum",
    enum: ["owner", "shared", "purchased"],
    default: "owner",
  })
  access_type: string

  @Column({ name: "granted_by", type: "int", nullable: true })
  granted_by: number | null

  @Column({ name: "granted_at", type: "datetime", nullable: true })
  granted_at: Date | null

  @Column({ name: "expires_at", type: "datetime", nullable: true })
  expires_at: Date | null
}
