import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as bcrypt from "bcrypt"
import * as crypto from "crypto"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"
import {
  emailAlreadyExistsException,
  isUniqueConstraintViolation,
} from "../../common/utils/user-email-conflict.utils"
import { AuditService } from "../audit/audit.service"
import { AgencyTeamEntity } from "./agency-team.entity"
import { AgencyInvitationEntity } from "./agency-invitation.entity"
import {
  CreateAgencyTeamDto,
  InviteAgencyMemberDto,
  UpdateAgencyMemberDto,
  UpdateAgencyTeamDto,
} from "./dto/agency-teams.dto"

const AGENCY_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.RECRUITER,
]

const READABLE_TEAM_ROLES = [
  UserRole.ORG_ADMIN,
  UserRole.RECRUITMENT_MANAGER,
  UserRole.TEAM_MANAGER,
  UserRole.ADMIN,
]

const STAFFING_ORG_ADMIN_LIMIT = "STAFFING_ORG_ADMIN_LIMIT"

const STAFFING_RECRUITMENT_MANAGER_LIMIT = "STAFFING_RECRUITMENT_MANAGER_LIMIT"

const TEAM_MANAGER_ALREADY_ASSIGNED = "TEAM_MANAGER_ALREADY_ASSIGNED"

@Injectable()
export class AgencyTeamsService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AgencyTeamEntity) private readonly teams: Repository<AgencyTeamEntity>,
    @InjectRepository(AgencyInvitationEntity)
    private readonly invitations: Repository<AgencyInvitationEntity>,
    private readonly audit: AuditService,
  ) {}

  private orgId(actor: UserEntity): number {
    if (!actor.organization_id) {
      throw new ForbiddenException("An organization context is required")
    }

    return actor.organization_id
  }

  private isOrganizationAdmin(actor: UserEntity) {
    return actor.role === UserRole.ORG_ADMIN || actor.role === UserRole.ADMIN
  }

  private requireTeamAdministration(actor: UserEntity) {
    if (
      !this.isOrganizationAdmin(actor) &&
      actor.role !== UserRole.RECRUITMENT_MANAGER &&
      actor.role !== UserRole.TEAM_MANAGER
    ) {
      throw new ForbiddenException("This role cannot manage agency teams")
    }
  }

  private async scopedTeam(id: number, actor: UserEntity) {
    const team = await this.teams.findOne({ where: { id, organization_id: this.orgId(actor) } })

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`)
    }

    if (
      (actor.role === UserRole.RECRUITMENT_MANAGER && team.recruitment_manager_id !== actor.id) ||
      (actor.role === UserRole.TEAM_MANAGER &&
        (team.id !== actor.team_id || team.manager_id !== actor.id))
    ) {
      throw new NotFoundException(`Team ${id} not found`)
    }

    return team
  }

  private async log(
    actor: UserEntity,
    entityType: "User" | "AgencyTeam" | "AgencyInvitation",
    entityId: number,
    action: string,
    metadata?: Record<string, any>,
  ) {
    await this.audit.log({
      organization_id: String(this.orgId(actor)),
      actor_user_id: String(actor.id),
      actor_email: actor.email,
      actor_role: actor.role,
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata: metadata ?? null,
    })
  }

  async overview(actor: UserEntity) {
    if (!READABLE_TEAM_ROLES.includes(actor.role)) {
      throw new ForbiddenException("This role cannot view agency teams")
    }

    const organization_id = this.orgId(actor)

    if (actor.role === UserRole.TEAM_MANAGER) {
      if (!actor.team_id) {
        throw new ForbiddenException("Active team membership required")
      }

      const [members, team] = await Promise.all([
        this.users.find({
          where: { organization_id, team_id: actor.team_id },
          order: { full_name: "ASC" },
        }),
        this.teams.findOne({
          where: {
            id: actor.team_id,
            organization_id,
            manager_id: actor.id,
            is_active: true,
          },
        }),
      ])

      if (!team) {
        throw new ForbiddenException("Active managed team required")
      }

      return {
        members: members
          .filter((member) => member.team_id === actor.team_id)
          .filter((member) => [UserRole.TEAM_MANAGER, UserRole.RECRUITER].includes(member.role))
          .map(
            ({
              password_hash,
              refresh_token_hash,
              reset_token_hash,
              reset_token_expires,
              ...member
            }) => member,
          ),
        teams: [team],
        invitations: await this.visibleInvitations(actor),
      }
    }

    await this.invitations
      .createQueryBuilder()
      .update()
      .set({ status: "expired" })
      .where("organization_id = :organization_id", { organization_id })
      .andWhere("status = :status", { status: "pending" })
      .andWhere("expires_at < :now", { now: new Date() })
      .execute()

    const [members, teams, invitations] = await Promise.all([
      this.users.find({ where: { organization_id }, order: { full_name: "ASC" } }),
      this.teams.find({ where: { organization_id }, order: { name: "ASC" } }),
      this.invitations.find({
        where: { organization_id },
        order: { created_date: "DESC" },
        take: 100,
      }),
    ])

    const activeTeams = teams.filter((team) => team.is_active !== false)

    const visibleTeams =
      actor.role === UserRole.RECRUITMENT_MANAGER
        ? activeTeams.filter((team) => team.recruitment_manager_id === actor.id)
        : activeTeams

    const visibleTeamIds = new Set(visibleTeams.map((team) => team.id))

    const visibleMembers =
      actor.role === UserRole.RECRUITMENT_MANAGER
        ? members.filter(
            (member) =>
              member.id === actor.id ||
              (member.recruitment_manager_id === actor.id &&
                [UserRole.TEAM_MANAGER, UserRole.RECRUITER].includes(member.role) &&
                (!member.team_id || visibleTeamIds.has(member.team_id))),
          )
        : members

    const safeMembers = visibleMembers
      .filter((m) => AGENCY_ROLES.includes(m.role))
      .map(
        ({ password_hash, refresh_token_hash, reset_token_hash, reset_token_expires, ...member }) =>
          member,
      )

    return {
      members: safeMembers,
      teams: visibleTeams,
      invitations: invitations
        .filter(
          (invitation) => this.isOrganizationAdmin(actor) || invitation.invited_by === actor.id,
        )
        .map(({ token_hash, ...invite }) => invite),
    }
  }

  async createTeam(dto: CreateAgencyTeamDto, actor: UserEntity) {
    if (!this.isOrganizationAdmin(actor) && actor.role !== UserRole.RECRUITMENT_MANAGER) {
      throw new ForbiddenException(
        "Only organization admins and recruitment managers can create teams",
      )
    }

    const organization_id = this.orgId(actor)

    if (dto.manager_id) {
      await this.assertAssignableManager(dto.manager_id, actor)
    }

    const recruitment_manager_id =
      actor.role === UserRole.RECRUITMENT_MANAGER
        ? actor.id
        : dto.manager_id
          ? (await this.assertMember(dto.manager_id, actor)).recruitment_manager_id
          : null

    try {
      const team = await this.teams.save(
        this.teams.create({ ...dto, organization_id, recruitment_manager_id }),
      )

      if (team.manager_id) {
        await this.users.update(team.manager_id, {
          team_id: team.id,
          recruitment_manager_id: team.recruitment_manager_id,
        })
      }

      await this.log(actor, "AgencyTeam", team.id, "create", { name: team.name })

      return team
    } catch (error: any) {
      if (isUniqueConstraintViolation(error, ["UQ_agency_team_manager"])) {
        throw new ConflictException({
          code: TEAM_MANAGER_ALREADY_ASSIGNED,
          message: "A team manager can only be assigned to one team",
        })
      }

      if (error?.code === "ER_DUP_ENTRY") {
        throw new ConflictException("A team with this name already exists")
      }

      throw error
    }
  }

  async updateTeam(id: number, dto: UpdateAgencyTeamDto, actor: UserEntity) {
    if (!this.isOrganizationAdmin(actor) && actor.role !== UserRole.RECRUITMENT_MANAGER) {
      throw new ForbiddenException(
        "Only organization admins and recruitment managers can update teams",
      )
    }

    const team = await this.scopedTeam(id, actor)

    const previousManagerId = team.manager_id

    if (dto.manager_id) {
      await this.assertAssignableManager(dto.manager_id, actor, team.id)
    }

    Object.assign(team, dto)

    let saved: AgencyTeamEntity

    try {
      saved = await this.teams.save(team)
    } catch (error) {
      if (isUniqueConstraintViolation(error, ["UQ_agency_team_manager"])) {
        throw new ConflictException({
          code: TEAM_MANAGER_ALREADY_ASSIGNED,
          message: "A team manager can only be assigned to one team",
        })
      }

      throw error
    }

    if (previousManagerId && previousManagerId !== saved.manager_id) {
      await this.users.update(previousManagerId, { team_id: null })
    }

    if (saved.manager_id) {
      await this.users.update(saved.manager_id, { team_id: saved.id })
      await this.users.update(
        { organization_id: saved.organization_id, team_id: saved.id },
        { team_manager_id: saved.manager_id },
      )
    } else {
      await this.users.update(
        { organization_id: saved.organization_id, team_id: saved.id },
        { team_manager_id: null },
      )
    }

    await this.log(actor, "AgencyTeam", saved.id, "update", dto)

    return saved
  }

  async removeTeam(id: number, actor: UserEntity) {
    if (!this.isOrganizationAdmin(actor) && actor.role !== UserRole.RECRUITMENT_MANAGER) {
      throw new ForbiddenException(
        "Only organization admins and recruitment managers can delete teams",
      )
    }

    const team = await this.scopedTeam(id, actor)

    await this.users.update(
      { organization_id: team.organization_id, team_id: team.id },
      { team_id: null, team_manager_id: null },
    )
    team.manager_id = null
    team.is_active = false
    await this.teams.save(team)
    await this.log(actor, "AgencyTeam", team.id, "delete", { name: team.name })
  }

  async invite(dto: InviteAgencyMemberDto, actor: UserEntity) {
    this.requireTeamAdministration(actor)

    const organization_id = this.orgId(actor)

    const email = dto.email.toLowerCase()

    if (await this.users.findOne({ where: { email } })) {
      throw emailAlreadyExistsException()
    }

    const pending = await this.invitations.findOne({
      where: { organization_id, email, status: "pending" },
    })

    if (pending) {
      throw new ConflictException("A pending invitation already exists for this email")
    }

    const payload = await this.normalizeInvitation(dto, actor)

    await this.assertLeadershipRoleAvailable(
      payload.role as UserRole,
      organization_id,
      undefined,
      true,
    )

    const token = crypto.randomBytes(32).toString("hex")

    const record = this.invitations.create()

    Object.assign(record, payload, {
      role: payload.role as UserRole,
      email,
      organization_id,
      invited_by: actor.id,
      token_hash: this.hashToken(token),
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    let invitation: AgencyInvitationEntity

    try {
      invitation = await this.invitations.save(record)
    } catch (error) {
      this.throwLeadershipConstraintConflict(error)
      throw error
    }

    await this.log(actor, "AgencyInvitation", invitation.id, "create", {
      email,
      role: payload.role,
      team_id: payload.team_id,
    })

    const { token_hash, ...safe } = invitation

    return { ...safe, invite_token: token }
  }

  async resendInvitation(id: number, actor: UserEntity) {
    this.requireTeamAdministration(actor)

    const invitation = await this.scopedInvitation(id, actor)

    if (!invitation || invitation.status !== "pending") {
      throw new NotFoundException("Pending invitation not found")
    }

    const token = crypto.randomBytes(32).toString("hex")

    invitation.token_hash = this.hashToken(token)
    invitation.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.invitations.save(invitation)
    await this.log(actor, "AgencyInvitation", id, "resend", { email: invitation.email })

    return { invite_token: token, expires_at: invitation.expires_at }
  }

  async cancelInvitation(id: number, actor: UserEntity) {
    this.requireTeamAdministration(actor)

    const invitation = await this.scopedInvitation(id, actor)

    if (!invitation || invitation.status !== "pending") {
      throw new NotFoundException("Pending invitation not found")
    }

    invitation.status = "cancelled"
    await this.invitations.save(invitation)
    await this.log(actor, "AgencyInvitation", id, "cancel", { email: invitation.email })

    return { id, status: "cancelled" }
  }

  async accept(token: string, password: string) {
    const invitation = await this.invitations.findOne({
      where: { token_hash: this.hashToken(token), status: "pending" },
    })

    if (!invitation || invitation.expires_at < new Date()) {
      throw new BadRequestException("Invitation is invalid or expired")
    }

    if (await this.users.findOne({ where: { email: invitation.email } })) {
      throw emailAlreadyExistsException()
    }

    await this.assertLeadershipRoleAvailable(
      invitation.role,
      invitation.organization_id,
      undefined,
      false,
    )

    const recruitmentManagerId = await this.invitationRecruitmentManagerId(invitation)

    let user: UserEntity

    try {
      user = await this.users.save(
        this.users.create({
          email: invitation.email,
          full_name: invitation.full_name,
          phone: invitation.phone,
          role: invitation.role,
          organization_id: invitation.organization_id,
          org_type: OrgType.STAFFING_AGENCY,
          team_id: invitation.role === UserRole.TEAM_MANAGER ? null : invitation.team_id,
          password_hash: await bcrypt.hash(password, 12),
          is_active: true,
          recruitment_manager_id: recruitmentManagerId,
          team_manager_id:
            invitation.role === UserRole.RECRUITER
              ? await this.managerId(invitation.team_id)
              : null,
        }),
      )
    } catch (error) {
      if (isUniqueConstraintViolation(error, ["IDX_user_email", "UQ_users_email"])) {
        throw emailAlreadyExistsException()
      }

      this.throwLeadershipConstraintConflict(error)

      throw error
    }

    if (user.role === UserRole.TEAM_MANAGER) {
      await this.createManagerTeam(user)
    }

    invitation.status = "accepted"
    invitation.accepted_at = new Date()
    await this.invitations.save(invitation)

    return { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  }

  async updateMember(id: number, dto: UpdateAgencyMemberDto, actor: UserEntity) {
    this.requireTeamAdministration(actor)

    const member = await this.assertManageableMember(id, actor)

    if (
      !this.isOrganizationAdmin(actor) &&
      member.id === actor.id &&
      (dto.role !== undefined || dto.team_id !== undefined || dto.is_active !== undefined)
    ) {
      throw new BadRequestException("You cannot change your own role, team or status")
    }

    this.validateMemberUpdate(member, dto, actor)

    const nextRole = (dto.role ?? member.role) as UserRole

    if (nextRole !== member.role) {
      await this.assertLeadershipRoleAvailable(nextRole, this.orgId(actor), member.id, false)
    }

    if (
      member.role === UserRole.TEAM_MANAGER &&
      dto.team_id !== undefined &&
      dto.team_id !== member.team_id
    ) {
      throw new BadRequestException("A team manager can only belong to their managed team")
    }

    if (member.role !== UserRole.TEAM_MANAGER && nextRole === UserRole.TEAM_MANAGER) {
      dto.team_id = null
    }

    if (member.id === actor.id && dto.is_active === false) {
      throw new BadRequestException("You cannot deactivate your own account")
    }

    if (
      member.role === UserRole.ORG_ADMIN &&
      ((dto.role && dto.role !== UserRole.ORG_ADMIN) || dto.is_active === false)
    ) {
      const activeAdmins = await this.users.count({
        where: { organization_id: this.orgId(actor), role: UserRole.ORG_ADMIN, is_active: true },
      })

      if (activeAdmins <= 1) {
        throw new BadRequestException("The organization must keep at least one active admin")
      }
    }

    if (
      member.role === UserRole.TEAM_MANAGER &&
      ((dto.role && dto.role !== UserRole.TEAM_MANAGER) || dto.is_active === false)
    ) {
      const managedTeams = await this.teams.count({
        where: { organization_id: this.orgId(actor), manager_id: member.id, is_active: true },
      })

      if (managedTeams > 0) {
        throw new BadRequestException(
          "Reassign this member’s active teams before changing their role or deactivating them",
        )
      }
    }

    if (dto.team_id) {
      await this.scopedTeam(dto.team_id, actor)
    }

    const before = { role: member.role, team_id: member.team_id, is_active: member.is_active }

    Object.assign(member, dto, {
      team_manager_id: dto.team_id
        ? await this.managerId(dto.team_id)
        : dto.team_id === null
          ? null
          : member.team_manager_id,
    })

    let saved: UserEntity

    try {
      saved = await this.users.save(member)
    } catch (error) {
      this.throwLeadershipConstraintConflict(error)
      throw error
    }

    if (before.role !== UserRole.TEAM_MANAGER && saved.role === UserRole.TEAM_MANAGER) {
      await this.createManagerTeam(saved)
    }

    await this.log(actor, "User", saved.id, dto.is_active === false ? "deactivate" : "update", {
      before,
      after: dto,
    })

    const { password_hash, refresh_token_hash, reset_token_hash, reset_token_expires, ...safe } =
      saved

    return safe
  }

  async removeMember(id: number, actor: UserEntity) {
    this.requireTeamAdministration(actor)

    const member = await this.assertManageableMember(id, actor)

    if (member.id === actor.id) {
      throw new BadRequestException("You cannot delete your own account")
    }

    if (member.role === UserRole.ORG_ADMIN && member.is_active) {
      const admins = await this.users.count({
        where: { organization_id: this.orgId(actor), role: UserRole.ORG_ADMIN, is_active: true },
      })

      if (admins <= 1) {
        throw new BadRequestException("The organization must keep at least one active admin")
      }
    }

    const managedTeams = await this.teams.count({
      where: { organization_id: this.orgId(actor), manager_id: id, is_active: true },
    })

    if (managedTeams > 0) {
      throw new BadRequestException("Reassign this member's active teams before deleting them")
    }

    // Remove membership and access while retaining historical user references.
    Object.assign(member, {
      is_active: false,
      organization_id: null,
      company_id: null,
      org_type: null,
      team_id: null,
      team_manager_id: null,
      recruitment_manager_id: null,
      refresh_token_hash: null,
      reset_token_hash: null,
      reset_token_expires: null,
    })
    await this.users.save(member)
    await this.log(actor, "User", id, "delete", { membership_removed: true })
  }

  private async assertMember(id: number, actor: UserEntity, roles?: UserRole[]) {
    const member = await this.users.findOne({ where: { id, organization_id: this.orgId(actor) } })

    if (!member || !AGENCY_ROLES.includes(member.role)) {
      throw new NotFoundException(`Organization member ${id} not found`)
    }

    if (roles && !roles.includes(member.role)) {
      throw new BadRequestException("The selected member has an incompatible role")
    }

    return member
  }

  private async assertManageableMember(id: number, actor: UserEntity) {
    const member = await this.assertMember(id, actor)

    if (this.isOrganizationAdmin(actor)) {
      return member
    }

    const recruitmentManagerCanManage =
      actor.role === UserRole.RECRUITMENT_MANAGER &&
      (member.id === actor.id ||
        (member.recruitment_manager_id === actor.id &&
          [UserRole.TEAM_MANAGER, UserRole.RECRUITER].includes(member.role)))

    const teamManagerCanManage =
      actor.role === UserRole.TEAM_MANAGER &&
      member.role === UserRole.RECRUITER &&
      member.team_id === actor.team_id

    if (!recruitmentManagerCanManage && !teamManagerCanManage) {
      throw new NotFoundException(`Organization member ${id} not found`)
    }

    return member
  }

  private validateMemberUpdate(member: UserEntity, dto: UpdateAgencyMemberDto, actor: UserEntity) {
    if (actor.role === UserRole.TEAM_MANAGER) {
      if (dto.role && dto.role !== UserRole.RECRUITER) {
        throw new ForbiddenException("Team managers can only manage recruiters")
      }

      if (dto.team_id !== undefined && dto.team_id !== actor.team_id) {
        throw new ForbiddenException("Recruiters can only be assigned to your team")
      }
    }

    if (
      actor.role === UserRole.RECRUITMENT_MANAGER &&
      dto.role &&
      ![UserRole.TEAM_MANAGER, UserRole.RECRUITER].includes(dto.role as UserRole)
    ) {
      throw new ForbiddenException(
        "Recruitment managers can only manage team managers and recruiters",
      )
    }

    if (member.role === UserRole.ORG_ADMIN && !this.isOrganizationAdmin(actor)) {
      throw new ForbiddenException("Organization admins cannot be changed")
    }
  }

  private async assertAssignableManager(id: number, actor: UserEntity, currentTeamId?: number) {
    const manager = await this.assertMember(id, actor, [UserRole.TEAM_MANAGER])

    if (
      actor.role === UserRole.RECRUITMENT_MANAGER &&
      manager.recruitment_manager_id !== actor.id
    ) {
      throw new NotFoundException(`Organization member ${id} not found`)
    }

    const assignedTeam = await this.teams.findOne({
      where: { organization_id: this.orgId(actor), manager_id: id },
    })

    if (assignedTeam && assignedTeam.id !== currentTeamId) {
      throw new ConflictException({
        code: TEAM_MANAGER_ALREADY_ASSIGNED,
        message: "A team manager can only be assigned to one team",
      })
    }

    return manager
  }

  private async normalizeInvitation(dto: InviteAgencyMemberDto, actor: UserEntity) {
    if (actor.role === UserRole.TEAM_MANAGER) {
      if (dto.role !== UserRole.RECRUITER || !actor.team_id) {
        throw new ForbiddenException("Team managers can only invite recruiters to their own team")
      }

      await this.scopedTeam(actor.team_id, actor)

      return { ...dto, role: UserRole.RECRUITER, team_id: actor.team_id }
    }

    if (
      actor.role === UserRole.RECRUITMENT_MANAGER &&
      ![UserRole.TEAM_MANAGER, UserRole.RECRUITER].includes(dto.role as UserRole)
    ) {
      throw new ForbiddenException(
        "Recruitment managers can only invite team managers and recruiters",
      )
    }

    if (dto.role === UserRole.TEAM_MANAGER) {
      return { ...dto, team_id: null }
    }

    if (dto.team_id) {
      await this.scopedTeam(dto.team_id, actor)
    }

    return dto
  }

  private async assertLeadershipRoleAvailable(
    role: UserRole,
    organizationId: number,
    currentUserId?: number,
    includePending = false,
  ) {
    if (![UserRole.ORG_ADMIN, UserRole.RECRUITMENT_MANAGER].includes(role)) {
      return
    }

    const existing = await this.users.findOne({
      where: { organization_id: organizationId, role },
    })

    if (existing && existing.id !== currentUserId) {
      throw this.leadershipLimitException(role)
    }

    if (includePending) {
      const pending = await this.invitations.findOne({
        where: { organization_id: organizationId, role, status: "pending" },
      })

      if (pending) {
        throw this.leadershipLimitException(role)
      }
    }
  }

  private leadershipLimitException(role: UserRole) {
    if (role === UserRole.ORG_ADMIN) {
      return new ConflictException({
        code: STAFFING_ORG_ADMIN_LIMIT,
        message: "A staffing agency can only have one organization admin",
      })
    }

    return new ConflictException({
      code: STAFFING_RECRUITMENT_MANAGER_LIMIT,
      message: "A staffing agency can only have one recruitment manager",
    })
  }

  private throwLeadershipConstraintConflict(error: unknown): void {
    if (
      isUniqueConstraintViolation(error, [
        "UQ_users_staffing_org_admin",
        "UQ_invitation_pending_org_admin",
      ])
    ) {
      throw this.leadershipLimitException(UserRole.ORG_ADMIN)
    }

    if (
      isUniqueConstraintViolation(error, [
        "UQ_users_staffing_recruitment_manager",
        "UQ_invitation_pending_recruitment_manager",
      ])
    ) {
      throw this.leadershipLimitException(UserRole.RECRUITMENT_MANAGER)
    }
  }

  private async createManagerTeam(manager: UserEntity) {
    const suffix = ` (${manager.id})`

    const base = `${manager.full_name?.trim() || manager.email} Team`

    const name = `${base.slice(0, 120 - suffix.length)}${suffix}`

    let team: AgencyTeamEntity

    try {
      team = await this.teams.save(
        this.teams.create({
          organization_id: manager.organization_id,
          name,
          description: null,
          manager_id: manager.id,
          recruitment_manager_id: manager.recruitment_manager_id,
          is_active: true,
        }),
      )
    } catch (error) {
      if (isUniqueConstraintViolation(error, ["UQ_agency_team_manager"])) {
        throw new ConflictException({
          code: TEAM_MANAGER_ALREADY_ASSIGNED,
          message: "A team manager can only be assigned to one team",
        })
      }

      throw error
    }

    manager.team_id = team.id
    await this.users.save(manager)
  }

  private async scopedInvitation(id: number, actor: UserEntity) {
    const invitation = await this.invitations.findOne({
      where: { id, organization_id: this.orgId(actor) },
    })

    if (
      !invitation ||
      invitation.status !== "pending" ||
      (!this.isOrganizationAdmin(actor) && invitation.invited_by !== actor.id)
    ) {
      throw new NotFoundException("Pending invitation not found")
    }

    return invitation
  }

  private async visibleInvitations(actor: UserEntity) {
    const invitations = await this.invitations.find({
      where: { organization_id: this.orgId(actor), invited_by: actor.id },
      order: { created_date: "DESC" },
      take: 100,
    })

    return invitations.map(({ token_hash, ...invitation }) => invitation)
  }

  private async invitationRecruitmentManagerId(invitation: AgencyInvitationEntity) {
    const inviter = await this.users.findOne({ where: { id: invitation.invited_by } })

    if (inviter?.role === UserRole.RECRUITMENT_MANAGER) {
      return inviter.id
    }

    return inviter?.recruitment_manager_id ?? null
  }

  private async managerId(teamId?: number | null) {
    if (!teamId) {
      return null
    }

    return (await this.teams.findOne({ where: { id: teamId } }))?.manager_id ?? null
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex")
  }
}
