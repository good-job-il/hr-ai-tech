import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { ApplicationTimelineEntity } from './entities/application-timeline.entity';
import { ApplicationPipelineEntity } from './entities/application-pipeline.entity';
import { CreateApplicationDto, UpdateApplicationDto, QueryApplicationsDto, CreatePipelineStageDto, UpdatePipelineStageDto } from './dto/applications.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity) private readonly appRepo: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationTimelineEntity) private readonly timelineRepo: Repository<ApplicationTimelineEntity>,
    @InjectRepository(ApplicationPipelineEntity) private readonly pipelineRepo: Repository<ApplicationPipelineEntity>,
  ) {}

  async findAll(query: QueryApplicationsDto, user: UserEntity) {
    const { page, limit, sort, order, job_id, candidate_id, candidate_email,
      status, recruiter_id, employer_company_id, assigned_to, is_deleted, search } = query;

    const rlsWhere = getRlsWhere('Application', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
    });
    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const where: Record<string, any> = { ...rlsWhere };
    if (job_id) where.job_id = job_id;
    if (candidate_id) where.candidate_id = candidate_id;
    if (candidate_email) where.candidate_email = candidate_email;
    if (status) where.status = status;
    if (recruiter_id) where.recruiter_id = recruiter_id;
    if (employer_company_id) where.employer_company_id = employer_company_id;
    if (assigned_to) where.assigned_to = assigned_to;
    if (is_deleted !== undefined) where.is_deleted = is_deleted;

    const { skip, take } = getSkipTake(page, limit);
    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, candidate_name: Like(`%${search}%`) },
        { ...where, candidate_email: Like(`%${search}%`) },
        { ...where, job_title: Like(`%${search}%`) },
      ];
    }
    const [data, total] = await this.appRepo.findAndCount({ where: findWhere, order: { [sort]: order }, skip, take });
    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number): Promise<ApplicationEntity> {
    const app = await this.appRepo.findOne({ where: { id } as any });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  async create(dto: CreateApplicationDto, user: UserEntity): Promise<ApplicationEntity> {
    const app = this.appRepo.create({
      ...dto,
      organization_id: user.organization_id,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
    } as any);
    return this.appRepo.save(app) as unknown as Promise<ApplicationEntity>;
  }

  async update(id: number, dto: UpdateApplicationDto, user: UserEntity): Promise<ApplicationEntity> {
    const app = await this.findById(id);
    const prev = app.status;
    Object.assign(app, dto);
    if (dto.is_deleted && !app.deleted_at) {
      app.deleted_at = new Date();
      app.deleted_by = user.id;
    }
    const saved = await (this.appRepo.save(app) as unknown as Promise<ApplicationEntity>);
    // Auto-create timeline on status change
    if (dto.status && dto.status !== prev) {
      await this.timelineRepo.save(this.timelineRepo.create({
        application_id: id,
        organization_id: app.organization_id,
        event_type: 'status_changed',
        previous_value: prev,
        new_value: dto.status,
        description: `Status changed from ${prev} to ${dto.status}`,
        performed_by: user.email,
        performed_by_role: user.role,
      } as any));
    }
    return saved;
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  async getTimeline(applicationId: number) {
    return this.timelineRepo.find({ where: { application_id: applicationId }, order: { created_date: 'DESC' } });
  }

  async createTimelineEvent(data: Partial<ApplicationTimelineEntity>) {
    const event = this.timelineRepo.create(data);
    return this.timelineRepo.save(event);
  }

  // ─── Pipeline ────────────────────────────────────────────────────────────
  async getPipeline(employerId: string) {
    return this.pipelineRepo.find({ where: { employer_id: employerId }, order: { order: 'ASC' } });
  }

  async createPipelineStage(dto: CreatePipelineStageDto): Promise<ApplicationPipelineEntity> {
    const stage = this.pipelineRepo.create(dto as any);
    return this.pipelineRepo.save(stage) as unknown as Promise<ApplicationPipelineEntity>;
  }

  async updatePipelineStage(id: number, dto: UpdatePipelineStageDto): Promise<ApplicationPipelineEntity> {
    const stage = await this.pipelineRepo.findOne({ where: { id } as any });
    if (!stage) throw new NotFoundException(`Stage ${id} not found`);
    Object.assign(stage, dto);
    return this.pipelineRepo.save(stage) as unknown as Promise<ApplicationPipelineEntity>;
  }

  async deletePipelineStage(id: number): Promise<void> {
    const stage = await this.pipelineRepo.findOne({ where: { id } as any });
    if (!stage) throw new NotFoundException(`Stage ${id} not found`);
    await this.pipelineRepo.remove(stage);
  }
}

