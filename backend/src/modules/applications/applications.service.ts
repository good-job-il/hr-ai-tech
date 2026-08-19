import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Like } from 'typeorm';
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
import { AuditLogEntity } from '../audit/audit-log.entity';

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
    private readonly dataSource: DataSource,
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
    await this.assertAgencyAssignments(dto, user);
    const jobScope = getRlsWhere('Job', {
      id: user.id, role: user.role, organization_id: user.organization_id,
      employer_company_id: user.employer_company_id, email: user.email,
      impersonating: user.impersonating,
    });
    if (isBlocked(jobScope)) throw new NotFoundException(`Job ${dto.job_id} not found`);
    const job = await this.jobRepo.findOne({ where: { ...jobScope, id: dto.job_id } as any });
    if (!job?.organization_id) throw new NotFoundException(`Job ${dto.job_id} not found`);

    if (dto.candidate_id != null) {
      const duplicate = await this.appRepo.findOne({
        where: { organization_id: job.organization_id, job_id: job.id, candidate_id: dto.candidate_id, is_deleted: false },
      });
      if (duplicate) throw new ConflictException('This candidate is already in the pipeline for this job');
    }

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
    let saved: ApplicationEntity;
    try {
      saved = await this.dataSource.transaction(async manager => {
        const stored = await manager.getRepository(ApplicationEntity).save(app as unknown as ApplicationEntity);
        await manager.save(ApplicationTimelineEntity, manager.create(ApplicationTimelineEntity, {
          application_id: stored.id,
          organization_id: stored.organization_id,
          event_type: 'submitted',
          description: `Candidate applied for ${stored.job_title || job.title}`,
          performed_by: user.email,
          performed_by_role: user.role,
        } as any));
        return stored;
      });
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('This candidate is already in the pipeline for this job');
      }
      throw error;
    }
    await this.emailService.sendApplicationSubmitted({
      candidateEmail: saved.candidate_email,
      candidateName: saved.candidate_name,
      jobTitle: saved.job_title || job.title,
      employerEmail: job.contact_email || job.employer_id,
    }).catch(() => undefined);
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
    const candidateUser = candidate.email
      ? await this.userRepo.findOne({ where: { email: candidate.email } })
      : null;
    const recruiterId = candidate.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null);
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
      recruiter_id: recruiterId,
      assigned_to: recruiterId,
      team_manager_id: candidate.team_manager_id ?? user.team_manager_id,
      recruitment_manager_id: candidate.recruitment_manager_id
        ?? (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : user.recruitment_manager_id),
    }, user, candidateUser?.id ?? null);
  }

  async update(id: number, dto: UpdateApplicationDto, user: UserEntity, reason?: string): Promise<ApplicationEntity> {
    await this.assertAgencyAssignments(dto, user);
    const app = await this.findById(id, user);
    const prev = app.status;
    if (dto.status && dto.status !== prev) this.assertStatusTransition(prev, dto.status);
    Object.assign(app, dto);
    if (dto.is_deleted && !app.deleted_at) {
      app.deleted_at = new Date();
      app.deleted_by = user.id;
    }
    const statusChanged = Boolean(dto.status && dto.status !== prev);
    const saved = statusChanged
      ? await this.dataSource.transaction(async manager => {
        const stored = await manager.save(ApplicationEntity, app as ApplicationEntity);
          await manager.save(ApplicationTimelineEntity, manager.create(ApplicationTimelineEntity, {
            application_id: id,
            organization_id: app.organization_id,
            event_type: 'status_changed',
            previous_value: prev,
            new_value: dto.status,
            description: reason
              ? `Status changed from ${prev} to ${dto.status}: ${reason}`
              : `Status changed from ${prev} to ${dto.status}`,
            performed_by: user.email,
            performed_by_role: user.role,
          } as any));
          await manager.save(AuditLogEntity, manager.create(AuditLogEntity, {
            organization_id: app.organization_id == null ? null : String(app.organization_id),
            actor_user_id: String(user.id),
            actor_email: user.email,
            actor_role: user.role,
            entity_type: 'Application',
            entity_id: app.id,
            entity_label: `${app.candidate_name} — ${app.job_title || 'position'}`,
            action: 'status_change',
            metadata: {
              previous_status: prev,
              status: dto.status,
              reason: reason || null,
              recruiter_id: app.recruiter_id,
              team_manager_id: app.team_manager_id,
              job_id: app.job_id,
              candidate_id: app.candidate_id,
            },
          }));
          return stored;
        })
      : await (this.appRepo.save(app) as unknown as Promise<ApplicationEntity>);
    if (statusChanged) {
      await this.notificationsService.create({
        recipient_email: app.candidate_email,
        organization_id: app.organization_id,
        type: ['phone_interview', 'employer_interview'].includes(dto.status) ? 'interview_scheduled' : 'new_application',
        title: `Application status updated — ${app.job_title || 'position'}`,
        content: `Your application status changed from ${prev} to ${dto.status}.`,
        metadata: { application_id: app.id, previous_status: prev, status: dto.status },
      } as any).catch(() => undefined);
    }
    return saved;
  }

  changeStatus(id: number, status: UpdateApplicationDto['status'], reason: string | undefined, user: UserEntity) {
    return this.update(id, { status } as UpdateApplicationDto, user, reason);
  }

  async reopen(id: number, status: UpdateApplicationDto['status'], reason: string, user: UserEntity) {
    if (!reason?.trim()) throw new BadRequestException('A reason is required to reopen a rejected application');
    const app = await this.findById(id, user);
    if (app.status !== 'rejected') throw new BadRequestException('Only rejected applications can be reopened');
    const previous = app.status;
    app.status = status!;
    return this.dataSource.transaction(async manager => {
      const saved = await manager.save(ApplicationEntity, app);
      await manager.save(ApplicationTimelineEntity, manager.create(ApplicationTimelineEntity, {
        application_id: app.id,
        organization_id: app.organization_id,
        event_type: 'status_changed',
        previous_value: previous,
        new_value: status,
        description: `Rejected application reopened: ${reason.trim()}`,
        performed_by: user.email,
        performed_by_role: user.role,
      } as any));
      await manager.save(AuditLogEntity, manager.create(AuditLogEntity, {
        organization_id: app.organization_id == null ? null : String(app.organization_id),
        actor_user_id: String(user.id),
        actor_email: user.email,
        actor_role: user.role,
        entity_type: 'Application',
        entity_id: app.id,
        entity_label: `${app.candidate_name} — ${app.job_title || 'position'}`,
        action: 'status_change',
        metadata: {
          previous_status: previous,
          status,
          reason: reason.trim(),
          recruiter_id: app.recruiter_id,
          team_manager_id: app.team_manager_id,
          job_id: app.job_id,
          candidate_id: app.candidate_id,
        },
      }));
      return saved;
    });
  }

  private assertStatusTransition(previous: string, next: string) {
    if (previous === 'completed') throw new BadRequestException('Completed applications cannot be reopened');
    if (previous === 'rejected' && next !== 'rejected') {
      throw new BadRequestException('Use the reopen operation for rejected applications');
    }
  }

  private async assertAgencyAssignments(dto: Partial<CreateApplicationDto>, user: UserEntity) {
    if (user.org_type !== 'staffing_agency') return;
    if (!user.organization_id) throw new BadRequestException('Organization context required');
    const fields: Array<[keyof CreateApplicationDto, UserRole]> = [
      ['recruiter_id', UserRole.RECRUITER],
      ['assigned_to', UserRole.RECRUITER],
      ['team_manager_id', UserRole.TEAM_MANAGER],
      ['recruitment_manager_id', UserRole.RECRUITMENT_MANAGER],
    ];
    for (const [field, role] of fields) {
      const id = dto[field];
      if (id == null) continue;
      const assignee = await this.userRepo.findOne({ where: { id: Number(id), organization_id: user.organization_id, role, is_active: true } });
      if (!assignee) throw new BadRequestException(`Invalid ${String(field)} assignment`);
    }
  }

  async addNote(id: number, content: string, user: UserEntity) {
    const app = await this.findById(id, user);
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${user.full_name || user.email}: ${content.trim()}`;
    return this.dataSource.transaction(async manager => {
      app.notes = app.notes ? `${app.notes}\n${line}` : line;
      const saved = await manager.save(ApplicationEntity, app);
      await manager.save(ApplicationTimelineEntity, manager.create(ApplicationTimelineEntity, {
        application_id: app.id,
        organization_id: app.organization_id,
        event_type: 'note_added',
        description: content.trim(),
        performed_by: user.email,
        performed_by_role: user.role,
      } as any));
      return saved;
    });
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
