import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OrganizationEntity } from "../organizations/organization.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { UserEntity } from "../users/user.entity"
import { PermissionsModule } from "../permissions/permissions.module"
import { BillingAccountEntity, BillingInvoiceEntity } from "./billing.entities"
import { BillingController } from "./billing.controller"
import { BillingService } from "./billing.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganizationEntity,
      BillingAccountEntity,
      BillingInvoiceEntity,
      JobEntity,
      CandidateEntity,
      UserEntity,
    ]),
    PermissionsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
