import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  QueryOrganizationsDto,
} from './dto/organizations.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  buildPaginatedResponse,
  getSkipTake,
} from '../../common/utils/pagination.utils';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly repo: Repository<OrganizationEntity>,
  ) {}

  async findAll(query: QueryOrganizationsDto, user: UserEntity) {
    const { page, limit, sort, order, org_type, status, search } = query;

    // Non-admin users can only see their own org
    if (user.role !== UserRole.ADMIN) {
      const org = user.organization_id
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

  async findById(id: string, user: UserEntity): Promise<OrganizationEntity> {
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

  async update(
    id: string,
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

    Object.assign(org, dto);
    return this.repo.save(org);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete organizations');
    }

    const org = await this.repo.findOne({ where: { id } });
    if (!org) throw new NotFoundException(`Organization ${id} not found`);

    await this.repo.remove(org);
  }
}

