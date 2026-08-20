import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Between, In, LessThanOrEqual, Like, MoreThanOrEqual, Not, Repository } from "typeorm"
import { AuditLogEntity } from "./audit-log.entity"
import { CreateAuditLogDto, QueryAuditLogsDto } from "./dto/audit-log.dto"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"

const ORGANIZATION_WIDE_AUDIT_ENTITY_TYPES = [
  "Organization",
  "PermissionMatrix",
  "RoleTemplate",
  "Billing",
  "Integration",
]

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll(query: QueryAuditLogsDto, user: UserEntity) {
    const {
      page,
      limit,
      sort,
      order,
      entity_type,
      entity_id,
      action,
      actor_user_id,
      actor_email,
      date_from,
      date_to,
    } = query

    const where: Record<string, any> = {}

    // Only admin sees all logs; others are scoped to their org
    if (user.role !== UserRole.ADMIN) {
      where.organization_id = user.organization_id
    }

    if (user.role === UserRole.RECRUITER) {
      if (!user.organization_id) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      if (actor_user_id && String(actor_user_id) !== String(user.id)) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      if (entity_type && ORGANIZATION_WIDE_AUDIT_ENTITY_TYPES.includes(entity_type)) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      where.actor_user_id = String(user.id)
      where.entity_type = entity_type ? entity_type : Not(In(ORGANIZATION_WIDE_AUDIT_ENTITY_TYPES))
    } else if (user.role === UserRole.TEAM_MANAGER) {
      if (!user.team_id || !user.organization_id) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      const members = await this.users.find({
        where: { organization_id: user.organization_id, team_id: user.team_id },
        select: ["id"],
      })

      const memberIds = members.map((member) => String(member.id))

      if (actor_user_id && !memberIds.includes(String(actor_user_id))) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      if (entity_type && ORGANIZATION_WIDE_AUDIT_ENTITY_TYPES.includes(entity_type)) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      if (!memberIds.length) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      where.actor_user_id = actor_user_id ? String(actor_user_id) : In(memberIds)
      where.entity_type = entity_type ? entity_type : Not(In(ORGANIZATION_WIDE_AUDIT_ENTITY_TYPES))
    } else {
      if (entity_type) {
        where.entity_type = entity_type
      }

      if (actor_user_id) {
        where.actor_user_id = actor_user_id
      }
    }

    if (entity_id) {
      where.entity_id = entity_id
    }

    if (action) {
      where.action = action
    }

    if (actor_email) {
      where.actor_email = Like(`%${actor_email}%`)
    }

    if (date_from && date_to) {
      where.created_date = Between(date_from, date_to)
    } else if (date_from) {
      where.created_date = MoreThanOrEqual(date_from)
    } else if (date_to) {
      where.created_date = LessThanOrEqual(date_to)
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async export(query: QueryAuditLogsDto, user: UserEntity) {
    const result = await this.findAll({ ...query, page: 1, limit: 500 } as QueryAuditLogsDto, user)

    await this.log({
      organization_id: user.organization_id == null ? null : String(user.organization_id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
      entity_type: user.role === UserRole.TEAM_MANAGER ? "AgencyTeam" : "Organization",
      entity_id:
        user.role === UserRole.TEAM_MANAGER ? (user.team_id ?? 0) : (user.organization_id ?? 0),
      entity_label:
        user.role === UserRole.TEAM_MANAGER
          ? "Team activity export"
          : "Operational activity export",
      action: "export",
      metadata: {
        filters: {
          entity_type: query.entity_type,
          action: query.action,
          actor_user_id: query.actor_user_id,
          actor_email: query.actor_email,
          date_from: query.date_from,
          date_to: query.date_to,
        },
        exported_records: result.data.length,
        team_id: user.team_id ?? null,
      },
    })

    return result
  }

  async create(dto: CreateAuditLogDto, user: UserEntity): Promise<AuditLogEntity> {
    const log = this.repo.create({
      ...dto,
      organization_id: user.organization_id == null ? null : String(user.organization_id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
    } as any)

    return this.repo.save(log) as unknown as Promise<AuditLogEntity>
  }

  /** Internal helper — used by other services to write audit entries without HTTP context */
  async log(entry: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    const log = this.repo.create(entry)

    return this.repo.save(log)
  }
}
