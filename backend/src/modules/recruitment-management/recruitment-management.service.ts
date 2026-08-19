import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, In, Repository } from "typeorm"
import { OrgType } from "../../common/enums/org-type.enum"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { AuditLogEntity } from "../audit/audit-log.entity"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { NotificationsService } from "../notifications/notifications.service"
import { UserEntity } from "../users/user.entity"
import { AssignRecruitmentWorkDto } from "./dto/recruitment-management.dto"
import { ManagementReportQueryDto } from "../reports/dto/reports.dto"
import {
  ACTIVE_APPLICATION_STATUSES,
  APPLICATION_OVERLOAD,
  APPLICATION_PIPELINE_STATUSES,
  APPLICATION_SLA_HOURS,
  JOB_OVERLOAD,
  PLACEMENT_APPLICATION_STATUSES,
} from "../../common/utils/recruitment-kpis"

@Injectable()
export class RecruitmentManagementService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(CandidateEntity) private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(JobEntity) private readonly jobs: Repository<JobEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(AgencyTeamEntity) private readonly teams: Repository<AgencyTeamEntity>,
    private readonly notifications: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  private organizationId(user: UserEntity) {
    if (user.org_type !== OrgType.STAFFING_AGENCY || !user.organization_id) {
      throw new ForbiddenException("Staffing agency organization context required")
    }

    return user.organization_id
  }

  async dashboard(user: UserEntity, sendAlerts = false, query: ManagementReportQueryDto = {}) {
    const organizationId = this.organizationId(user)

    const isTeamManager = user.role === UserRole.TEAM_MANAGER

    if (isTeamManager && !user.team_id) {
      throw new ForbiddenException("Active team membership required")
    }

    if (isTeamManager && query.team_id && query.team_id !== user.team_id) {
      throw new NotFoundException(`Team ${query.team_id} not found`)
    }

    const teamScope = isTeamManager ? { team_id: user.team_id! } : {}

    const [organizationApplications, organizationJobs, recruiters, teams] = await Promise.all([
      this.applications.find({
        where: { organization_id: organizationId, is_deleted: false, ...teamScope },
      }),
      this.jobs.find({
        where: { organization_id: organizationId, is_deleted: false, ...teamScope },
      }),
      this.users.find({
        where: {
          organization_id: organizationId,
          role: UserRole.RECRUITER,
          is_active: true,
          ...teamScope,
        },
      }),
      this.teams.find({
        where: {
          organization_id: organizationId,
          is_active: true,
          ...(isTeamManager ? { id: user.team_id! } : {}),
        },
      }),
    ])

    const from = query.date_from
      ? new Date(`${query.date_from}T00:00:00.000Z`)
      : new Date(Date.now() - 90 * 86400000)

    const to = query.date_to ? new Date(`${query.date_to}T23:59:59.999Z`) : new Date()

    if (from > to) {
      throw new BadRequestException("date_from must be before date_to")
    }

    const selectedTeam = isTeamManager
      ? (teams.find((team) => team.id === user.team_id) ?? null)
      : query.team_id
        ? teams.find((team) => team.id === query.team_id)
        : null

    if (query.team_id && !selectedTeam) {
      throw new NotFoundException(`Team ${query.team_id} not found`)
    }

    const applications = organizationApplications.filter(
      (application) =>
        new Date(application.created_date) >= from &&
        new Date(application.created_date) <= to &&
        (!query.client_id || application.employer_company_id === query.client_id) &&
        (!query.job_id || application.job_id === query.job_id) &&
        (!query.recruiter_id || application.recruiter_id === query.recruiter_id) &&
        (!selectedTeam || application.team_id === selectedTeam.id),
    )

    const jobs = organizationJobs.filter(
      (job) =>
        (!query.client_id || job.employer_company_id === query.client_id) &&
        (!query.job_id || job.id === query.job_id) &&
        (!query.recruiter_id || job.recruiter_id === query.recruiter_id) &&
        (!selectedTeam || job.team_id === selectedTeam.id),
    )

    const now = Date.now()

    const overdue = applications
      .filter(
        (application) =>
          ACTIVE_APPLICATION_STATUSES.has(application.status) &&
          APPLICATION_SLA_HOURS[application.status],
      )
      .map((application) => ({
        id: application.id,
        job_id: application.job_id,
        candidate_name: application.candidate_name,
        job_title: application.job_title,
        status: application.status,
        recruiter_id: application.recruiter_id,
        overdue_hours: Math.max(
          0,
          Math.floor((now - new Date(application.updated_date).getTime()) / 3_600_000) -
            APPLICATION_SLA_HOURS[application.status],
        ),
      }))
      .filter((application) => application.overdue_hours > 0)
      .sort((a, b) => b.overdue_hours - a.overdue_hours)

    const teamById = new Map(teams.map((team) => [team.id, team]))

    const workload = recruiters
      .map((recruiter) => {
        const activeApplications = applications.filter(
          (application) =>
            application.recruiter_id === recruiter.id &&
            ACTIVE_APPLICATION_STATUSES.has(application.status),
        ).length

        const openJobs = jobs.filter(
          (job) => job.recruiter_id === recruiter.id && !job.is_closed,
        ).length

        return {
          recruiter_id: recruiter.id,
          recruiter_name: recruiter.full_name || recruiter.email,
          team_id: recruiter.team_id,
          team_name: teamById.get(recruiter.team_id)?.name ?? null,
          active_applications: activeApplications,
          open_jobs: openJobs,
          overloaded: activeApplications >= APPLICATION_OVERLOAD || openJobs >= JOB_OVERLOAD,
        }
      })
      .sort((a, b) => b.active_applications - a.active_applications || b.open_jobs - a.open_jobs)

    const funnel = Object.fromEntries(
      APPLICATION_PIPELINE_STATUSES.map((status) => [
        status,
        applications.filter((application) => application.status === status).length,
      ]),
    )

    const placements = applications.filter((application) =>
      PLACEMENT_APPLICATION_STATUSES.has(application.status),
    )

    const dashboard = {
      summary: {
        open_jobs: jobs.filter((job) => !job.is_closed).length,
        applications: applications.length,
        active_applications: applications.filter((application) =>
          ACTIVE_APPLICATION_STATUSES.has(application.status),
        ).length,
        overdue_stages: overdue.length,
        placements: placements.length,
        overloaded_recruiters: workload.filter((item) => item.overloaded).length,
      },
      funnel,
      overdue: overdue.slice(0, 100),
      workload,
      placements: placements
        .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())
        .slice(0, 20)
        .map((application) => ({
          id: application.id,
          application_id: application.id,
          candidate_id: application.candidate_id,
          candidate_name: application.candidate_name,
          job_title: application.job_title,
          company: application.company,
          recruiter_id: application.recruiter_id,
          status: application.status,
          placed_at: application.updated_date,
        })),
      thresholds: { application_overload: APPLICATION_OVERLOAD, job_overload: JOB_OVERLOAD },
      filters: { date_from: from.toISOString(), date_to: to.toISOString(), ...query },
      dimensions: {
        recruiters: recruiters.map((recruiter) => ({
          id: recruiter.id,
          name: recruiter.full_name || recruiter.email,
        })),
        teams: teams.map((team) => ({ id: team.id, name: team.name })),
        clients: [
          ...new Map(
            organizationApplications
              .filter((application) => application.employer_company_id)
              .map((application) => [
                application.employer_company_id,
                {
                  id: application.employer_company_id,
                  name: application.company || `#${application.employer_company_id}`,
                },
              ]),
          ).values(),
        ],
        jobs: organizationJobs.map((job) => ({ id: job.id, name: job.title })),
      },
    }

    if (sendAlerts && user.email) {
      await this.sendOperationalAlerts(user, dashboard)
    }

    return dashboard
  }

  async assign(dto: AssignRecruitmentWorkDto, user: UserEntity) {
    const organizationId = this.organizationId(user)

    const isTeamManager = user.role === UserRole.TEAM_MANAGER

    if (isTeamManager && !user.team_id) {
      throw new ForbiddenException("Active team membership required")
    }

    if (isTeamManager && dto.team_id != null && dto.team_id !== user.team_id) {
      throw new NotFoundException(`Team ${dto.team_id} not found`)
    }

    const jobIds = [...new Set(dto.job_ids)]

    const candidateIds = [...new Set(dto.candidate_ids)]

    const applicationIds = [...new Set(dto.application_ids)]

    const result = await this.dataSource.transaction(async (manager) => {
      let team: AgencyTeamEntity | null = null

      let recruiter: UserEntity | null = null

      if (isTeamManager) {
        team = await manager.findOne(AgencyTeamEntity, {
          where: {
            id: user.team_id!,
            organization_id: organizationId,
            manager_id: user.id,
            is_active: true,
          },
        })

        if (!team) {
          throw new ForbiddenException("Active managed team required")
        }
      } else if (dto.team_id != null) {
        team = await manager.findOne(AgencyTeamEntity, {
          where: { id: dto.team_id, organization_id: organizationId, is_active: true },
        })

        if (!team) {
          throw new NotFoundException(`Team ${dto.team_id} not found`)
        }
      }

      if (dto.recruiter_id != null) {
        recruiter = await manager.findOne(UserEntity, {
          where: {
            id: dto.recruiter_id,
            organization_id: organizationId,
            role: UserRole.RECRUITER,
            is_active: true,
            ...(isTeamManager ? { team_id: user.team_id! } : {}),
          },
        })

        if (!recruiter) {
          throw new NotFoundException(`Recruiter ${dto.recruiter_id} not found`)
        }

        if (team && recruiter.team_id !== team.id) {
          throw new BadRequestException("Recruiter must belong to the selected team")
        }

        if (!team && recruiter.team_id) {
          team = await manager.findOne(AgencyTeamEntity, {
            where: { id: recruiter.team_id, organization_id: organizationId, is_active: true },
          })
        }
      }

      const [jobs, candidates, applications] = await Promise.all([
        jobIds.length
          ? manager.find(JobEntity, {
              where: {
                id: In(jobIds),
                organization_id: organizationId,
                is_deleted: false,
                ...(isTeamManager ? { team_id: user.team_id! } : {}),
              },
            })
          : [],
        candidateIds.length
          ? manager.find(CandidateEntity, {
              where: {
                id: In(candidateIds),
                organization_id: organizationId,
                is_deleted: false,
                ...(isTeamManager ? { team_id: user.team_id! } : {}),
              },
            })
          : [],
        applicationIds.length
          ? manager.find(ApplicationEntity, {
              where: {
                id: In(applicationIds),
                organization_id: organizationId,
                is_deleted: false,
                ...(isTeamManager ? { team_id: user.team_id! } : {}),
              },
            })
          : [],
      ])

      if (jobs.length !== jobIds.length) {
        throw new NotFoundException("One or more jobs were not found")
      }

      if (candidates.length !== candidateIds.length) {
        throw new NotFoundException("One or more candidates were not found")
      }

      if (applications.length !== applicationIds.length) {
        throw new NotFoundException("One or more applications were not found")
      }

      const target = {
        recruiter_id: recruiter?.id ?? null,
        team_id: team?.id ?? null,
        team_manager_id: team?.manager_id ?? null,
        ...(user.role === UserRole.RECRUITMENT_MANAGER ? { recruitment_manager_id: user.id } : {}),
      }

      jobs.forEach((record) => Object.assign(record, target))
      candidates.forEach((record) => Object.assign(record, target))
      applications.forEach((record) =>
        Object.assign(record, target, { assigned_to: recruiter?.id ?? null }),
      )

      await Promise.all([
        jobs.length ? manager.save(JobEntity, jobs) : Promise.resolve([]),
        candidates.length ? manager.save(CandidateEntity, candidates) : Promise.resolve([]),
        applications.length ? manager.save(ApplicationEntity, applications) : Promise.resolve([]),
      ])

      if (applications.length) {
        await manager.save(
          ApplicationTimelineEntity,
          applications.map((application) =>
            manager.create(ApplicationTimelineEntity, {
              application_id: application.id,
              organization_id: organizationId,
              event_type: "assigned",
              description: `Assigned to ${recruiter?.full_name || recruiter?.email || "team queue"}: ${dto.reason}`,
              performed_by: user.email,
              performed_by_role: user.role,
            }),
          ),
        )
      }

      await manager.save(
        AuditLogEntity,
        manager.create(AuditLogEntity, {
          organization_id: String(organizationId),
          actor_user_id: String(user.id),
          actor_email: user.email,
          actor_role: user.role,
          entity_type: isTeamManager ? "AgencyTeam" : "Organization",
          entity_id: isTeamManager ? (team?.id ?? user.team_id ?? 0) : organizationId,
          entity_label: isTeamManager ? "Team work assignment" : "Recruitment work assignment",
          action: "update",
          metadata: {
            operation: "bulk_reassign",
            reason: dto.reason,
            job_ids: jobIds,
            candidate_ids: candidateIds,
            application_ids: applicationIds,
            team_id: team?.id ?? null,
            recruiter_id: recruiter?.id ?? null,
          },
        }),
      )

      return {
        jobs: jobs.length,
        candidates: candidates.length,
        applications: applications.length,
        team_id: team?.id ?? null,
        team_manager_id: team?.manager_id ?? null,
        recruiter_id: recruiter?.id ?? null,
        reason: dto.reason,
      }
    })

    if (result.recruiter_id) {
      const recruiter = await this.users.findOne({
        where: { id: result.recruiter_id, organization_id: organizationId },
      })

      if (recruiter?.email) {
        await this.notifications
          .create({
            organization_id: organizationId,
            recipient_email: recruiter.email,
            type: "message",
            title: "Recruitment work assigned",
            content: `${result.jobs} jobs, ${result.candidates} candidates and ${result.applications} applications were assigned to you. Reason: ${dto.reason}`,
            metadata: { assignment: result },
          } as any)
          .catch(() => undefined)
      }
    }

    return result
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshOperationalAlerts() {
    const managers = await this.users.find({
      where: {
        role: UserRole.RECRUITMENT_MANAGER,
        org_type: OrgType.STAFFING_AGENCY,
        is_active: true,
      },
    })

    for (const manager of managers) {
      await this.dashboard(manager, true).catch(() => undefined)
    }
  }

  private async sendOperationalAlerts(
    user: UserEntity,
    dashboard: Awaited<ReturnType<RecruitmentManagementService["dashboard"]>>,
  ) {
    if (dashboard.summary.overdue_stages > 0) {
      await this.notifications.createUnreadOnce({
        organization_id: user.organization_id,
        recipient_email: user.email,
        type: "message",
        title: "Pipeline SLA alert",
        content: `${dashboard.summary.overdue_stages} application stages are overdue.`,
        metadata: { alert_type: "sla_overdue", count: dashboard.summary.overdue_stages },
      } as any)
    }

    if (dashboard.summary.overloaded_recruiters > 0) {
      await this.notifications.createUnreadOnce({
        organization_id: user.organization_id,
        recipient_email: user.email,
        type: "message",
        title: "Recruiter workload alert",
        content: `${dashboard.summary.overloaded_recruiters} recruiters are above the workload threshold.`,
        metadata: {
          alert_type: "workload_overload",
          count: dashboard.summary.overloaded_recruiters,
        },
      } as any)
    }
  }
}
