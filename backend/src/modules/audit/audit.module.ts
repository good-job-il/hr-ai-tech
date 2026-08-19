import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [forwardRef(() => PermissionsModule), TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}

