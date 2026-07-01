import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationLogEntity, EmployerTimelineEntity } from './communication-log.entity';
import { CommunicationService } from './communication.service';
import { CommunicationController, EmployerTimelineController } from './communication.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommunicationLogEntity, EmployerTimelineEntity])],
  controllers: [CommunicationController, EmployerTimelineController],
  providers: [CommunicationService],
  exports: [CommunicationService, TypeOrmModule],
})
export class CommunicationModule {}

