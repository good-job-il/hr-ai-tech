import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationLogEntity, EmployerTimelineEntity } from './communication-log.entity';
import {
  CreateCommunicationLogDto,
  QueryCommunicationLogsDto,
  CreateEmployerTimelineDto,
  QueryEmployerTimelineDto,
} from './dto/communication.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(CommunicationLogEntity)
    private readonly logRepo: Repository<CommunicationLogEntity>,
    @InjectRepository(EmployerTimelineEntity)
    private readonly timelineRepo: Repository<EmployerTimelineEntity>,
  ) {}

  // ─── Communication Log ───────────────────────────────────────────────────
  async findAll(query: QueryCommunicationLogsDto, user: UserEntity) {
    const { page, limit, sort, order, candidate_id, channel } = query;
    const where: Record<string, any> = {};
    if (user.role !== UserRole.ADMIN) {
      where.organization_id = user.organization_id;
    }
    if (candidate_id) where.candidate_id = candidate_id;
    if (channel) where.channel = channel;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.logRepo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async create(dto: CreateCommunicationLogDto, user: UserEntity): Promise<CommunicationLogEntity> {
    const log = this.logRepo.create({
      ...dto,
      organization_id: dto.organization_id ?? user.organization_id,
    } as any);
    return this.logRepo.save(log) as unknown as Promise<CommunicationLogEntity>;
  }

  // ─── Employer Timeline ────────────────────────────────────────────────────
  async getEmployerTimeline(query: QueryEmployerTimelineDto) {
    const { page, limit, employer_email } = query;
    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.timelineRepo.findAndCount({
      where: { employer_email },
      order: { created_date: 'DESC' },
      skip,
      take,
    });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async createEmployerTimelineEvent(dto: CreateEmployerTimelineDto): Promise<EmployerTimelineEntity> {
    const event = this.timelineRepo.create(dto as any);
    return this.timelineRepo.save(event) as unknown as Promise<EmployerTimelineEntity>;
  }
}

