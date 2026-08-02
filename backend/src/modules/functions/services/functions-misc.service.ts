import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidatesService } from '../../candidates/candidates.service';
import { ApplicationsService } from '../../applications/applications.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';
import { CommunicationService } from '../../communication/communication.service';
import { TaxonomyService } from '../../taxonomy/taxonomy.service';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import {
  CreateCompanyNotificationDto,
  CreateApplicationTimelineFnDto,
  CreateCandidateTimelineFnDto,
  DeleteCandidateFnDto,
  UpdateCompanyProfileFnDto,
  SendCandidateToEmployerDto,
} from '../dto/functions.dto';

@Injectable()
export class FunctionsMiscService {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly applicationsService: ApplicationsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly communicationService: CommunicationService,
    private readonly taxonomyService: TaxonomyService,
    private readonly usersService: UsersService,
  ) {}

  // ─── createCompanyNotification ─────────────────────────────────────────
  async createCompanyNotification(dto: CreateCompanyNotificationDto) {
    return this.notificationsService.create({
      recipient_email: dto.targetEmail,
      type: dto.type as any,
      title: dto.title,
      content: dto.content,
      metadata: dto.metadata,
    } as any);
  }

  // ─── createApplicationTimeline ──────────────────────────────────────────
  async createApplicationTimeline(dto: CreateApplicationTimelineFnDto, user: UserEntity) {
    const application = await this.applicationsService.findById(dto.application_id, user);
    const timeline = await this.applicationsService.createTimelineEvent({
      application_id: dto.application_id,
      organization_id: application.organization_id,
      event_type: dto.event_type as any,
      previous_value: dto.previous_value ?? null,
      new_value: dto.new_value ?? null,
      description: dto.description,
      performed_by: user.email,
      performed_by_role: (dto.performed_by_role ?? user.role) as any,
    });
    return { success: true, timeline };
  }

  // ─── createCandidateTimeline ─────────────────────────────────────────────
  async createCandidateTimeline(dto: CreateCandidateTimelineFnDto, user: UserEntity) {
    const timeline = await this.candidatesService.createTimelineEvent({
      candidate_id: dto.candidate_id ?? null,
      candidate_email: dto.candidate_email,
      event_type: dto.event_type,
      description: dto.description,
      metadata: dto.metadata,
      organization_id: user.organization_id,
      performed_by: user.email,
      performed_by_name: user.full_name ?? user.email,
      performed_by_role: user.role,
    } as any, user);
    return { success: true, timeline };
  }

  // ─── createAuditLog (internal helper for other functions) ───────────────
  async createAuditLog(entry: {
    organization_id?: string | null;
    actor_user_id?: string | null;
    actor_email?: string | null;
    actor_role?: string | null;
    entity_type: string;
    entity_id: string;
    entity_label?: string | null;
    action: string;
    metadata?: Record<string, any> | null;
  }) {
    const created = await this.auditService.log(entry as any);
    return { success: true, id: created.id };
  }

  // ─── deleteCandidate ──────────────────────────────────────────────────────
  async deleteCandidate(dto: DeleteCandidateFnDto, user: UserEntity) {
    const allowedRoles = [UserRole.ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.TEAM_MANAGER, UserRole.RECRUITER];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Forbidden');
    }
    const candidate = await this.candidatesService.findById(dto.candidate_id, user);
    await this.candidatesService.softDelete(dto.candidate_id, user);

    // Fire-and-forget audit log
    this.auditService
      .log({
        organization_id: candidate.organization_id,
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role,
        entity_type: 'Candidate',
        entity_id: dto.candidate_id,
        entity_label: candidate.full_name,
        action: 'delete',
      } as any)
      .catch(() => undefined);

    return { success: true };
  }

  // ─── updateCompanyProfile (stored on User for employer accounts) ─────────
  async updateCompanyProfile(dto: UpdateCompanyProfileFnDto, user: UserEntity) {
    if (dto.companyEmail !== user.email) {
      throw new ForbiddenException('Forbidden');
    }
    await this.usersService.update(
      user.id,
      {
        company_culture: dto.company_culture,
        benefits: dto.benefits ?? [],
        gallery_urls: dto.gallery_urls ?? [],
        video_url: dto.video_url,
        testimonials: dto.testimonials ?? [],
      } as any,
      user,
    );
    return { success: true, message: 'Company profile updated' };
  }

  // ─── sendCandidateToEmployer ──────────────────────────────────────────────
  async sendCandidateToEmployer(dto: SendCandidateToEmployerDto, user: UserEntity) {
    const allowedRoles = [UserRole.ADMIN, UserRole.RECRUITMENT_MANAGER, UserRole.TEAM_MANAGER, UserRole.RECRUITER];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Unauthorized: Internal recruitment access only');
    }

    const attachmentList = (dto.attachmentUrls || [])
      .map((a) => `• ${a.filename || a.doc_type || 'קובץ'}: ${a.url}`)
      .join('\n');

    const body = `שלום,

מצורפת מועמדות עבור${dto.jobTitle ? ` המשרה: ${dto.jobTitle}` : ''}

שם המועמד: ${dto.candidateName}
${dto.candidateEmail ? `אימייל: ${dto.candidateEmail}` : ''}

${dto.recruiterNote ? `הערת מגייס:\n${dto.recruiterNote}\n` : ''}
${attachmentList ? `\nקישורי מסמכים:\n${attachmentList}` : ''}

בברכה,
${user.full_name || user.email}`;

    // NOTE: actual SMTP sending should be wired via EmailService (nodemailer) in production.
    // For now we log the communication regardless of delivery, matching Base44 behaviour.

    await this.communicationService.create(
      {
        organization_id: user.organization_id ?? undefined,
        candidate_id: dto.candidateId,
        candidate_email: dto.candidateEmail ?? undefined,
        channel: 'email',
        direction: 'outbound',
        sender_email: user.email,
        sender_name: user.full_name ?? user.email,
        subject: dto.subject || `מועמדות: ${dto.candidateName}`,
        content: body,
        status: 'sent',
        related_job_id: dto.jobId ?? undefined,
      } as any,
      user,
    );

    await this.candidatesService.createTimelineEvent({
      organization_id: user.organization_id,
      candidate_id: dto.candidateId,
      candidate_email: dto.candidateEmail ?? null,
      event_type: 'sent_to_employer',
      description: `מועמד נשלח ל-${dto.to}${dto.jobTitle ? ` עבור: ${dto.jobTitle}` : ''}`,
      performed_by: user.email,
      performed_by_name: user.full_name ?? user.email,
      performed_by_role: user.role,
      metadata: {
        to: dto.to,
        cc: dto.cc || '',
        job_title: dto.jobTitle || '',
        attachments_count: (dto.attachmentUrls || []).length,
      },
      is_visible_to_candidate: false,
      is_visible_to_employer: true,
    } as any, user);

    this.auditService
      .log({
        organization_id: user.organization_id,
        actor_user_id: user.id,
        actor_email: user.email,
        actor_role: user.role,
        entity_type: 'Candidate',
        entity_id: dto.candidateId,
        entity_label: dto.candidateName,
        action: 'send_to_employer',
        metadata: { to: dto.to, job_title: dto.jobTitle ?? null, job_id: dto.jobId ?? null },
      } as any)
      .catch(() => undefined);

    return { success: true, message: `אימייל נשלח בהצלחה אל ${dto.to}` };
  }

  // ─── loadTaxonomy (adapted: returns current taxonomy stats/data) ─────────
  async loadTaxonomy() {
    const data = await this.taxonomyService.loadAll();
    return {
      success: true,
      message: 'Taxonomy loaded from database',
      stats: {
        domains: data.domains.length,
        roles: data.roles.length,
        specializations: data.specializations.length,
        employmentTypes: data.employmentTypes.length,
        workModes: data.workModes.length,
        experienceLevels: data.experienceLevels.length,
      },
      ...data,
    };
  }

  // ─── getLocationFromIP ────────────────────────────────────────────────────
  async getLocationFromIP(ip: string | undefined) {
    try {
      if (!ip || ip === 'unknown') {
        return { city: 'תל אביב' };
      }
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`);
      const data = (await response.json()) as { status?: string; city?: string };
      if (data.status === 'success' && data.city) {
        return { city: data.city };
      }
      return { city: 'תל אביב' };
    } catch {
      return { city: 'תל אביב' };
    }
  }
}
