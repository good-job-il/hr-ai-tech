import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity, CompanyReviewEntity, StaffEntity } from './company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController, StaffController } from './companies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity, CompanyReviewEntity, StaffEntity])],
  controllers: [CompaniesController, StaffController],
  providers: [CompaniesService],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}

