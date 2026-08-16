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

@Injectable()
export class CompensationService {
  constructor(
    @InjectRepository(CompensationPlanEntity)
    private readonly repo: Repository<CompensationPlanEntity>,
  ) {}

  /** Only staffing_agency org_type (or admin) may access compensation plans */
  private assertAgencyAccess(user: UserEntity) {
    if (user.role === UserRole.ADMIN) return;
    if (user.org_type !== OrgType.STAFFING_AGENCY) {
      throw new ForbiddenException('Compensation plans are only available to staffing agencies');
    }
  }

  async findAll(query: QueryCompensationPlansDto, user: UserEntity) {
    this.assertAgencyAccess(user);
    const { page, limit, sort, order, job_id, recruiter_id } = query;
    const where: Record<string, any> = {};
    if (user.role !== UserRole.ADMIN) {
      where.organization_id = user.organization_id;
    }
    if (job_id) where.job_id = job_id;
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
      user.role !== UserRole.ADMIN &&
      plan.organization_id !== user.organization_id
    ) {
      throw new ForbiddenException('Access denied');
    }
    return plan;
  }

  async create(dto: CreateCompensationPlanDto, user: UserEntity): Promise<CompensationPlanEntity> {
    this.assertAgencyAccess(user);
    const plan = this.repo.create({
      ...dto,
      organization_id: user.organization_id,
      created_by_role: user.role,
    } as any);
    return this.repo.save(plan) as unknown as Promise<CompensationPlanEntity>;
  }

  async update(id: number, dto: UpdateCompensationPlanDto, user: UserEntity): Promise<CompensationPlanEntity> {
    const plan = await this.findById(id, user);
    Object.assign(plan, dto);
    return this.repo.save(plan);
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    const plan = await this.findById(id, user);
    await this.repo.remove(plan);
  }
}
