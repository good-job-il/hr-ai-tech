import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Between, In, Repository } from "typeorm"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"
import { CompensationPlanEntity } from "../compensation/compensation-plan.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { UserEntity } from "../users/user.entity"
import { ManagementReportQueryDto } from "./dto/reports.dto"
import {
  APPLICATION_PIPELINE_STATUSES,
  PLACEMENT_APPLICATION_STATUSES,
} from "../../common/utils/recruitment-kpis"
import { PermissionsService } from "../permissions/permissions.service"

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
    @InjectRepository(ApplicationTimelineEntity)
    private readonly timelines: Repository<ApplicationTimelineEntity>,
    @InjectRepository(CompensationPlanEntity)
    private readonly compensation: Repository<CompensationPlanEntity>,
    @InjectRepository(AgencyTeamEntity) private readonly teams: Repository<AgencyTeamEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly permissions: PermissionsService,
  ) {}

  async getScopedApplications(query: ManagementReportQueryDto, user: UserEntity) {
    if (!user.organization_id) {
      throw new ForbiddenException("Organization context required")
    }

    const organizationId = user.organization_id

    const from = query.date_from
      ? new Date(`${query.date_from}T00:00:00.000Z`)
      : new Date(Date.now() - 90 * 86400000)

    const to = query.date_to ? new Date(`${query.date_to}T23:59:59.999Z`) : new Date()

    if (from > to) {
      throw new BadRequestException("date_from must be before date_to")
    }

    let teamManagerId: number | undefined

    if (user.role === UserRole.TEAM_MANAGER) {
      teamManagerId = user.id
    } else if (query.team_id) {
      const team = await this.teams.findOne({
        where: { id: query.team_id, organization_id: organizationId, is_active: true },
      })

      if (!team) {
        throw new NotFoundException(`Team ${query.team_id} not found`)
      }

      teamManagerId = team.manager_id ?? undefined

      if (!teamManagerId) {
        return { applications: [], from, to }
      }
    }

    const where: Record<string, any> = {
      organization_id: organizationId,
      is_deleted: false,
      created_date: Between(from, to),
    }

    if (query.client_id) {
      where.employer_company_id = query.client_id
    }

    if (query.job_id) {
      where.job_id = query.job_id
    }

    if (query.recruiter_id) {
      where.recruiter_id = query.recruiter_id
    }

    if (teamManagerId) {
      where.team_manager_id = teamManagerId
    }

    const applications = await this.applications.find({ where, order: { created_date: "ASC" } })

    return { applications, from, to }
  }

  async getManagementReport(query: ManagementReportQueryDto, user: UserEntity) {
    if (!user.organization_id) {
      throw new ForbiddenException("Organization context required")
    }

    const organizationId = user.organization_id

    const { applications: apps, from, to } = await this.getScopedApplications(query, user)

    const effective = await this.permissions.getEffectivePermissions(user)

    const canViewCompensation = effective.permissions.view_compensation

    const appIds = apps.map((item) => item.id)

    const [events, members, teams, plans] = await Promise.all([
      appIds.length
        ? this.timelines.find({
            where: { application_id: In(appIds) },
            order: { created_date: "ASC" },
          })
        : [],
      this.users.find({ where: { organization_id: organizationId } }),
      this.teams.find({ where: { organization_id: organizationId, is_active: true } }),
      canViewCompensation
        ? this.compensation.find({ where: { organization_id: organizationId } })
        : [],
    ])

    const userNames = new Map(
      members.map((member) => [member.id, member.full_name || member.email]),
    )

    const teamNames = new Map(teams.map((team) => [team.manager_id, team.name]))

    const funnel = APPLICATION_PIPELINE_STATUSES.map((status) => ({
      status,
      count: apps.filter((app) => app.status === status).length,
    }))

    const placements = apps.filter((app) => PLACEMENT_APPLICATION_STATUSES.has(app.status))

    const transitionEvents = events.filter((event) => event.event_type === "status_changed")

    const hiredAt = new Map<number, Date>()

    transitionEvents
      .filter((event) => event.new_value === "hired")
      .forEach((event) => {
        if (!hiredAt.has(event.application_id)) {
          hiredAt.set(event.application_id, event.created_date)
        }
      })

    const hireDurations = placements.map((app) => {
      const completedAt = hiredAt.get(app.id) || app.updated_date

      return Math.max(0, completedAt.getTime() - app.created_date.getTime()) / 86400000
    })

    const source = this.group(
      apps,
      (app) => app.source || "unknown",
      (value) => ({
        source: value,
        applications: 0,
        placements: 0,
        conversion_rate: 0,
      }),
    )

    source.forEach((row) => {
      const scoped = apps.filter((app) => (app.source || "unknown") === row.source)

      row.applications = scoped.length
      row.placements = scoped.filter((app) => PLACEMENT_APPLICATION_STATUSES.has(app.status)).length
      row.conversion_rate = this.rate(row.placements, row.applications)
    })

    const recruiter = this.performance(
      apps,
      (app) => app.recruiter_id,
      (id) => userNames.get(id) || `#${id}`,
      "recruiter_id",
      "recruiter_name",
    )

    const team = this.performance(
      apps,
      (app) => app.team_manager_id,
      (id) => teamNames.get(id) || userNames.get(id) || `#${id}`,
      "team_manager_id",
      "team_name",
    )

    const clients = this.performance(
      apps,
      (app) => app.employer_company_id,
      (id) => apps.find((app) => app.employer_company_id === id)?.company || `#${id}`,
      "client_id",
      "client_name",
    )

    const jobs = this.performance(
      apps,
      (app) => app.job_id,
      (id) => apps.find((app) => app.job_id === id)?.job_title || `#${id}`,
      "job_id",
      "job_title",
    )

    const stageDurations = new Map<string, number[]>()

    for (const app of apps) {
      const appEvents = transitionEvents.filter((event) => event.application_id === app.id)

      let enteredAt = app.created_date

      let stage = "new"

      for (const event of appEvents) {
        const duration = Math.max(0, event.created_date.getTime() - enteredAt.getTime()) / 86400000

        stageDurations.set(stage, [...(stageDurations.get(stage) || []), duration])
        stage = event.new_value || stage
        enteredAt = event.created_date
      }

      if (!["completed", "rejected"].includes(stage)) {
        const duration =
          Math.max(0, Math.min(Date.now(), to.getTime()) - enteredAt.getTime()) / 86400000

        stageDurations.set(stage, [...(stageDurations.get(stage) || []), duration])
      }
    }

    let placementRevenue = 0

    let allocatedCompensation = 0

    placements.forEach((app) => {
      const plan =
        plans.find((item) => item.job_id === app.job_id) ||
        plans.find((item) => !item.job_id && item.employer_company_id === app.employer_company_id)

      if (!plan) {
        return
      }

      const fee = Number(plan.total_fee || 0)

      placementRevenue += fee
      allocatedCompensation += this.amount(
        plan.recruiter_compensation,
        plan.recruiter_compensation_type,
        fee,
      )
      allocatedCompensation += this.amount(
        plan.team_manager_compensation,
        plan.team_manager_compensation_type,
        fee,
      )
      allocatedCompensation += this.amount(
        plan.recruitment_manager_compensation,
        plan.recruitment_manager_compensation_type,
        fee,
      )
    })

    return {
      generated_at: new Date().toISOString(),
      filters: { date_from: from.toISOString(), date_to: to.toISOString(), ...query },
      summary: {
        applications: apps.length,
        placements: placements.length,
        placement_rate: this.rate(placements.length, apps.length),
        average_time_to_hire_days: this.average(hireDurations),
        placement_revenue: canViewCompensation ? Math.round(placementRevenue * 100) / 100 : null,
        allocated_compensation: canViewCompensation
          ? Math.round(allocatedCompensation * 100) / 100
          : null,
      },
      funnel,
      time_in_stage: APPLICATION_PIPELINE_STATUSES.map((status) => ({
        status,
        average_days: this.average(stageDurations.get(status) || []),
      })),
      source_effectiveness: source.sort((a, b) => b.applications - a.applications),
      recruiter_performance: recruiter,
      team_performance: team,
      client_conversion: clients,
      job_conversion: jobs,
      dimensions: {
        recruiters: members
          .filter((member) => member.role === UserRole.RECRUITER)
          .map((member) => ({ id: member.id, name: userNames.get(member.id) })),
        teams: teams.map((item) => ({ id: item.id, name: item.name })),
        clients: clients.map((item) => ({ id: item.client_id, name: item.client_name })),
        jobs: jobs.map((item) => ({ id: item.job_id, name: item.job_title })),
      },
    }
  }

  private group<T, K extends string | number>(
    items: T[],
    key: (item: T) => K | null,
    factory: (value: K) => any,
  ) {
    const values = [...new Set(items.map(key).filter((value): value is K => value != null))]

    return values.map(factory)
  }

  private performance(
    apps: ApplicationEntity[],
    key: (app: ApplicationEntity) => number | null,
    name: (id: number) => string,
    idKey: string,
    nameKey: string,
  ) {
    return this.group(apps, key, (id) => {
      const scoped = apps.filter((app) => key(app) === id)

      const placements = scoped.filter((app) =>
        PLACEMENT_APPLICATION_STATUSES.has(app.status),
      ).length

      return {
        [idKey]: id,
        [nameKey]: name(id),
        applications: scoped.length,
        placements,
        conversion_rate: this.rate(placements, scoped.length),
      }
    }).sort((a, b) => b.placements - a.placements || b.applications - a.applications)
  }

  private amount(value: number | null, type: string, fee: number) {
    const numeric = Number(value || 0)

    return type === "percent" ? (fee * numeric) / 100 : numeric
  }

  private rate(numerator: number, denominator: number) {
    return denominator ? Math.round((numerator / denominator) * 1000) / 10 : 0
  }

  private average(values: number[]) {
    return values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
      : 0
  }
}
