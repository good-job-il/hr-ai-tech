import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { ApplicationTimelineEntity } from './entities/application-timeline.entity';
import { AssignCandidateDto, CreateApplicationDto, SubmitApplicationDto, UpdateApplicationDto, QueryApplicationsDto } from './dto/applications.dto';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { getRlsWhere, isBlocked } from '../../common/utils/rls.utils';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';
import { JobEntity } from '../jobs/entities/job.entity';
import { EmailService } from '../integrations/services/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CandidateEntity } from '../candidates/entities/candidate.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity) private readonly appRepo: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationTimelineEntity) private readonly timelineRepo: Repository<ApplicationTimelineEntity>,
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(CandidateEntity) private readonly candidateRepo: Repository<CandidateEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: QueryApplicationsDto, user: UserEntity) {
    const { page, limit, sort, order, job_id, candidate_id, candidate_email,
      status, recruiter_id, employer_company_id, assigned_to, is_deleted, search } = query;

    const rlsWhere = getRlsWhere('Application', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(rlsWhere)) return buildPaginatedResponse([], 0, { page, limit });

    const isRecruiterScope = [UserRole.RECRUITER, UserRole.INTERNAL_RECRUITER].includes(user.role);
    const scopeFilters: Record<string, any>[] = isRecruiterScope
      ? [
          { ...rlsWhere, recruiter_id: user.id },
          { ...rlsWhere, recruiter_id: undefined, assigned_to: user.id },
        ]
      : [{ ...rlsWhere }];
    const withQueryFilters = scopeFilters.map(where => {
      const result = { ...where };
      if (job_id) result.job_id = job_id;
      if (candidate_id) result.candidate_id = candidate_id;
      if (candidate_email && !('candidate_email' in rlsWhere)) result.candidate_email = candidate_email;
      if (status) result.status = status;
      if (recruiter_id && !isRecruiterScope) result.recruiter_id = recruiter_id;
      if (employer_company_id && !('employer_company_id' in rlsWhere)) result.employer_company_id = employer_company_id;
      if (assigned_to && !isRecruiterScope) result.assigned_to = assigned_to;
      if (is_deleted !== undefined && !('is_deleted' in rlsWhere)) result.is_deleted = is_deleted;
      return result;
    });

    const { skip, take } = getSkipTake(page, limit);
    let findWhere: any = withQueryFilters;
    if (search) {
      findWhere = withQueryFilters.flatMap(where => [
        { ...where, candidate_name: Like(`%${search}%`) },
        { ...where, candidate_email: Like(`%${search}%`) },
        { ...where, job_title: Like(`%${search}%`) },
      ]);
    }
    const [data, total] = await this.appRepo.findAndCount({ where: findWhere, order: { [sort]: order }, skip, take });
    return buildPaginatedResponse(data, total, { page, limit, sort, order });
  }

  async findById(id: number, user: UserEntity): Promise<ApplicationEntity> {
    const rlsWhere = getRlsWhere('Application', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(rlsWhere)) throw new NotFoundException(`Application ${id} not found`);
    const isRecruiterScope = [UserRole.RECRUITER, UserRole.INTERNAL_RECRUITER].includes(user.role);
    const where = isRecruiterScope
      ? [
          { ...rlsWhere, recruiter_id: user.id, id },
          { ...rlsWhere, recruiter_id: undefined, assigned_to: user.id, id },
        ]
      : { ...rlsWhere, id };
    const app = await this.appRepo.findOne({ where: where as any });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  async create(dto: CreateApplicationDto, user: UserEntity, candidateUserId: number | null = null): Promise<ApplicationEntity> {
    const jobScope = getRlsWhere('Job', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(jobScope)) throw new NotFoundException(`Job ${dto.job_id} not found`);
    const job = await this.jobRepo.findOne({ where: { ...jobScope, id: dto.job_id } as any });
    if (!job?.organization_id) throw new NotFoundException(`Job ${dto.job_id} not found`);

    const isCandidate = user.role === UserRole.CANDIDATE;
    const app = this.appRepo.create({
      ...dto,
      organization_id: job.organization_id,
      employer_company_id: job.employer_company_id,
      job_title: dto.job_title ?? job.title,
      company: dto.company ?? job.company,
      candidate_email: isCandidate ? user.email : dto.candidate_email,
      candidate_user_id: isCandidate ? user.id : candidateUserId,
      candidate_id: isCandidate ? null : dto.candidate_id,
      recruiter_id: isCandidate ? null : (dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null)),
      assigned_to: isCandidate ? null : dto.assigned_to,
      status: isCandidate ? 'new' : dto.status,
      source: isCandidate ? 'app' : dto.source,
    } as any);
    const saved = await (this.appRepo.save(app) as unknown as Promise<ApplicationEntity>);
    await this.timelineRepo.save(this.timelineRepo.create({
      application_id: saved.id,
      organization_id: saved.organization_id,
      event_type: 'submitted',
      description: `Candidate applied for ${saved.job_title || job.title}`,
      performed_by: user.email,
      performed_by_role: user.role,
    } as any));
    await this.emailService.sendApplicationSubmitted({
      candidateEmail: saved.candidate_email,
      candidateName: saved.candidate_name,
      jobTitle: saved.job_title || job.title,
      employerEmail: job.contact_email || job.employer_id,
    });
    return saved;
  }

  async submit(dto: SubmitApplicationDto, user: UserEntity): Promise<ApplicationEntity> {
    return this.create({
      ...dto,
      candidate_name: dto.candidate_name ?? user.full_name ?? user.email,
      candidate_email: user.email,
      source: 'app',
      status: 'new',
    }, user);
  }

  async assignCandidate(dto: AssignCandidateDto, user: UserEntity): Promise<ApplicationEntity> {
    const candidateScope = getRlsWhere('Candidate', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(candidateScope)) throw new NotFoundException(`Candidate ${dto.candidate_id} not found`);
    const candidate = await this.candidateRepo.findOne({ where: { ...candidateScope, id: dto.candidate_id } as any });
    if (!candidate) throw new NotFoundException(`Candidate ${dto.candidate_id} not found`);
    const existing = await this.appRepo.findOne({
      where: { job_id: dto.job_id, candidate_id: candidate.id, is_deleted: false } as any,
    });
    if (existing) return existing;
    const candidateUser = candidate.email
      ? await this.userRepo.findOne({ where: { email: candidate.email } })
      : null;
    return this.create({
      job_id: dto.job_id,
      candidate_id: candidate.id,
      candidate_name: candidate.full_name,
      candidate_email: candidate.email,
      candidate_phone: candidate.phone,
      resume_url: candidate.resume_url ?? candidate.converted_resume_url,
      location: candidate.location,
      source: 'pool_assignment',
      status: 'new',
      recruiter_id: candidate.recruiter_id ?? user.id,
      assigned_to: candidate.recruiter_id ?? user.id,
      team_manager_id: candidate.team_manager_id ?? user.team_manager_id,
      recruitment_manager_id: candidate.recruitment_manager_id ?? user.recruitment_manager_id,
    }, user, candidateUser?.id ?? null);
  }

  async update(id: number, dto: UpdateApplicationDto, user: UserEntity): Promise<ApplicationEntity> {
    const app = await this.findById(id, user);
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
      await this.notificationsService.create({
        recipient_email: app.candidate_email,
        organization_id: app.organization_id,
        type: ['phone_interview', 'employer_interview'].includes(dto.status) ? 'interview_scheduled' : 'new_application',
        title: `Application status updated — ${app.job_title || 'position'}`,
        content: `Your application status changed from ${prev} to ${dto.status}.`,
        metadata: { application_id: app.id, previous_status: prev, status: dto.status },
      } as any);
    }
    return saved;
  }

  changeStatus(id: number, status: UpdateApplicationDto['status'], user: UserEntity) {
    return this.update(id, { status } as UpdateApplicationDto, user);
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  // ─── Timeline ────────────────────────────────────────────────────────────
  async getTimeline(applicationId: number, user: UserEntity) {
    await this.findById(applicationId, user);
    return this.timelineRepo.find({ where: { application_id: applicationId }, order: { created_date: 'DESC' } });
  }

  async createTimelineEvent(data: Partial<ApplicationTimelineEntity>) {
    const event = this.timelineRepo.create(data);
    return this.timelineRepo.save(event);
  }

}
