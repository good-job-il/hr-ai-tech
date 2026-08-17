import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEntity } from './entities/candidate.entity';
import { CandidateNoteEntity } from './entities/candidate-note.entity';
import { CandidateTagEntity } from './entities/candidate-tag.entity';
import { CandidateDocumentEntity } from './entities/candidate-document.entity';
import { CandidateTimelineEntity } from './entities/candidate-timeline.entity';
import { CandidateImportBatchEntity } from './entities/candidate-import-batch.entity';
import { CandidateProfileEntity } from './entities/candidate-profile.entity';
import { CandidateAccessEntity } from './entities/candidate-access.entity';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { UserEntity } from '../users/user.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateEntity,
      CandidateNoteEntity,
      CandidateTagEntity,
      CandidateDocumentEntity,
      CandidateTimelineEntity,
      CandidateImportBatchEntity,
      CandidateProfileEntity,
      CandidateAccessEntity,
      UserEntity,
      ApplicationEntity,
    ]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService, TypeOrmModule],
})
export class CandidatesModule {}
