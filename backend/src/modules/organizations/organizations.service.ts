import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OrganizationEntity, OrgStatus, OrgPlan } from './organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  QueryOrganizationsDto,
  OnboardAgencyDto,
} from './dto/organizations.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrgType } from '../../common/enums/org-type.enum';
import {
  buildPaginatedResponse,
  getSkipTake,
} from '../../common/utils/pagination.utils';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly repo: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: QueryOrganizationsDto, user: UserEntity) {
    const { page, limit, sort, order, org_type, status, search } = query;

    // Non-admin users can only see their own org
    if (user.role !== UserRole.ADMIN) {
      const org = user.organization_id != null
        ? await this.repo.findOne({ where: { id: user.organization_id } })
        : null;
      const data = org ? [org] : [];
      return buildPaginatedResponse(data, data.length, { page, limit, sort, order });
    }

    const where: Record<string, any> = {};
    if (org_type) where.org_type = org_type;
    if (status) where.status = status;

    const skip = getSkipTake(page, limit).skip;
    const take = getSkipTake(page, limit).take;

    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, name: Like(`%${search}%`) },
        { ...where, contact_email: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.repo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    });

    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number, user: UserEntity): Promise<OrganizationEntity> {
    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    // Non-admins can only view their own org
    if (
      user.role !== UserRole.ADMIN &&
      user.organization_id !== id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return org;
  }

  async create(dto: CreateOrganizationDto, user: UserEntity): Promise<OrganizationEntity> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create organizations');
    }

    const org = this.repo.create(dto as any);
    return (this.repo.save(org) as unknown) as Promise<OrganizationEntity>;
  }

  // ── Self-service onboarding ─────────────────────────────────────────────
  // Allows a freshly-registered org_admin who has no organization yet to
  // create their own staffing agency and be linked to it immediately.
  // Unlike `create()` (admin-only, any org_type), this is intentionally
  // narrow: only ORG_ADMIN, only when they don't already belong to an org,
  // and org_type is always forced to STAFFING_AGENCY.
  async onboardAgency(dto: OnboardAgencyDto, user: UserEntity): Promise<OrganizationEntity> {
    if (user.role !== UserRole.ORG_ADMIN) {
      throw new ForbiddenException('Only an organization admin can create an agency');
    }
    if (user.organization_id) {
      throw new ForbiddenException('You already belong to an organization');
    }

    const org = this.repo.create({
      name: dto.name,
      org_type: OrgType.STAFFING_AGENCY,
      status: OrgStatus.ACTIVE,
      plan: OrgPlan.TRIAL,
      contact_email: dto.contact_email ?? null,
      logo_url: dto.logo_url ?? null,
    });
    const saved = (await this.repo.save(org)) as unknown as OrganizationEntity;

    await this.userRepo.update(user.id, {
      organization_id: saved.id,
      org_type: OrgType.STAFFING_AGENCY,
    });

    return saved;
  }

  async update(
    id: number,
    dto: UpdateOrganizationDto,
    user: UserEntity,
  ): Promise<OrganizationEntity> {
    const org = await this.findById(id, user);

    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.ORG_ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions to update organization');
    }

    if (user.role !== UserRole.ADMIN) {
      const platformOnlyFields: (keyof UpdateOrganizationDto)[] = ['org_type', 'status', 'plan'];
      if (platformOnlyFields.some((field) => dto[field] !== undefined)) {
        throw new ForbiddenException('Only platform admins can change organization type, status or plan');
      }
    }

    const before = { name: org.name, contact_email: org.contact_email, status: org.status, plan: org.plan };
    Object.assign(org, dto);
    const saved = await this.repo.save(org);
    await this.audit.log({
      organization_id: String(saved.id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
      entity_type: 'Organization',
      entity_id: saved.id,
      entity_label: saved.name,
      action: 'update',
      metadata: { before, after: dto },
    });
    return saved;
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete organizations');
    }

    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    await this.repo.remove(org);
  }
}
