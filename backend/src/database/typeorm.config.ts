import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { DomainEntity } from '../modules/taxonomy/entities/domain.entity';
import { RoleTaxonomyEntity } from '../modules/taxonomy/entities/role-taxonomy.entity';
import { SpecializationEntity } from '../modules/taxonomy/entities/specialization.entity';
import { WorkModeEntity } from '../modules/taxonomy/entities/work-mode.entity';
import { EmploymentTypeEntity } from '../modules/taxonomy/entities/employment-type.entity';
import { ExperienceLevelEntity } from '../modules/taxonomy/entities/experience-level.entity';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  database: configService.get<string>('DB_NAME', 'hire_israel'),
  username: configService.get<string>('DB_USER', 'hire_user'),
  password: configService.get<string>('DB_PASSWORD', 'hire_pass'),
  charset: 'utf8mb4',
  timezone: 'Z',
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
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations_history',
  logging: false,
});

