import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { EmailService } from './services/email.service';
import { LlmService } from './services/llm.service';

@Module({
  controllers: [IntegrationsController],
  providers: [EmailService, LlmService],
  exports: [EmailService, LlmService],
})
export class IntegrationsModule {}

