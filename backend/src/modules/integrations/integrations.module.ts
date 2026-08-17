import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { EmailService } from './services/email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationConnectionEntity } from './integration-connection.entity';
import { IntegrationConnectionsService } from './integration-connections.service';
import { IntegrationConnectionsController } from './integration-connections.controller';
import { AuditModule } from '../audit/audit.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([IntegrationConnectionEntity]), AuditModule, PermissionsModule],
  controllers: [FilesController, IntegrationConnectionsController],
  providers: [EmailService, IntegrationConnectionsService],
  exports: [EmailService],
})
export class IntegrationsModule {}
