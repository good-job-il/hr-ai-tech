import { Entity, Column, Index } from "typeorm"
import { BaseEntity } from "../../../common/entities/base.entity"

@Entity("application_pipelines")
@Index(["employer_id"])
export class ApplicationPipelineEntity extends BaseEntity {
  @Column({ name: "employer_id", type: "varchar", length: 255 })
  employer_id: string

  @Column({ type: "varchar", length: 100 })
  name: string

  @Column({ name: "order", type: "int", default: 0 })
  order: number

  @Column({ type: "varchar", length: 20, nullable: true })
  color: string | null
}
