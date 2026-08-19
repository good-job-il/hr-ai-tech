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

  private requireAdmin(actor: UserEntity) {
    if (actor.role !== UserRole.ORG_ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only organization admins can manage members and invitations")
    }
  }

  private async scopedTeam(id: number, actor: UserEntity) {
    const team = await this.teams.findOne({ where: { id, organization_id: this.orgId(actor) } })

    if (!team) {
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
        invitations: [],
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

    const safeMembers = members
      .filter((m) => AGENCY_ROLES.includes(m.role))
      .map(
        ({ password_hash, refresh_token_hash, reset_token_hash, reset_token_expires, ...member }) =>
          member,
      )

    return {
      members: safeMembers,
      teams,
      invitations: invitations.map(({ token_hash, ...invite }) => invite),
    }
  }

  async createTeam(dto: CreateAgencyTeamDto, actor: UserEntity) {
    const organization_id = this.orgId(actor)

    if (dto.manager_id) {
      await this.assertMember(dto.manager_id, actor, [UserRole.TEAM_MANAGER])
    }

    try {
      const team = await this.teams.save(this.teams.create({ ...dto, organization_id }))

      if (team.manager_id) {
        await this.users.update(team.manager_id, { team_id: team.id })
      }

      await this.log(actor, "AgencyTeam", team.id, "create", { name: team.name })

      return team
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        throw new ConflictException("A team with this name already exists")
      }

      throw error
    }
  }

  async updateTeam(id: number, dto: UpdateAgencyTeamDto, actor: UserEntity) {
    const team = await this.scopedTeam(id, actor)

    if (dto.manager_id) {
      await this.assertMember(dto.manager_id, actor, [UserRole.TEAM_MANAGER])
    }

    Object.assign(team, dto)

    const saved = await this.teams.save(team)

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

  async invite(dto: InviteAgencyMemberDto, actor: UserEntity) {
    this.requireAdmin(actor)

    const organization_id = this.orgId(actor)

    const email = dto.email.toLowerCase()

    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException("A user with this email already exists")
    }

    const pending = await this.invitations.findOne({
      where: { organization_id, email, status: "pending" },
    })

    if (pending) {
      throw new ConflictException("A pending invitation already exists for this email")
    }

    if (dto.team_id) {
      await this.scopedTeam(dto.team_id, actor)
    }

    const token = crypto.randomBytes(32).toString("hex")

    const record = this.invitations.create()

    Object.assign(record, dto, {
      role: dto.role as UserRole,
      email,
      organization_id,
      invited_by: actor.id,
      token_hash: this.hashToken(token),
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const invitation = await this.invitations.save(record)

    await this.log(actor, "AgencyInvitation", invitation.id, "create", {
      email,
      role: dto.role,
      team_id: dto.team_id,
    })

    const { token_hash, ...safe } = invitation

    return { ...safe, invite_token: token }
  }

  async resendInvitation(id: number, actor: UserEntity) {
    this.requireAdmin(actor)

    const invitation = await this.invitations.findOne({
      where: { id, organization_id: this.orgId(actor) },
    })

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
    this.requireAdmin(actor)

    const invitation = await this.invitations.findOne({
      where: { id, organization_id: this.orgId(actor) },
    })

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
      throw new ConflictException("A user with this email already exists")
    }

    const user = await this.users.save(
      this.users.create({
        email: invitation.email,
        full_name: invitation.full_name,
        phone: invitation.phone,
        role: invitation.role,
        organization_id: invitation.organization_id,
        team_id: invitation.team_id,
        password_hash: await bcrypt.hash(password, 12),
        is_active: true,
        team_manager_id:
          invitation.role === UserRole.RECRUITER ? await this.managerId(invitation.team_id) : null,
      }),
    )

    invitation.status = "accepted"
    invitation.accepted_at = new Date()
    await this.invitations.save(invitation)

    return { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  }

  async updateMember(id: number, dto: UpdateAgencyMemberDto, actor: UserEntity) {
    this.requireAdmin(actor)

    const member = await this.assertMember(id, actor)

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

    const saved = await this.users.save(member)

    await this.log(actor, "User", saved.id, dto.is_active === false ? "deactivate" : "update", {
      before,
      after: dto,
    })

    const { password_hash, refresh_token_hash, reset_token_hash, reset_token_expires, ...safe } =
      saved

    return safe
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
