import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewEntity } from './interview.entity';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewEntity])],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService, TypeOrmModule],
})
export class InterviewsModule {}

