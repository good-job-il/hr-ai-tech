import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JobEntity } from './entities/job.entity';
import { SavedJobEntity } from './entities/saved-job.entity';
import { JobAlertEntity } from './entities/job-alert.entity';
import { CreateJobDto, UpdateJobDto, QueryJobsDto, CreateSavedJobDto, CreateJobAlertDto, UpdateJobAlertDto } from './dto/jobs.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(SavedJobEntity) private readonly savedJobRepo: Repository<SavedJobEntity>,
    @InjectRepository(JobAlertEntity) private readonly alertRepo: Repository<JobAlertEntity>,
  ) {}

  async findAll(query: QueryJobsDto, user: UserEntity) {
    const { page, limit, sort, order, search, organization_id, employer_company_id,
      recruiter_id, domain_id, type, is_closed, is_deleted } = query;

    const rlsWhere = getRlsWhere('Job', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
    });

    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const where: Record<string, any> = { ...rlsWhere };
    if (organization_id && user.role === UserRole.ADMIN) {
      where.organization_id = organization_id;
    }
    if (employer_company_id) where.employer_company_id = employer_company_id;
    if (recruiter_id) where.recruiter_id = recruiter_id;
    if (domain_id) where.domain_id = domain_id;
    if (type) where.type = type;
    if (is_closed !== undefined) where.is_closed = is_closed;
    if (is_deleted !== undefined) where.is_deleted = is_deleted;

    const { skip, take } = getSkipTake(page, limit);
    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, title: Like(`%${search}%`) },
        { ...where, company: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.jobRepo.findAndCount({
      where: findWhere, order: { [sort]: order }, skip, take,
    });

    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number, user: UserEntity): Promise<JobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } as any });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async create(dto: CreateJobDto, user: UserEntity): Promise<JobEntity> {
    const job = this.jobRepo.create({
      ...dto,
      organization_id: user.organization_id,
      created_by_user_id: user.id,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
    } as any);
    return this.jobRepo.save(job) as unknown as Promise<JobEntity>;
  }

  async update(id: number, dto: UpdateJobDto, user: UserEntity): Promise<JobEntity> {
    const job = await this.findById(id, user);
    Object.assign(job, dto);
    if (dto.is_deleted && !job.deleted_at) {
      job.deleted_at = new Date();
      job.deleted_by = user.id;
    }
    return this.jobRepo.save(job) as unknown as Promise<JobEntity>;
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  async incrementViews(id: number): Promise<void> {
    await this.jobRepo.increment({ id } as any, 'views', 1);
  }

  // ─── Saved Jobs ──────────────────────────────────────────────────────────
  async getSavedJobs(userEmail: string, jobId?: string) {
    const where: any = { user_email: userEmail };
    if (jobId) where.job_id = jobId;
    return this.savedJobRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async saveJob(dto: CreateSavedJobDto): Promise<SavedJobEntity> {
    const existing = await this.savedJobRepo.findOne({ where: { user_email: dto.user_email, job_id: dto.job_id } as any });
    if (existing) return existing;
    const saved = this.savedJobRepo.create(dto as any);
    return this.savedJobRepo.save(saved) as unknown as Promise<SavedJobEntity>;
  }

  async unsaveJob(id: number, userEmail: string): Promise<void> {
    const saved = await this.savedJobRepo.findOne({ where: { id } });
    if (!saved) throw new NotFoundException('Saved job not found');
    if (saved.user_email !== userEmail) throw new ForbiddenException('Access denied');
    await this.savedJobRepo.remove(saved);
  }

  // ─── Job Alerts ───────────────────────────────────────────────────────────
  async getAlerts(userEmail: string) {
    return this.alertRepo.find({ where: { user_email: userEmail } });
  }

  async createAlert(dto: CreateJobAlertDto): Promise<JobAlertEntity> {
    const alert = this.alertRepo.create(dto as any);
    return this.alertRepo.save(alert) as unknown as Promise<JobAlertEntity>;
  }

  async updateAlert(id: number, dto: UpdateJobAlertDto): Promise<JobAlertEntity> {
    const alert = await this.alertRepo.findOne({ where: { id } as any });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    Object.assign(alert, dto);
    return this.alertRepo.save(alert) as unknown as Promise<JobAlertEntity>;
  }

  async deleteAlert(id: number): Promise<void> {
    const alert = await this.alertRepo.findOne({ where: { id } as any });
    if (!alert) throw new NotFoundException(`Alert ${id} not found`);
    await this.alertRepo.remove(alert);
  }
}

