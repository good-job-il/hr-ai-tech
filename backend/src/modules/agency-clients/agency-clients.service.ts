import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AgencyClientEntity } from './agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';
import { JobEntity } from '../jobs/entities/job.entity';
import { ApplicationEntity } from '../applications/entities/application.entity';
import { UserEntity } from '../users/user.entity';
import { CreateAgencyClientDto, QueryAgencyClientsDto, UpdateAgencyClientDto } from './dto/agency-clients.dto';
import { OrgType } from '../../common/enums/org-type.enum';

const ACTIVE_APPLICATION_STATUSES = [
  'new', 'reviewed', 'phone_interview', 'recommended',
  'employer_interview', 'offer', 'probation',
];

@Injectable()
export class AgencyClientsService {
  constructor(
    @InjectRepository(AgencyClientEntity) private readonly clientRepo: Repository<AgencyClientEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(ApplicationEntity) private readonly applicationRepo: Repository<ApplicationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private requireOrganization(user: UserEntity): number {
    if (user.org_type !== OrgType.STAFFING_AGENCY) {
      throw new ForbiddenException('Staffing agency context required');
    }
    if (!user.organization_id) throw new ForbiddenException('Organization context required');
    return user.organization_id;
  }

  async findAll(query: QueryAgencyClientsDto, user: UserEntity) {
    const organizationId = this.requireOrganization(user);
    const qb = this.clientRepo.createQueryBuilder('client')
      .innerJoin(CompanyEntity, 'company', 'company.id = client.company_id')
      .where('client.organization_id = :organizationId', { organizationId })
      .andWhere('company.is_deleted = false');

    if (query.status) qb.andWhere('client.status = :status', { status: query.status });
    if (query.industry) qb.andWhere('company.industry = :industry', { industry: query.industry });
    if (query.search) {
      qb.andWhere('(company.name LIKE :search OR client.contact_name LIKE :search OR client.contact_email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();
    const clients = await qb
      .orderBy('company.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getMany();
    const data = await this.hydrate(clients, organizationId);
    return { data, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  async findById(id: number, user: UserEntity) {
    const organizationId = this.requireOrganization(user);
    const client = await this.clientRepo.findOne({ where: { id, organization_id: organizationId } });
    if (!client) throw new NotFoundException(`Agency client ${id} not found`);
    const [result] = await this.hydrate([client], organizationId);
    return result;
  }

  async create(dto: CreateAgencyClientDto, user: UserEntity) {
    const organizationId = this.requireOrganization(user);
    const createdId = await this.dataSource.transaction(async manager => {
      let company: CompanyEntity | null = null;
      if (dto.company_id) {
        company = await manager.findOne(CompanyEntity, { where: { id: dto.company_id, is_deleted: false } });
        if (!company) throw new NotFoundException(`Company ${dto.company_id} not found`);
      } else {
        const companyName = dto.name!;
        company = manager.create(CompanyEntity, {
          name: companyName,
          industry: dto.industry ?? null,
          initials: dto.initials ?? this.initials(companyName),
          color: dto.color ?? '#7C3AED',
          logo_url: dto.logo_url ?? null,
          website: dto.website ?? null,
        });
        company = await manager.save(company);
      }

      const duplicate = await manager.findOne(AgencyClientEntity, {
        where: { organization_id: organizationId, company_id: company.id },
      });
      if (duplicate) throw new ConflictException('Company is already a client of this agency');

      const client = manager.create(AgencyClientEntity, {
        organization_id: organizationId,
        company_id: company.id,
        status: dto.status,
        account_manager_id: dto.account_manager_id ?? user.id,
        contact_name: dto.contact_name ?? null,
        contact_email: dto.contact_email ?? null,
        contact_phone: dto.contact_phone ?? null,
        address: dto.address ?? null,
        contract_type: dto.contract_type ?? null,
        contract_start_date: dto.contract_start_date ?? null,
        contract_end_date: dto.contract_end_date ?? null,
        placement_fee_percent: dto.placement_fee_percent ?? null,
        payment_terms_days: dto.payment_terms_days ?? null,
        notes: dto.notes ?? null,
      });
      return (await manager.save(client)).id;
    });
    return this.findById(createdId, user);
  }

  async update(id: number, dto: UpdateAgencyClientDto, user: UserEntity) {
    const organizationId = this.requireOrganization(user);
    const client = await this.clientRepo.findOne({ where: { id, organization_id: organizationId } });
    if (!client) throw new NotFoundException(`Agency client ${id} not found`);
    if (client.status === 'archived') throw new ConflictException('Archived client cannot be edited');

    const company = await this.companyRepo.findOne({ where: { id: client.company_id, is_deleted: false } });
    if (!company) throw new NotFoundException(`Company ${client.company_id} not found`);
    if (dto.name !== undefined) company.name = dto.name;
    if (dto.industry !== undefined) company.industry = dto.industry;
    if (dto.initials !== undefined) company.initials = dto.initials;
    if (dto.color !== undefined) company.color = dto.color;
    if (dto.logo_url !== undefined) company.logo_url = dto.logo_url;
    if (dto.website !== undefined) company.website = dto.website;
    await this.companyRepo.save(company);

    const relationshipFields = [
      'status', 'account_manager_id', 'contact_name', 'contact_email', 'contact_phone',
      'address', 'contract_type', 'contract_start_date', 'contract_end_date',
      'placement_fee_percent', 'payment_terms_days', 'notes',
    ];
    for (const field of relationshipFields) {
      if ((dto as any)[field] !== undefined) (client as any)[field] = (dto as any)[field];
    }
    await this.clientRepo.save(client);
    return this.findById(id, user);
  }

  async archive(id: number, user: UserEntity) {
    const organizationId = this.requireOrganization(user);
    const client = await this.clientRepo.findOne({ where: { id, organization_id: organizationId } });
    if (!client) throw new NotFoundException(`Agency client ${id} not found`);

    const openJobs = await this.jobRepo.count({
      where: { organization_id: organizationId, employer_company_id: client.company_id, is_closed: false, is_deleted: false },
    });
    const activeApplications = await this.applicationRepo.count({
      where: {
        organization_id: organizationId,
        employer_company_id: client.company_id,
        status: In(ACTIVE_APPLICATION_STATUSES) as any,
        is_deleted: false,
      },
    });
    if (openJobs || activeApplications) {
      throw new ConflictException({
        message: 'Client has active recruitment work and cannot be archived',
        open_jobs: openJobs,
        active_applications: activeApplications,
      });
    }
    client.status = 'archived';
    client.archived_at = new Date();
    client.archived_by = user.id;
    await this.clientRepo.save(client);
    return { success: true };
  }

  private async hydrate(clients: AgencyClientEntity[], organizationId: number) {
    if (!clients.length) return [];
    const companyIds = clients.map(client => client.company_id);
    const companies = await this.companyRepo.find({ where: { id: In(companyIds), is_deleted: false } });
    const companyMap = new Map(companies.map(company => [company.id, company]));

    const jobRows = await this.jobRepo.createQueryBuilder('job')
      .select('job.employer_company_id', 'company_id')
      .addSelect('COUNT(*)', 'total_jobs')
      .addSelect('SUM(CASE WHEN job.is_closed = false THEN 1 ELSE 0 END)', 'open_jobs')
      .where('job.organization_id = :organizationId', { organizationId })
      .andWhere('job.employer_company_id IN (:...companyIds)', { companyIds })
      .andWhere('job.is_deleted = false')
      .groupBy('job.employer_company_id')
      .getRawMany();
    const jobStats = new Map(jobRows.map(row => [Number(row.company_id), row]));

    const appRows = await this.applicationRepo.createQueryBuilder('application')
      .select('application.employer_company_id', 'company_id')
      .addSelect('COUNT(*)', 'total_applications')
      .addSelect("SUM(CASE WHEN application.status IN ('new','reviewed','phone_interview','recommended','employer_interview','offer','probation') THEN 1 ELSE 0 END)", 'in_process')
      .addSelect("SUM(CASE WHEN application.status = 'hired' THEN 1 ELSE 0 END)", 'hired')
      .where('application.organization_id = :organizationId', { organizationId })
      .andWhere('application.employer_company_id IN (:...companyIds)', { companyIds })
      .andWhere('application.is_deleted = false')
      .groupBy('application.employer_company_id')
      .getRawMany();
    const appStats = new Map(appRows.map(row => [Number(row.company_id), row]));

    return clients.flatMap(client => {
      const company = companyMap.get(client.company_id);
      if (!company) return [];
      const jobs = jobStats.get(client.company_id) || {};
      const apps = appStats.get(client.company_id) || {};
      return [{
        ...client,
        name: company.name,
        industry: company.industry,
        initials: company.initials,
        color: company.color,
        logo_url: company.logo_url,
        website: company.website,
        openJobs: Number(jobs.open_jobs || 0),
        totalJobs: Number(jobs.total_jobs || 0),
        inProcess: Number(apps.in_process || 0),
        hired: Number(apps.hired || 0),
        totalApplications: Number(apps.total_applications || 0),
        isActive: client.status === 'active',
      }];
    });
  }

  private initials(name: string) {
    return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }
}
