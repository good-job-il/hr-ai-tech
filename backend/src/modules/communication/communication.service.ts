import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { CommunicationLogEntity, EmployerTimelineEntity } from "./communication-log.entity"
import {
  CreateCommunicationLogDto,
  QueryCommunicationLogsDto,
  CreateEmployerTimelineDto,
  QueryEmployerTimelineDto,
  PresentCandidateDto,
} from "./dto/communication.dto"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { CandidatesService } from "../candidates/candidates.service"
import { JobsService } from "../jobs/jobs.service"
import { EmailService } from "../integrations/services/email.service"
import { BadRequestException } from "@nestjs/common"

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(CommunicationLogEntity)
    private readonly logRepo: Repository<CommunicationLogEntity>,
    @InjectRepository(EmployerTimelineEntity)
    private readonly timelineRepo: Repository<EmployerTimelineEntity>,
    private readonly candidatesService: CandidatesService,
    private readonly jobsService: JobsService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Communication Log ───────────────────────────────────────────────────
  async findAll(query: QueryCommunicationLogsDto, user: UserEntity) {
    const { page, limit, sort, order, candidate_id, channel } = query

    if (
      [UserRole.TEAM_MANAGER, UserRole.RECRUITER, UserRole.INTERNAL_RECRUITER].includes(user.role)
    ) {
      if (!candidate_id) {
        return buildPaginatedResponse([], 0, { page, limit })
      }

      await this.candidatesService.findById(candidate_id, user)
    }

    const where: Record<string, any> = {}

    if (user.role !== UserRole.ADMIN) {
      where.organization_id = user.organization_id
    }

    if (candidate_id) {
      where.candidate_id = candidate_id
    }

    if (channel) {
      where.channel = channel
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.logRepo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async presentCandidate(dto: PresentCandidateDto, user: UserEntity) {
    const candidate = await this.candidatesService.findById(dto.candidate_id, user)

    const job = await this.jobsService.findById(dto.job_id, user)

    const recipient = job.contact_email || job.employer_id

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      throw new BadRequestException("The job has no employer contact email")
    }

    await this.emailService.sendCandidatePresentation({
      recipientEmail: recipient,
      candidateName: candidate.full_name,
      candidateEmail: candidate.email,
      jobTitle: job.title,
      recruiterName: user.full_name || user.email,
      recruiterNote: dto.recruiter_note,
      resumeUrl: candidate.resume_url || candidate.converted_resume_url,
    })

    const log = await this.create(
      {
        candidate_id: candidate.id,
        channel: "email",
        direction: "outbound",
        subject: `Candidate presentation — ${candidate.full_name} — ${job.title}`,
        content: dto.recruiter_note || `Candidate presented for ${job.title}`,
        status: "sent",
        related_job_id: job.id,
      },
      user,
    )

    return { success: true, communication_log_id: log.id }
  }

  async create(dto: CreateCommunicationLogDto, user: UserEntity): Promise<CommunicationLogEntity> {
    const candidate = await this.candidatesService.findById(dto.candidate_id, user)

    const log = this.logRepo.create({
      ...dto,
      organization_id: user.organization_id,
      candidate_email: candidate.email,
      sender_email: user.email,
      sender_name: user.full_name,
    } as any)

    const saved = await (this.logRepo.save(log) as unknown as Promise<CommunicationLogEntity>)

    await this.candidatesService.createTimelineEvent(
      {
        candidate_id: candidate.id,
        event_type: "message_sent",
        description: `${saved.channel} communication logged: ${saved.content}`,
        metadata: { communication_log_id: saved.id, channel: saved.channel, status: saved.status },
      },
      user,
    )

    return saved
  }

  // ─── Employer Timeline ────────────────────────────────────────────────────
  async getEmployerTimeline(query: QueryEmployerTimelineDto) {
    const { page, limit, employer_email } = query

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.timelineRepo.findAndCount({
      where: { employer_email },
      order: { created_date: "DESC" },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async createEmployerTimelineEvent(
    dto: CreateEmployerTimelineDto,
  ): Promise<EmployerTimelineEntity> {
    const event = this.timelineRepo.create(dto as any)

    return this.timelineRepo.save(event) as unknown as Promise<EmployerTimelineEntity>
  }
}
