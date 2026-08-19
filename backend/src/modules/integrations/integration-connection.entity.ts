import { Column, Entity, Index } from "typeorm"
import { BaseEntity } from "../../common/entities/base.entity"

@Entity("integration_connections")
@Index(["organization_id", "provider"], { unique: true })
export class IntegrationConnectionEntity extends BaseEntity {
  @Column({ name: "organization_id", type: "int" }) organization_id: number
  @Column({ type: "varchar", length: 80 }) provider: string
  @Column({
    type: "enum",
    enum: ["pending", "connected", "error", "disconnected"],
    default: "pending",
  })
  status: string
  @Column({ type: "json", nullable: true }) scopes: string[] | null
  @Column({ name: "external_account_label", type: "varchar", length: 255, nullable: true })
  external_account_label: string | null
  @Column({ name: "oauth_state", type: "varchar", length: 64, nullable: true }) oauth_state:
    string | null
  @Column({ name: "last_sync_at", type: "datetime", nullable: true }) last_sync_at: Date | null
  @Column({ name: "last_sync_status", type: "enum", enum: ["success", "error"], nullable: true })
  last_sync_status: string | null
  @Column({ name: "last_error", type: "text", nullable: true }) last_error: string | null
  @Column({ name: "connected_at", type: "datetime", nullable: true }) connected_at: Date | null
  @Column({ name: "disconnected_at", type: "datetime", nullable: true })
  disconnected_at: Date | null
}
