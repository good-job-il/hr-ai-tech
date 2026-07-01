import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryDataEntity } from './salary-data.entity';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryDataEntity])],
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService, TypeOrmModule],
})
export class SalaryModule {}

