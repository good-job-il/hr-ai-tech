import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainEntity } from './entities/domain.entity';
import { RoleTaxonomyEntity } from './entities/role-taxonomy.entity';
import { SpecializationEntity } from './entities/specialization.entity';
import { WorkModeEntity } from './entities/work-mode.entity';
import { EmploymentTypeEntity } from './entities/employment-type.entity';
import { ExperienceLevelEntity } from './entities/experience-level.entity';

@Injectable()
export class TaxonomyService {
  constructor(
    @InjectRepository(DomainEntity)
    private readonly domainRepo: Repository<DomainEntity>,
    @InjectRepository(RoleTaxonomyEntity)
    private readonly roleRepo: Repository<RoleTaxonomyEntity>,
    @InjectRepository(SpecializationEntity)
    private readonly specRepo: Repository<SpecializationEntity>,
    @InjectRepository(WorkModeEntity)
    private readonly workModeRepo: Repository<WorkModeEntity>,
    @InjectRepository(EmploymentTypeEntity)
    private readonly employmentTypeRepo: Repository<EmploymentTypeEntity>,
    @InjectRepository(ExperienceLevelEntity)
    private readonly experienceLevelRepo: Repository<ExperienceLevelEntity>,
  ) {}

  getDomains() {
    return this.domainRepo.find({ order: { name: 'ASC' } });
  }

  getDomain(domainId: number) {
    return this.domainRepo.findOne({ where: { domain_id: domainId } });
  }

  getRoles(domainId?: number) {
    const where: any = domainId ? { domain_id: domainId } : {};
    return this.roleRepo.find({ where, order: { name: 'ASC' } });
  }

  getSpecializations(roleName?: string) {
    const where: any = roleName ? { role_name: roleName } : {};
    return this.specRepo.find({ where, order: { name: 'ASC' } });
  }

  getWorkModes() {
    return this.workModeRepo.find({ order: { name: 'ASC' } });
  }

  getEmploymentTypes() {
    return this.employmentTypeRepo.find({ order: { name: 'ASC' } });
  }

  getExperienceLevels() {
    return this.experienceLevelRepo.find({ order: { level_id: 'ASC' } });
  }

  /** Load all taxonomy in one request — used by frontend's loadTaxonomy function */
  async loadAll() {
    const [domains, roles, specializations, workModes, employmentTypes, experienceLevels] =
      await Promise.all([
        this.getDomains(),
        this.getRoles(),
        this.getSpecializations(),
        this.getWorkModes(),
        this.getEmploymentTypes(),
        this.getExperienceLevels(),
      ]);

    return {
      domains,
      roles,
      specializations,
      workModes,
      employmentTypes,
      experienceLevels,
    };
  }

  // ─── Upsert helpers (for seeding) ─────────────────────────────────────
  async upsertDomain(data: { domain_id: number; name: string }) {
    return this.domainRepo.save(this.domainRepo.create(data));
  }

  async upsertRole(data: { role_id: number; domain_id: number; domain_name?: string; name: string }) {
    return this.roleRepo.save(this.roleRepo.create(data));
  }

  async upsertSpecialization(data: { specialization_id: number; role_name: string; name: string }) {
    return this.specRepo.save(this.specRepo.create(data));
  }

  async upsertWorkMode(data: { mode_id: number; name: string }) {
    return this.workModeRepo.save(this.workModeRepo.create(data));
  }

  async upsertEmploymentType(data: { type_id: number; name: string }) {
    return this.employmentTypeRepo.save(this.employmentTypeRepo.create(data));
  }

  async upsertExperienceLevel(data: { level_id: number; name: string }) {
    return this.experienceLevelRepo.save(this.experienceLevelRepo.create(data));
  }
}

