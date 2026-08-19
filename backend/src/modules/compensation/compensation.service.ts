import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompensationPlanEntity } from './compensation-plan.entity';
import {
  CreateCompensationPlanDto,
  UpdateCompensationPlanDto,
  QueryCompensationPlansDto,
} from './dto/compensation.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrgType } from '../../common/enums/org-type.enum';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';
import { JobEntity } from '../jobs/entities/job.entity';
import { AgencyClientEntity } from '../agency-clients/agency-client.entity';
import { CompanyEntity } from '../companies/company.entity';
import { UserEntity as OrganizationUserEntity } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CompensationService {
  constructor(
    @InjectRepository(CompensationPlanEntity)
    private readonly repo: Repository<CompensationPlanEntity>,
    @InjectRepository(JobEntity) private readonly jobs: Repository<JobEntity>,
    @InjectRepository(AgencyClientEntity) private readonly clients: Repository<AgencyClientEntity>,
    @InjectRepository(CompanyEntity) private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(OrganizationUserEntity) private readonly users: Repository<OrganizationUserEntity>,
    private readonly audit: AuditService,
  ) {}

  private isPlatformAdmin(user: UserEntity) {
    return user.role === UserRole.ADMIN && !user.impersonating;
  }

  /** Only staffing_agency org_type (or admin) may access compensation plans */
  private assertAgencyAccess(user: UserEntity) {
    if (this.isPlatformAdmin(user)) return;
    if (user.org_type !== OrgType.STAFFING_AGENCY) {
      throw new ForbiddenException('Compensation plans are only available to staffing agencies');
    }
  }

  async findAll(query: QueryCompensationPlansDto, user: UserEntity) {
    this.assertAgencyAccess(user);
    const { page, limit, sort, order, job_id, employer_company_id, recruiter_id } = query;
    const where: Record<string, any> = {};
    if (!this.isPlatformAdmin(user)) {
      where.organization_id = user.organization_id;
      if (user.role === UserRole.RECRUITER) where.recruiter_id = user.id;
      if (user.role === UserRole.TEAM_MANAGER) where.team_manager_id = user.id;
    }
    if (job_id) where.job_id = job_id;
    if (employer_company_id) where.employer_company_id = employer_company_id;
    if (recruiter_id) where.recruiter_id = recruiter_id;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async findById(id: number, user: UserEntity): Promise<CompensationPlanEntity> {
    this.assertAgencyAccess(user);
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Compensation plan ${id} not found`);
    if (
      !this.isPlatformAdmin(user) &&
      plan.organization_id !== user.organization_id
    ) {
      throw new ForbiddenException('Access denied');
    }
    return plan;
  }

  async create(dto: CreateCompensationPlanDto, user: UserEntity): Promise<CompensationPlanEntity> {
    this.assertAgencyAccess(user);
    const relations = await this.resolveRelations(dto, user);
    const plan = this.repo.create({
      ...dto,
      ...relations,
      organization_id: user.organization_id,
      created_by_role: user.role,
    } as any);
    const saved = await this.repo.save(plan) as unknown as CompensationPlanEntity;
    await this.logChange(saved, user, null);
    return saved;
  }

  async update(id: number, dto: UpdateCompensationPlanDto, user: UserEntity): Promise<CompensationPlanEntity> {
    const plan = await this.findById(id, user);
    const before = { ...plan };
    const relations = await this.resolveRelations({ ...plan, ...dto }, user);
    Object.assign(plan, dto);
    Object.assign(plan, relations);
    const saved = await this.repo.save(plan);
    await this.logChange(saved, user, before);
    return saved;
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    const plan = await this.findById(id, user);
    await this.logChange(plan, user, { ...plan }, 'delete');
    await this.repo.remove(plan);
  }

  private async resolveRelations(dto: Record<string, any>, user: UserEntity) {
    const isPlatformAdmin = this.isPlatformAdmin(user);
    if (!user.organization_id && !isPlatformAdmin) throw new ForbiddenException('Organization context required');
    const organizationId = user.organization_id;
    const job = dto.job_id
      ? await this.jobs.findOne({ where: isPlatformAdmin ? { id: dto.job_id } : { id: dto.job_id, organization_id: organizationId } })
      : null;
    if (dto.job_id && !job) throw new NotFoundException(`Job ${dto.job_id} not found`);
    const companyId = dto.employer_company_id ?? job?.employer_company_id;
    if (!companyId) throw new ForbiddenException('An agency client or job is required');
    if (job?.employer_company_id !== companyId) throw new ForbiddenException('Job and client do not belong together');
    const client = await this.clients.findOne({
      where: { organization_id: organizationId!, company_id: companyId, status: 'active' },
    });
    if (!client && !isPlatformAdmin) throw new ForbiddenException('The selected company is not an active agency client');
    const company = await this.companies.findOne({ where: { id: companyId, is_deleted: false } });
    if (!company) throw new NotFoundException(`Company ${companyId} not found`);
    const assigneeIds = [dto.recruiter_id, dto.team_manager_id, dto.recruitment_manager_id].filter((id): id is number => id != null);
    for (const id of assigneeIds) {
      const member = await this.users.findOne({ where: { id, organization_id: organizationId } });
      if (!member) throw new ForbiddenException(`User ${id} belongs to another organization`);
    }
    return {
      employer_company_id: companyId,
      agency_client_id: client?.id ?? dto.agency_client_id ?? null,
      client_name: company.name,
    };
  }

  private async logChange(plan: CompensationPlanEntity, user: UserEntity, before: unknown, action = 'compensation_change') {
    await this.audit.log({
      organization_id: plan.organization_id == null ? null : String(plan.organization_id),
      actor_user_id: String(user.id), actor_email: user.email, actor_role: user.role,
      entity_type: 'CompensationPlan', entity_id: plan.id, entity_label: plan.client_name,
      action, metadata: { before, after: action === 'delete' ? null : plan },
    });
  }
}
