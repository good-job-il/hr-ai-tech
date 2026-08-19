import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, Like } from "typeorm"
import { JobEntity } from "./entities/job.entity"
import { SavedJobEntity } from "./entities/saved-job.entity"
import { JobAlertEntity } from "./entities/job-alert.entity"
import {
  CreateJobDto,
  UpdateJobDto,
  QueryJobsDto,
  CreateSavedJobDto,
  CreateJobAlertDto,
  UpdateJobAlertDto,
} from "./dto/jobs.dto"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"
import { getRlsWhere, isBlocked } from "../../common/utils/rls.utils"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { OrgType } from "../../common/enums/org-type.enum"
import { AgencyClientEntity } from "../agency-clients/agency-client.entity"
import { CompanyEntity } from "../companies/company.entity"
import { AuditService } from "../audit/audit.service"

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobEntity) private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(SavedJobEntity) private readonly savedJobRepo: Repository<SavedJobEntity>,
    @InjectRepository(JobAlertEntity) private readonly alertRepo: Repository<JobAlertEntity>,
    @InjectRepository(AgencyClientEntity)
    private readonly agencyClientRepo: Repository<AgencyClientEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly audit: AuditService,
  ) {}

  async findAll(query: QueryJobsDto, user?: UserEntity) {
    const {
      page,
      limit,
      sort,
      order,
      search,
      organization_id,
      employer_company_id,
      recruiter_id,
      domain_id,
      type,
      state,
      is_closed,
      is_deleted,
    } = query

    const rlsWhere = user
      ? getRlsWhere("Job", {
          id: user.id,
          role: user.role,
          organization_id: user.organization_id,
          team_id: user.team_id,
          employer_company_id: user.employer_company_id,
          email: user.email,
          impersonating: user.impersonating,
        })
      : { state: "open", is_deleted: false }

    if (isBlocked(rlsWhere)) {
      return buildPaginatedResponse([], 0, { page, limit })
    }

    const where: Record<string, any> = { ...rlsWhere }

    if (organization_id && user?.role === UserRole.ADMIN && !user.impersonating) {
      where.organization_id = organization_id
    }

    if (employer_company_id && !("employer_company_id" in rlsWhere)) {
      where.employer_company_id = employer_company_id
    }

    if (recruiter_id && !("recruiter_id" in rlsWhere)) {
      where.recruiter_id = recruiter_id
    }

    if (domain_id) {
      where.domain_id = domain_id
    }

    if (type) {
      where.type = type
    }

    if (state && user) {
      where.state = state
    }

    if (is_closed !== undefined && user && !("is_closed" in rlsWhere)) {
      where.is_closed = is_closed
    }

    if (is_deleted !== undefined && !("is_deleted" in rlsWhere)) {
      where.is_deleted = is_deleted
    }

    const { skip, take } = getSkipTake(page, limit)

    let findWhere: any = where

    if (search) {
      findWhere = [
        { ...where, title: Like(`%${search}%`) },
        { ...where, company: Like(`%${search}%`) },
      ]
    }

    const [data, total] = await this.jobRepo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit, sort, order })
  }

  async findById(id: number, user?: UserEntity): Promise<JobEntity> {
    const rlsWhere = user
      ? getRlsWhere("Job", {
          id: user.id,
          role: user.role,
          organization_id: user.organization_id,
          team_id: user.team_id,
          employer_company_id: user.employer_company_id,
          email: user.email,
          impersonating: user.impersonating,
        })
      : { state: "open", is_deleted: false }

    if (isBlocked(rlsWhere)) {
      throw new NotFoundException(`Job ${id} not found`)
    }

    const job = await this.jobRepo.findOne({ where: { ...rlsWhere, id } as any })

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`)
    }

    return job
  }

  async create(dto: CreateJobDto, user: UserEntity): Promise<JobEntity> {
    this.assertValidJob(dto)

    const clientCompany = await this.resolveAgencyClientCompany(dto.employer_company_id, user)

    const assignmentTeamId = await this.assertAgencyAssignments(dto, user)

    const job = this.jobRepo.create({
      ...dto,
      ...(clientCompany
        ? {
            employer_company_id: clientCompany.id,
            company: clientCompany.name,
            company_initials: clientCompany.initials,
            company_color: clientCompany.color,
          }
        : {}),
      organization_id: user.organization_id,
      created_by_user_id: user.id,
      recruiter_id: dto.recruiter_id ?? (user.role === UserRole.RECRUITER ? user.id : null),
      team_id: assignmentTeamId,
      team_manager_id:
        user.role === UserRole.TEAM_MANAGER ? user.id : dto.team_manager_id,
      recruitment_manager_id:
        dto.recruitment_manager_id ?? (user.role === UserRole.RECRUITMENT_MANAGER ? user.id : null),
      state: dto.state ?? (dto.is_closed ? "closed" : "open"),
      is_closed: dto.state ? ["filled", "closed"].includes(dto.state) : dto.is_closed,
    } as any)

    return this.jobRepo.save(job) as unknown as Promise<JobEntity>
  }

  async update(id: number, dto: UpdateJobDto, user: UserEntity): Promise<JobEntity> {
    const job = await this.findById(id, user)

    const assignmentTeamId = await this.assertAgencyAssignments(dto, user)

    const clientCompany = await this.resolveAgencyClientCompany(
      dto.employer_company_id ?? job.employer_company_id,
      user,
    )

    Object.assign(job, dto)

    if (assignmentTeamId != null) {
      job.team_id = assignmentTeamId

      if (user.role === UserRole.TEAM_MANAGER) {
job.team_manager_id = user.id
}
    }

    if (dto.state) {
      job.is_closed = ["filled", "closed"].includes(dto.state)
    } else if (dto.is_closed !== undefined) {
      job.state = dto.is_closed ? "closed" : "open"
    }

    if (clientCompany) {
      job.employer_company_id = clientCompany.id
      job.company = clientCompany.name
      job.company_initials = clientCompany.initials
      job.company_color = clientCompany.color
    }

    this.assertValidJob(job)

    if (dto.is_deleted && !job.deleted_at) {
      job.deleted_at = new Date()
      job.deleted_by = user.id
    }

    return this.jobRepo.save(job) as unknown as Promise<JobEntity>
  }

  async changeState(id: number, state: JobEntity["state"], user: UserEntity) {
    const job = await this.findById(id, user)

    const previous = job.state

    job.state = state
    job.is_closed = ["filled", "closed"].includes(state)

    const saved = await this.jobRepo.save(job)

    await this.audit.log({
      organization_id: saved.organization_id == null ? null : String(saved.organization_id),
      actor_user_id: String(user.id),
      actor_email: user.email,
      actor_role: user.role,
      entity_type: "Job",
      entity_id: saved.id,
      entity_label: saved.title,
      action: "status_change",
      metadata: { previous_state: previous, state },
    })

    return saved
  }

  private assertValidJob(job: Partial<JobEntity | CreateJobDto>) {
    if (job.salary_min != null && job.salary_max != null && job.salary_min > job.salary_max) {
      throw new BadRequestException("salary_min cannot be greater than salary_max")
    }

    if (job.show_contact_details && !job.contact_email && !job.contact_phone) {
      throw new BadRequestException(
        "Contact email or phone is required when contact details are visible",
      )
    }
  }

  private async assertAgencyAssignments(dto: Partial<CreateJobDto>, user: UserEntity) {
    if (user.org_type !== OrgType.STAFFING_AGENCY) {
      return null
    }

    if (!user.organization_id) {
      throw new ForbiddenException("Organization context required")
    }

    const assignments: Array<[keyof CreateJobDto, UserRole]> = [
      ["recruiter_id", UserRole.RECRUITER],
      ["team_manager_id", UserRole.TEAM_MANAGER],
      ["recruitment_manager_id", UserRole.RECRUITMENT_MANAGER],
    ]

    const teamIds = new Set<number>()

    for (const [field, role] of assignments) {
      const id = dto[field]

      if (id == null) {
        continue
      }

      const assignee = await this.userRepo.findOne({
        where: { id: Number(id), organization_id: user.organization_id, role, is_active: true },
      })

      if (!assignee) {
        throw new ForbiddenException(`Invalid ${String(field)} assignment`)
      }

      if (user.role === UserRole.TEAM_MANAGER) {
        if (!user.team_id || assignee.team_id !== user.team_id) {
          throw new ForbiddenException("Assignee must belong to the Team Manager's team")
        }

        if (field === "team_manager_id" && assignee.id !== user.id) {
          throw new ForbiddenException("Team Manager cannot assign another team manager")
        }
      }

      if (assignee.team_id) {
teamIds.add(assignee.team_id)
}
    }

    if (teamIds.size > 1) {
throw new BadRequestException("All assignees must belong to the same team")
}

    if (user.role === UserRole.TEAM_MANAGER) {
      if (!user.team_id) {
throw new ForbiddenException("Active team membership required")
}

      return user.team_id
    }

    return [...teamIds][0] ?? null
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user)
  }

  async incrementViews(id: number): Promise<void> {
    await this.jobRepo.increment({ id } as any, "views", 1)
  }

  /**
   * Agency jobs always belong to an active AgencyClient relationship in the
   * current organization. The company snapshot is resolved server-side so a
   * caller cannot attach a job to another agency's customer or spoof its name.
   */
  private async resolveAgencyClientCompany(companyId: number | null | undefined, user: UserEntity) {
    if (user.role === UserRole.ADMIN && !user.impersonating) {
      if (!companyId) {
        return null
      }

      const company = await this.companyRepo.findOne({
        where: { id: companyId, is_deleted: false },
      })

      if (!company) {
        throw new NotFoundException(`Company ${companyId} not found`)
      }

      return company
    }

    if (user.org_type !== OrgType.STAFFING_AGENCY) {
      if (user.role === UserRole.EMPLOYER || user.employer_company_id) {
        if (!user.employer_company_id) {
          throw new ForbiddenException("Employer company context required")
        }

        if (companyId && companyId !== user.employer_company_id) {
          throw new ForbiddenException("You can only create jobs for your own employer company")
        }

        const company = await this.companyRepo.findOne({
          where: { id: user.employer_company_id, is_deleted: false },
        })

        if (!company) {
          throw new NotFoundException(`Company ${user.employer_company_id} not found`)
        }

        return company
      }

      if (companyId) {
        throw new ForbiddenException("Employer company ownership is required")
      }

      return null
    }

    if (!user.organization_id) {
      throw new ForbiddenException("Organization context required")
    }

    if (!companyId) {
      throw new BadRequestException("An active agency client is required")
    }

    const relationship = await this.agencyClientRepo.findOne({
      where: {
        organization_id: user.organization_id,
        company_id: companyId,
        status: "active",
      },
    })

    if (!relationship) {
      throw new BadRequestException("The selected company is not an active client of this agency")
    }

    const company = await this.companyRepo.findOne({ where: { id: companyId, is_deleted: false } })

    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`)
    }

    return company
  }

  // ─── Saved Jobs ──────────────────────────────────────────────────────────
  async getSavedJobs(user: UserEntity, jobId?: string) {
    const where: any = { user_id: user.id }

    if (jobId) {
      where.job_id = jobId
    }

    return this.savedJobRepo.find({ where, order: { created_date: "DESC" } as any })
  }

  async saveJob(dto: CreateSavedJobDto, user: UserEntity): Promise<SavedJobEntity> {
    const owned = { ...dto, user_id: user.id, user_email: user.email }

    const existing = await this.savedJobRepo.findOne({
      where: { user_id: user.id, job_id: dto.job_id } as any,
    })

    if (existing) {
      return existing
    }

    const saved = this.savedJobRepo.create(owned as any)

    return this.savedJobRepo.save(saved) as unknown as Promise<SavedJobEntity>
  }

  async unsaveJob(id: number, user: UserEntity): Promise<void> {
    const saved = await this.savedJobRepo.findOne({ where: { id } })

    if (!saved) {
      throw new NotFoundException("Saved job not found")
    }

    if (saved.user_id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    await this.savedJobRepo.remove(saved)
  }

  // ─── Job Alerts ───────────────────────────────────────────────────────────
  async getAlerts(user: UserEntity) {
    return this.alertRepo.find({ where: { user_id: user.id } })
  }

  async createAlert(dto: CreateJobAlertDto, user: UserEntity): Promise<JobAlertEntity> {
    const alert = this.alertRepo.create({
      ...dto,
      user_id: user.id,
      user_email: user.email,
    } as any)

    return this.alertRepo.save(alert) as unknown as Promise<JobAlertEntity>
  }

  async updateAlert(id: number, dto: UpdateJobAlertDto, user: UserEntity): Promise<JobAlertEntity> {
    const alert = await this.alertRepo.findOne({ where: { id } as any })

    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`)
    }

    if (alert.user_id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    Object.assign(alert, dto)

    return this.alertRepo.save(alert) as unknown as Promise<JobAlertEntity>
  }

  async deleteAlert(id: number, user: UserEntity): Promise<void> {
    const alert = await this.alertRepo.findOne({ where: { id } as any })

    if (!alert) {
      throw new NotFoundException(`Alert ${id} not found`)
    }

    if (alert.user_id !== user.id) {
      throw new ForbiddenException("Access denied")
    }

    await this.alertRepo.remove(alert)
  }
}
