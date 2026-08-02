import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
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
    return user.role === UserRole.ADMIN && !user.impersonating;
  }

  private isOrganizationAdministrator(user: UserEntity) {
    return user.role === UserRole.ORG_ADMIN || (user.role === UserRole.ADMIN && Boolean(user.impersonating));
  }

  private requireOrganizationContext(user: UserEntity) {
    if (!user.organization_id || !user.org_type) {
      throw new ForbiddenException('Organization context is required');
    }
    return { organizationId: user.organization_id, orgType: user.org_type };
  }

  // ─── Permission Matrix ────────────────────────────────────────────────────
  async findMatrices(query: QueryPermissionMatricesDto, user: UserEntity) {
    const { page, limit, organization_id, org_type, role_key, is_template } = query;
    let where: Record<string, any> | Record<string, any>[] = {};
    if (!this.isPrivileged(user)) {
      const { organizationId, orgType } = this.requireOrganizationContext(user);
      if (is_template === true) {
        where = { organization_id: IsNull(), org_type: orgType, is_template: true };
      } else if (is_template === false) {
        where = { organization_id: organizationId, is_template: false };
      } else {
        where = [
          { organization_id: organizationId, is_template: false },
          { organization_id: IsNull(), org_type: orgType, is_template: true },
        ];
      }
    } else if (organization_id) {
      (where as Record<string, any>).organization_id = organization_id;
    }
    if (this.isPrivileged(user) && org_type) (where as Record<string, any>).org_type = org_type;
    if (role_key) {
      if (Array.isArray(where)) where = where.map(item => ({ ...item, role_key }));
      else where.role_key = role_key;
    }
    if (this.isPrivileged(user) && is_template !== undefined) (where as Record<string, any>).is_template = is_template;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.matrixRepo.findAndCount({ where, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createMatrix(dto: CreatePermissionMatrixDto, user: UserEntity): Promise<PermissionMatrixEntity> {
    if (!this.isPrivileged(user) && !this.isOrganizationAdministrator(user)) {
      throw new ForbiddenException('Insufficient permissions to create permission matrix');
    }
    const context = this.isPrivileged(user) ? null : this.requireOrganizationContext(user);
    const matrix = this.matrixRepo.create({
      ...dto,
      organization_id: this.isPrivileged(user) ? dto.organization_id : context!.organizationId,
      org_type: this.isPrivileged(user) ? dto.org_type : context!.orgType,
      is_template: this.isPrivileged(user) ? dto.is_template : false,
    } as any);
    return this.matrixRepo.save(matrix) as unknown as Promise<PermissionMatrixEntity>;
  }

  async updateMatrix(id: number, dto: UpdatePermissionMatrixDto, user: UserEntity): Promise<PermissionMatrixEntity> {
    const matrix = await this.matrixRepo.findOne({ where: { id } });
    if (!matrix) throw new NotFoundException(`Permission matrix ${id} not found`);
    if (!this.isPrivileged(user)) {
      const { organizationId } = this.requireOrganizationContext(user);
      if (!this.isOrganizationAdministrator(user) || matrix.organization_id !== organizationId || matrix.is_template) {
        throw new ForbiddenException('Access denied');
      }
      matrix.permissions = dto.permissions ?? matrix.permissions;
      return this.matrixRepo.save(matrix);
    }
    Object.assign(matrix, dto);
    return this.matrixRepo.save(matrix);
  }

  async removeMatrix(id: number, user: UserEntity): Promise<void> {
    if (!this.isPrivileged(user)) throw new ForbiddenException('Only admins can delete permission matrices');
    const matrix = await this.matrixRepo.findOne({ where: { id } });
    if (!matrix) throw new NotFoundException(`Permission matrix ${id} not found`);
    await this.matrixRepo.remove(matrix);
  }

  // ─── Role Templates ───────────────────────────────────────────────────────
  async findRoleTemplates(query: QueryRoleTemplatesDto, user: UserEntity) {
    const { page, limit, organization_id, org_type } = query;
    let where: Record<string, any> | Record<string, any>[] = {};
    if (!this.isPrivileged(user)) {
      const { organizationId, orgType } = this.requireOrganizationContext(user);
      where = [
        { organization_id: organizationId, org_type: orgType },
        { organization_id: IsNull(), org_type: orgType },
      ];
    } else if (organization_id) {
      where.organization_id = organization_id;
    }
    if (this.isPrivileged(user) && org_type) (where as Record<string, any>).org_type = org_type;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.templateRepo.findAndCount({ where, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createRoleTemplate(dto: CreateRoleTemplateDto, user: UserEntity): Promise<RoleTemplateEntity> {
    if (!this.isPrivileged(user) && !this.isOrganizationAdministrator(user)) {
      throw new ForbiddenException('Insufficient permissions to create role template');
    }
    const context = this.isPrivileged(user) ? null : this.requireOrganizationContext(user);
    const tpl = this.templateRepo.create({
      ...dto,
      organization_id: this.isPrivileged(user) ? dto.organization_id : context!.organizationId,
      org_type: this.isPrivileged(user) ? dto.org_type : context!.orgType,
    } as any);
    return this.templateRepo.save(tpl) as unknown as Promise<RoleTemplateEntity>;
  }

  async updateRoleTemplate(id: number, dto: UpdateRoleTemplateDto, user: UserEntity): Promise<RoleTemplateEntity> {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException(`Role template ${id} not found`);
    if (!this.isPrivileged(user)) {
      const { organizationId } = this.requireOrganizationContext(user);
      if (!this.isOrganizationAdministrator(user) || tpl.organization_id !== organizationId) {
        throw new ForbiddenException('Access denied');
      }
      if (dto.display_name !== undefined) tpl.display_name = dto.display_name;
      return this.templateRepo.save(tpl);
    }
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  async removeRoleTemplate(id: number, user: UserEntity): Promise<void> {
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

  async updateUserPositionAccess(id: number, dto: UpdateUserPositionAccessDto): Promise<UserPositionAccessEntity> {
    const access = await this.accessRepo.findOne({ where: { id } });
    if (!access) throw new NotFoundException(`User position access ${id} not found`);
    Object.assign(access, dto);
    return this.accessRepo.save(access);
  }

  async removeUserPositionAccess(id: number): Promise<void> {
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

  async updatePosition(id: number, dto: UpdatePositionDto): Promise<PositionEntity> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) throw new NotFoundException(`Position ${id} not found`);
    Object.assign(position, dto);
    return this.positionRepo.save(position);
  }

  async removePosition(id: number): Promise<void> {
    const position = await this.positionRepo.findOne({ where: { id } });
    if (!position) throw new NotFoundException(`Position ${id} not found`);
    await this.positionRepo.remove(position);
  }
}
