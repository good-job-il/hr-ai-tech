import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, Like, FindManyOptions } from "typeorm"
import * as bcrypt from "bcrypt"
import { randomBytes, createHash } from "crypto"
import { UserEntity } from "./user.entity"
import {
  CreateUserDto,
  InviteOrganizationUserDto,
  UpdateUserDto,
  QueryUsersDto,
} from "./dto/users.dto"
import { EmailService } from "../integrations/services/email.service"
import { UserRole } from "../../common/enums/user-role.enum"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { AuditService } from "../audit/audit.service"
import { OrganizationEntity } from "../organizations/organization.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { OrgType } from "../../common/enums/org-type.enum"
import {
  emailAlreadyExistsException,
  isUniqueConstraintViolation,
} from "../../common/utils/user-email-conflict.utils"

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizations: Repository<OrganizationEntity>,
    @InjectRepository(AgencyTeamEntity)
    private readonly teams: Repository<AgencyTeamEntity>,
    private readonly emailService: EmailService,
    private readonly audit: AuditService,
  ) {}

  private leadershipLimitException(role: UserRole): ConflictException {
    if (role === UserRole.ORG_ADMIN) {
      return new ConflictException({
        code: "STAFFING_ORG_ADMIN_LIMIT",
        message: "A staffing agency can only have one organization admin",
      })
    }

    return new ConflictException({
      code: "STAFFING_RECRUITMENT_MANAGER_LIMIT",
      message: "A staffing agency can only have one recruitment manager",
    })
  }

  private async assertStaffingLeadershipRoleAvailable(
    role: UserRole,
    organizationId: number | null,
    orgType: OrgType | null,
    currentUserId?: number,
  ): Promise<void> {
    if (
      !organizationId ||
      orgType !== OrgType.STAFFING_AGENCY ||
      ![UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER].includes(role)
    ) {
      return
    }

    const existing = await this.repo.findOne({ where: { organization_id: organizationId, role } })

    if (existing && existing.id !== currentUserId) {
      throw this.leadershipLimitException(role)
    }
  }

  private throwStaffingLeadershipConstraint(error: unknown): void {
    if (isUniqueConstraintViolation(error, ["UQ_users_staffing_org_admin"])) {
      throw this.leadershipLimitException(UserRole.ORG_ADMIN)
    }

    if (isUniqueConstraintViolation(error, ["UQ_users_staffing_recruitment_manager"])) {
      throw this.leadershipLimitException(UserRole.RECRUITMENT_MANAGER)
    }
  }

  private async createManagerTeam(manager: UserEntity): Promise<void> {
    if (
      manager.role !== UserRole.TEAM_MANAGER ||
      manager.org_type !== OrgType.STAFFING_AGENCY ||
      !manager.organization_id
    ) {
      return
    }

    const suffix = ` (${manager.id})`

    const base = `${manager.full_name?.trim() || manager.email} Team`

    const name = `${base.slice(0, 120 - suffix.length)}${suffix}`

    const team = await this.teams.save(
      this.teams.create({
        organization_id: manager.organization_id,
        name,
        description: null,
        manager_id: manager.id,
        recruitment_manager_id: manager.recruitment_manager_id ?? null,
        is_active: true,
      }),
    )

    manager.team_id = team.id
    await this.repo.save(manager)
  }

  private async logUserAdminChange(
    actor: UserEntity,
    target: UserEntity,
    action: "create" | "update" | "delete" | "deactivate",
    metadata: Record<string, any>,
  ) {
    await this.audit.log({
      organization_id: target.organization_id == null ? null : String(target.organization_id),
      actor_user_id: String(actor.id),
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: "User",
      entity_id: target.id,
      entity_label: target.email,
      action,
      metadata,
    })
  }

  async findAll(query: QueryUsersDto, requestingUser: UserEntity) {
    const { page, limit, sort, order, role, organization_id, is_active, search } = query

    const where: Record<string, any> = {}

    // Admins see all; org users see their org only
    if (requestingUser.role !== UserRole.ADMIN) {
      where.organization_id = requestingUser.organization_id
    }

    if (requestingUser.role === UserRole.TEAM_MANAGER) {
      if (!requestingUser.team_id) {
        return buildPaginatedResponse([], 0, { page, limit, sort, order })
      }

      where.team_id = requestingUser.team_id
    }

    if (role) {
      where.role = role
    }

    if (organization_id && requestingUser.role === UserRole.ADMIN) {
      where.organization_id = organization_id
    }

    if (is_active !== undefined) {
      where.is_active = is_active
    }

    const findOptions: FindManyOptions<UserEntity> = {
      where,
      order: { [sort ?? "created_date"]: order ?? "DESC" },
      skip: getSkipTake(page, limit).skip,
      take: getSkipTake(page, limit).take,
    }

    // Full-text search (basic LIKE)
    if (search) {
      findOptions.where = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
      ]
    }

    const [data, total] = await this.repo.findAndCount(findOptions)

    return buildPaginatedResponse(
      data.map((u) => this.sanitize(u)),
      total,
      { page, limit, sort, order },
    )
  }

  async findById(id: number, requestingUser: UserEntity): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User ${id} not found`)
    }

    // Can only view own user or same org (admins unrestricted)
    if (
      requestingUser.role !== UserRole.ADMIN &&
      user.id !== requestingUser.id &&
      user.organization_id !== requestingUser.organization_id
    ) {
      throw new ForbiddenException("Access denied")
    }

    if (
      requestingUser.role === UserRole.TEAM_MANAGER &&
      user.id !== requestingUser.id &&
      (!requestingUser.team_id || user.team_id !== requestingUser.team_id)
    ) {
      throw new NotFoundException(`User ${id} not found`)
    }

    return user
  }

  async update(id: number, dto: UpdateUserDto, requestingUser: UserEntity): Promise<UserEntity> {
    const user = await this.findById(id, requestingUser)

    const previousRole = user.role

    // Platform admins and organization admins may change roles. Organization
    // admins remain confined to their own tenant and non-platform roles.
    if (dto.role && ![UserRole.ADMIN, UserRole.ORG_ADMIN].includes(requestingUser.role)) {
      throw new ForbiddenException("Only administrators can change user roles")
    }

    if (requestingUser.role === UserRole.ORG_ADMIN) {
      if (user.organization_id !== requestingUser.organization_id) {
        throw new ForbiddenException("Access denied")
      }

      if (
        user.id === requestingUser.id ||
        user.role === UserRole.ORG_ADMIN ||
        user.role === UserRole.ADMIN
      ) {
        throw new ForbiddenException(
          "Organization administrators cannot manage administrator accounts",
        )
      }

      if (
        dto.organization_id !== undefined ||
        dto.org_type !== undefined ||
        dto.employer_company_id !== undefined
      ) {
        throw new ForbiddenException("Organization ownership cannot be changed")
      }

      if (dto.role === UserRole.ADMIN || dto.role === UserRole.ORG_ADMIN) {
        throw new ForbiddenException("Role cannot be assigned")
      }
    }

    const before = {
      role: user.role,
      organization_id: user.organization_id,
      is_active: user.is_active,
    }

    const targetOrganizationId =
      dto.organization_id !== undefined ? dto.organization_id : user.organization_id

    const targetOrganization = targetOrganizationId
      ? await this.organizations.findOne({ where: { id: targetOrganizationId } })
      : null

    const targetOrgType = (targetOrganization?.org_type ??
      dto.org_type ??
      user.org_type) as OrgType | null

    const targetRole = (dto.role ?? user.role) as UserRole

    await this.assertStaffingLeadershipRoleAvailable(
      targetRole,
      targetOrganizationId,
      targetOrgType,
      user.id,
    )

    Object.assign(user, dto, { org_type: targetOrganizationId ? targetOrgType : null })

    let saved: UserEntity

    try {
      saved = await this.repo.save(user)
    } catch (error) {
      this.throwStaffingLeadershipConstraint(error)
      throw error
    }

    if (previousRole !== UserRole.TEAM_MANAGER && saved.role === UserRole.TEAM_MANAGER) {
      await this.createManagerTeam(saved)
    }

    await this.logUserAdminChange(requestingUser, saved, "update", {
      before,
      after: {
        role: saved.role,
        organization_id: saved.organization_id,
        is_active: saved.is_active,
      },
    })

    return this.sanitize(saved)
  }

  async invite(dto: InviteOrganizationUserDto, requestingUser: UserEntity): Promise<any> {
    const organizationId = requestingUser.organization_id

    if (!organizationId) {
      throw new ForbiddenException("An organization workspace is required")
    }

    const email = dto.email.toLowerCase().trim()

    if (await this.repo.findOne({ where: { email } })) {
      throw emailAlreadyExistsException()
    }

    await this.assertStaffingLeadershipRoleAvailable(
      dto.role as UserRole,
      organizationId,
      requestingUser.org_type,
    )

    const token = randomBytes(32).toString("hex")

    const user = this.repo.create({
      email,
      password_hash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
      full_name: dto.full_name,
      phone: dto.phone ?? null,
      role: dto.role as UserRole,
      organization_id: organizationId,
      org_type: requestingUser.org_type,
      is_active: dto.is_active ?? true,
      reset_token_hash: createHash("sha256").update(token).digest("hex"),
      reset_token_expires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    })

    let saved: UserEntity

    try {
      saved = await this.repo.save(user)
    } catch (error) {
      if (isUniqueConstraintViolation(error, ["IDX_user_email", "UQ_users_email"])) {
        throw emailAlreadyExistsException()
      }

      this.throwStaffingLeadershipConstraint(error)

      throw error
    }

    await this.createManagerTeam(saved)

    await this.emailService.sendStaffInvite({ email, fullName: saved.full_name, token })
    await this.logUserAdminChange(requestingUser, saved, "create", { role: saved.role })

    return this.sanitize(saved)
  }

  async create(dto: CreateUserDto, requestingUser: UserEntity): Promise<any> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can create users")
    }

    const existing = await this.repo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    })

    if (existing) {
      throw emailAlreadyExistsException()
    }

    const organization = dto.organization_id
      ? await this.organizations.findOne({ where: { id: dto.organization_id } })
      : null

    await this.assertStaffingLeadershipRoleAvailable(
      dto.role as UserRole,
      dto.organization_id ?? null,
      organization?.org_type ?? null,
    )

    const password_hash = await bcrypt.hash(dto.password, 10)

    const user = this.repo.create({
      email: dto.email.toLowerCase().trim(),
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone ?? null,
      role: dto.role as any,
      organization_id: dto.organization_id ?? null,
      org_type: organization?.org_type ?? null,
      is_active: dto.is_active ?? true,
    })

    let saved: UserEntity

    try {
      saved = await this.repo.save(user)
    } catch (error) {
      if (isUniqueConstraintViolation(error, ["IDX_user_email", "UQ_users_email"])) {
        throw emailAlreadyExistsException()
      }

      this.throwStaffingLeadershipConstraint(error)

      throw error
    }

    await this.createManagerTeam(saved)

    return this.sanitize(saved)
  }

  async remove(id: number, requestingUser: UserEntity): Promise<void> {
    if (![UserRole.ADMIN, UserRole.ORG_ADMIN].includes(requestingUser.role)) {
      throw new ForbiddenException("Only administrators can remove users")
    }

    if (id === requestingUser.id) {
      throw new ForbiddenException("You cannot delete your own account")
    }

    const user = await this.repo.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User ${id} not found`)
    }

    if (requestingUser.role === UserRole.ORG_ADMIN) {
      if (
        user.organization_id !== requestingUser.organization_id ||
        user.role === UserRole.ORG_ADMIN
      ) {
        throw new ForbiddenException("Access denied")
      }

      user.is_active = false
      await this.repo.save(user)
      await this.logUserAdminChange(requestingUser, user, "deactivate", { is_active: false })

      return
    }

    await this.logUserAdminChange(requestingUser, user, "delete", { role: user.role })
    await this.repo.remove(user)
  }

  sanitize(user: UserEntity): any {
    const { password_hash, refresh_token_hash, reset_token_hash, reset_token_expires, ...rest } =
      user as any

    return rest
  }
}
