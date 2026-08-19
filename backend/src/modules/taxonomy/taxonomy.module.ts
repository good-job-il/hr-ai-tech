import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DomainEntity } from "./entities/domain.entity"
import { RoleTaxonomyEntity } from "./entities/role-taxonomy.entity"
import { SpecializationEntity } from "./entities/specialization.entity"
import { WorkModeEntity } from "./entities/work-mode.entity"
import { EmploymentTypeEntity } from "./entities/employment-type.entity"
import { ExperienceLevelEntity } from "./entities/experience-level.entity"
import { TaxonomyService } from "./taxonomy.service"
import { TaxonomyController } from "./taxonomy.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DomainEntity,
      RoleTaxonomyEntity,
      SpecializationEntity,
      WorkModeEntity,
      EmploymentTypeEntity,
      ExperienceLevelEntity,
    ]),
  ],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
  exports: [TaxonomyService, TypeOrmModule],
})
export class TaxonomyModule {}
