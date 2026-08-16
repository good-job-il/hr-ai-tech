import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './audit-log.entity';
import { CreateAuditLogDto, QueryAuditLogsDto } from './dto/audit-log.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async findAll(query: QueryAuditLogsDto, user: UserEntity) {
    const { page, limit, sort, order, entity_type, entity_id, action, actor_user_id } = query;
    const where: Record<string, any> = {};

    // Only admin sees all logs; others are scoped to their org
    if (user.role !== UserRole.ADMIN) {
      where.organization_id = user.organization_id;
    }
    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;
    if (action) where.action = action;
    if (actor_user_id) where.actor_user_id = actor_user_id;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async create(dto: CreateAuditLogDto, user: UserEntity): Promise<AuditLogEntity> {
    const log = this.repo.create({
      ...dto,
      organization_id: user.organization_id == null ? null : String(user.organization_id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
    } as any);
    return this.repo.save(log) as unknown as Promise<AuditLogEntity>;
  }

  /** Internal helper — used by other services to write audit entries without HTTP context */
  async log(entry: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    const log = this.repo.create(entry);
    return this.repo.save(log);
  }
}
