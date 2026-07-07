import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewEntity } from './interview.entity';
import { CreateInterviewDto, UpdateInterviewDto, QueryInterviewsDto } from './dto/interviews.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly repo: Repository<InterviewEntity>,
  ) {}

  async findAll(query: QueryInterviewsDto, user: UserEntity) {
    const { page, limit, sort, order, application_id, candidate_id, recruiter_id, status } = query;

    const rlsWhere = getRlsWhere('Interview', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
    });
    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const where: Record<string, any> = { ...rlsWhere };
    if (application_id) where.application_id = application_id;
    if (candidate_id) where.candidate_id = candidate_id;
    if (recruiter_id) where.recruiter_id = recruiter_id;
    if (status) where.status = status;

    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({ where, order: { [sort]: order }, skip, take });
    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number): Promise<InterviewEntity> {
    const item = await this.repo.findOne({ where: { id } as any });
    if (!item) throw new NotFoundException(`Interview ${id} not found`);
    return item;
  }

  async create(dto: CreateInterviewDto, user: UserEntity): Promise<InterviewEntity> {
    const item = this.repo.create({ ...dto, organization_id: user.organization_id } as any);
    return this.repo.save(item) as unknown as Promise<InterviewEntity>;
  }

  async update(id: number, dto: UpdateInterviewDto): Promise<InterviewEntity> {
    const item = await this.findById(id);
    Object.assign(item, dto);
    return this.repo.save(item) as unknown as Promise<InterviewEntity>;
  }

  async remove(id: number): Promise<void> {
    const item = await this.findById(id);
    await this.repo.remove(item);
  }
}

