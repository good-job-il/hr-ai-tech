import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { DomainEntity } from '../modules/taxonomy/entities/domain.entity';
import { RoleTaxonomyEntity } from '../modules/taxonomy/entities/role-taxonomy.entity';
import { SpecializationEntity } from '../modules/taxonomy/entities/specialization.entity';
import { WorkModeEntity } from '../modules/taxonomy/entities/work-mode.entity';
import { EmploymentTypeEntity } from '../modules/taxonomy/entities/employment-type.entity';
import { ExperienceLevelEntity } from '../modules/taxonomy/entities/experience-level.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        database: config.get<string>('DB_NAME', 'hire_israel'),
        username: config.get<string>('DB_USER', 'hire_user'),
        password: config.get<string>('DB_PASSWORD', 'hire_pass'),
        entities: [
          UserEntity,
          OrganizationEntity,
          DomainEntity,
          RoleTaxonomyEntity,
          SpecializationEntity,
          WorkModeEntity,
          EmploymentTypeEntity,
          ExperienceLevelEntity,
        ],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
        charset: 'utf8mb4',
        timezone: 'Z',
        extra: {
          connectionLimit: 10,
        },
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        migrationsTableName: 'migrations_history',
      }),
    }),
  ],
})
export class DatabaseModule {}

