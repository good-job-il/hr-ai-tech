import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { InterviewEntity } from "./interview.entity"
import { CreateInterviewDto, UpdateInterviewDto, QueryInterviewsDto } from "./dto/interviews.dto"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { getRlsWhere, isBlocked } from "../../common/utils/rls.utils"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { EmailService } from "../integrations/services/email.service"
import { ApplicationsService } from "../applications/applications.service"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(InterviewEntity)
    private readonly repo: Repository<InterviewEntity>,
    private readonly emailService: EmailService,
    private readonly applicationsService: ApplicationsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryInterviewsDto, user: UserEntity) {
    const { page, limit, sort, order, application_id, candidate_id, recruiter_id, status } = query

    const rlsWhere = getRlsWhere("Interview", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(rlsWhere)) {
      return buildPaginatedResponse([], 0, { page, limit })
    }

    const where: Record<string, any> = { ...rlsWhere }

    if (application_id) {
      where.application_id = application_id
    }

    if (candidate_id) {
      where.candidate_id = candidate_id
    }

    if (recruiter_id && !("recruiter_id" in rlsWhere)) {
      where.recruiter_id = recruiter_id
    }

    if (status) {
      where.status = status
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit, sort, order })
  }

  async findById(id: number, user: UserEntity): Promise<InterviewEntity> {
    const rlsWhere = getRlsWhere("Interview", {
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
      employer_company_id: user.employer_company_id,
      email: user.email,
      impersonating: user.impersonating,
    })

    if (isBlocked(rlsWhere)) {
      throw new NotFoundException(`Interview ${id} not found`)
    }

    const item = await this.repo.findOne({ where: { ...rlsWhere, id } as any })

    if (!item) {
      throw new NotFoundException(`Interview ${id} not found`)
    }

    return item
  }

  async create(dto: CreateInterviewDto, user: UserEntity): Promise<InterviewEntity> {
    const application = dto.application_id
      ? await this.applicationsService.findById(dto.application_id, user)
      : null

    const item = this.repo.create({
      ...dto,
      organization_id: application?.organization_id ?? user.organization_id,
      candidate_user_id: application?.candidate_user_id ?? null,
      candidate_id: application?.candidate_id ?? dto.candidate_id,
      candidate_email: application?.candidate_email ?? dto.candidate_email,
      candidate_name: application?.candidate_name ?? dto.candidate_name,
      job_id: application?.job_id ?? dto.job_id,
      job_title: application?.job_title ?? dto.job_title,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_manager_id:
        dto.team_manager_id ?? (user.role === UserRole.TEAM_MANAGER ? user.id : null),
      recruitment_manager_id:
        dto.recruitment_manager_id ?? (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : null),
    } as any)

    const saved = await this.dataSource.transaction(async (manager) => {
      const stored = await manager
        .getRepository(InterviewEntity)
        .save(item as unknown as InterviewEntity)

      if (stored.application_id) {
        await manager.save(
          ApplicationTimelineEntity,
          manager.create(ApplicationTimelineEntity, {
            application_id: stored.application_id,
            organization_id: stored.organization_id,
            event_type: "interview_scheduled",
            description: `Interview scheduled for ${stored.date} ${stored.time}`,
            performed_by: user.email,
            performed_by_role: user.role,
          } as any),
        )
      }

      return stored
    })

    await this.emailService
      .sendInterviewScheduled({
        candidateEmail: saved.candidate_email,
        candidateName: saved.candidate_name,
        jobTitle: saved.job_title,
        date: saved.date,
        time: saved.time,
        type: saved.type,
        locationOrLink: saved.location_or_link,
      })
      .catch(() => undefined)

    return saved
  }

  async update(id: number, dto: UpdateInterviewDto, user: UserEntity): Promise<InterviewEntity> {
    const item = await this.findById(id, user)

    Object.assign(item, dto)

    return this.repo.save(item) as unknown as Promise<InterviewEntity>
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    const item = await this.findById(id, user)

    await this.repo.remove(item)
  }
}
