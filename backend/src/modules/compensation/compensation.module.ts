import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationPlanEntity } from './compensation-plan.entity';
import { CompensationService } from './compensation.service';
import { CompensationController } from './compensation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompensationPlanEntity])],
  controllers: [CompensationController],
  providers: [CompensationService],
  exports: [CompensationService, TypeOrmModule],
})
export class CompensationModule {}

