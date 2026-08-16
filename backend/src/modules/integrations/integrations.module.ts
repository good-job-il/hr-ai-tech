import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { EmailService } from './services/email.service';

@Module({
  controllers: [FilesController],
  providers: [EmailService],
  exports: [EmailService],
})
export class IntegrationsModule {}
