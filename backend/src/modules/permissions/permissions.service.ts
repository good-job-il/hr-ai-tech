import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PermissionMatrixEntity,
  RoleTemplateEntity,
  RoleAliasEntity,
  UserPositionAccessEntity,
  PositionEntity,
} from './permissions.entities';
import {
  CreatePermissionMatrixDto,
  UpdatePermissionMatrixDto,
  QueryPermissionMatricesDto,
  CreateRoleTemplateDto,
  UpdateRoleTemplateDto,
  QueryRoleTemplatesDto,
  CreateRoleAliasDto,
  CreateUserPositionAccessDto,
  UpdateUserPositionAccessDto,
  CreatePositionDto,
  UpdatePositionDto,
  QueryPositionsDto,
} from './dto/permissions.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(PermissionMatrixEntity)
    private readonly matrixRepo: Repository<PermissionMatrixEntity>,
    @InjectRepository(RoleTemplateEntity)
    private readonly templateRepo: Repository<RoleTemplateEntity>,
    @InjectRepository(RoleAliasEntity)
    private readonly aliasRepo: Repository<RoleAliasEntity>,
    @InjectRepository(UserPositionAccessEntity)
    private readonly accessRepo: Repository<UserPositionAccessEntity>,
    @InjectRepository(PositionEntity)
    private readonly positionRepo: Repository<PositionEntity>,
  ) {}

  private isPrivileged(user: UserEntity) {
    return user.role === UserRole.ADMIN;
  }

  // ─── Permission Matrix ────────────────────────────────────────────────────
  async findMatrices(query: QueryPermissionMatricesDto, user: UserEntity) {
    const { page, limit, organization_id, role_key, is_template } = query;
    const where: Record<string, any> = {};
    if (!this.isPrivileged(user)) {
      where.organization_id = organization_id ?? user.organization_id;
    } else if (organization_id) {
      where.organization_id = organization_id;
    }
    if (role_key) where.role_key = role_key;
    if (is_template !== undefined) where.is_template = is_template;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.matrixRepo.findAndCount({ where, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createMatrix(dto: CreatePermissionMatrixDto, user: UserEntity): Promise<PermissionMatrixEntity> {
    if (!this.isPrivileged(user) && user.role !== UserRole.ORG_ADMIN) {
      throw new ForbiddenException('Insufficient permissions to create permission matrix');
    }
    const matrix = this.matrixRepo.create({
      ...dto,
      organization_id: this.isPrivileged(user) ? dto.organization_id : user.organization_id,
    } as any);
    return this.matrixRepo.save(matrix) as unknown as Promise<PermissionMatrixEntity>;
  }

  async updateMatrix(id: string, dto: UpdatePermissionMatrixDto, user: UserEntity): Promise<PermissionMatrixEntity> {
    const matrix = await this.matrixRepo.findOne({ where: { id } });
    if (!matrix) throw new NotFoundException(`Permission matrix ${id} not found`);
    if (!this.isPrivileged(user) && matrix.organization_id !== user.organization_id) {
      throw new ForbiddenException('Access denied');
    }
    Object.assign(matrix, dto);
    return this.matrixRepo.save(matrix);
  }

  async removeMatrix(id: string, user: UserEntity): Promise<void> {
    if (!this.isPrivileged(user)) throw new ForbiddenException('Only admins can delete permission matrices');
    const matrix = await this.matrixRepo.findOne({ where: { id } });
    if (!matrix) throw new NotFoundException(`Permission matrix ${id} not found`);
    await this.matrixRepo.remove(matrix);
  }

  // ─── Role Templates ───────────────────────────────────────────────────────
  async findRoleTemplates(query: QueryRoleTemplatesDto, user: UserEntity) {
    const { page, limit, organization_id, org_type } = query;
    const where: Record<string, any> = {};
    if (!this.isPrivileged(user)) {
      where.organization_id = organization_id ?? user.organization_id;
    } else if (organization_id) {
      where.organization_id = organization_id;
    }
    if (org_type) where.org_type = org_type;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.templateRepo.findAndCount({ where, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createRoleTemplate(dto: CreateRoleTemplateDto, user: UserEntity): Promise<RoleTemplateEntity> {
    if (!this.isPrivileged(user)) throw new ForbiddenException('Only admins can create role templates');
    const tpl = this.templateRepo.create(dto as any);
    return this.templateRepo.save(tpl) as unknown as Promise<RoleTemplateEntity>;
  }

  async updateRoleTemplate(id: string, dto: UpdateRoleTemplateDto, user: UserEntity): Promise<RoleTemplateEntity> {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException(`Role template ${id} not found`);
    if (!this.isPrivileged(user) && !(user.role === UserRole.ORG_ADMIN && tpl.organization_id === user.organization_id)) {
      throw new ForbiddenException('Access denied');
    }
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  async removeRoleTemplate(id: string, user: UserEntity): Promise<void> {
    if (!this.isPrivileged(user)) throw new ForbiddenException('Only admins can delete role templates');
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException(`Role template ${id} not found`);
    await this.templateRepo.remove(tpl);
  }

  // ─── Role Aliases ─────────────────────────────────────────────────────────
  async findRoleAliases() {
    return this.aliasRepo.find();
  }

  async createRoleAlias(dto: CreateRoleAliasDto): Promise<RoleAliasEntity> {
    const alias = this.aliasRepo.create(dto as any);
    return this.aliasRepo.save(alias) as unknown as Promise<RoleAliasEntity>;
  }

  // ─── User Position Access ─────────────────────────────────────────────────
  async findUserPositionAccess(companyEmail: string) {
    return this.accessRepo.find({ where: { company_email: companyEmail } });
  }

  async createUserPositionAccess(dto: CreateUserPositionAccessDto): Promise<UserPositionAccessEntity> {
    const access = this.accessRepo.create(dto as any);
    return this.accessRepo.save(access) as unknown as Promise<UserPositionAccessEntity>;
  }

  async updateUserPositionAccess(id: string, dto: UpdateUserPositionAccessDto): Promise<UserPositionAccessEntity> {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`User position access ${id} not found`);
    Object.assign(access, dto);
    return this.accessRepo.save(access);
  }

  async removeUserPositionAccess(id: string): Promise<void> {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`User position access ${id} not found`);
    await this.accessRepo.remove(access);
  }

  // ─── Positions ────────────────────────────────────────────────────────────
  async findPositions(query: QueryPositionsDto) {
    const { page, limit, company_email, is_active } = query;
    const where: Record<string, any> = {};
    if (company_email) where.company_email = company_email;
    if (is_active !== undefined) where.is_active = is_active;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.positionRepo.findAndCount({ where, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createPosition(dto: CreatePositionDto): Promise<PositionEntity> {
    const position = this.positionRepo.create(dto as any);
    return this.positionRepo.save(position) as unknown as Promise<PositionEntity>;
  }

  async updatePosition(id: string, dto: UpdatePositionDto): Promise<PositionEntity> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) throw new NotFoundException(`Position ${id} not found`);
    Object.assign(position, dto);
    return this.positionRepo.save(position);
  }

  async removePosition(id: string): Promise<void> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) throw new NotFoundException(`Position ${id} not found`);
    await this.positionRepo.remove(position);
  }
}

