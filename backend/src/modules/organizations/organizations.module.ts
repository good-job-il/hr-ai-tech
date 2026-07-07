import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from '../users/user.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, UserEntity])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService, TypeOrmModule],
})
export class OrganizationsModule {}

