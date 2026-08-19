import { BadRequestException, NotFoundException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { ApplicationEntity } from "../applications/entities/application.entity"
import { AgencyTeamEntity } from "../agency-teams/agency-team.entity"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { UserEntity } from "../users/user.entity"
import { RecruitmentManagementService } from "./recruitment-management.service"

const actor = {
  id: 9,
  email: "manager@agency.test",
  role: UserRole.RECRUITMENT_MANAGER,
  organization_id: 12,
  org_type: "staffing_agency",
} as any

describe("RecruitmentManagementService RM-2", () => {
  it("builds funnel, SLA, workload and placement metrics", async () => {
    const old = new Date(Date.now() - 72 * 3_600_000)

    const applications = {
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          status: "new",
          recruiter_id: 31,
          created_date: old,
          updated_date: old,
          candidate_name: "Overdue",
          job_title: "Engineer",
        },
        {
          id: 2,
          status: "completed",
          recruiter_id: 31,
          created_date: new Date(),
          updated_date: new Date(),
          candidate_name: "Placed",
          job_title: "QA",
        },
      ]),
    }

    const jobs = {
      find: jest.fn().mockResolvedValue([{ id: 8, recruiter_id: 31, is_closed: false }]),
    }

    const users = {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: 31, email: "r@test", full_name: "Recruiter", team_id: 4, team_manager_id: 41 },
        ]),
    }

    const teams = { find: jest.fn().mockResolvedValue([{ id: 4, manager_id: 41, name: "Alpha" }]) }

    const notifications = { createUnreadOnce: jest.fn().mockResolvedValue({}) }

    const service = new RecruitmentManagementService(
      applications as any,
      {} as any,
      jobs as any,
      users as any,
      teams as any,
      notifications as any,
      {} as any,
    )

    const result = await service.dashboard(actor, true)

    expect(result.summary).toEqual(
      expect.objectContaining({ open_jobs: 1, overdue_stages: 1, placements: 1 }),
    )
    expect(result.funnel).toEqual(expect.objectContaining({ new: 1, completed: 1 }))
    expect(result.workload[0]).toEqual(
      expect.objectContaining({ recruiter_id: 31, active_applications: 1, team_name: "Alpha" }),
    )
    expect(notifications.createUnreadOnce).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Pipeline SLA alert" }),
    )
  })

  it("assigns jobs, candidates and applications in one transaction with reason", async () => {
    const records = {
      jobs: [{ id: 1, organization_id: 12 }],
      candidates: [{ id: 2, organization_id: 12 }],
      applications: [{ id: 3, organization_id: 12 }],
    }

    const manager = {
      findOne: jest.fn(async (entity) => {
        if (entity === AgencyTeamEntity) {
          return { id: 4, organization_id: 12, manager_id: 41, is_active: true }
        }

        if (entity === UserEntity) {
          return {
            id: 31,
            organization_id: 12,
            role: UserRole.RECRUITER,
            team_id: 4,
            email: "r@test",
            full_name: "Recruiter",
          }
        }

        return null
      }),
      find: jest.fn(async (entity) =>
        entity === JobEntity
          ? records.jobs
          : entity === CandidateEntity
            ? records.candidates
            : entity === ApplicationEntity
              ? records.applications
              : [],
      ),
      save: jest.fn(async (_entity, value) => value),
      create: jest.fn((_entity, value) => value),
    }

    const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) }

    const users = { findOne: jest.fn().mockResolvedValue({ id: 31, email: "r@test" }) }

    const notifications = { create: jest.fn().mockResolvedValue({}) }

    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      users as any,
      {} as any,
      notifications as any,
      dataSource as any,
    )

    const result = await service.assign(
      {
        job_ids: [1],
        candidate_ids: [2],
        application_ids: [3],
        team_id: 4,
        recruiter_id: 31,
        reason: "Balance workload",
      } as any,
      actor,
    )

    expect(result).toEqual(
      expect.objectContaining({ jobs: 1, candidates: 1, applications: 1, recruiter_id: 31 }),
    )
    expect(records.applications[0]).toEqual(
      expect.objectContaining({ recruiter_id: 31, team_manager_id: 41, assigned_to: 31 }),
    )
    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    expect(manager.save).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining([
        expect.objectContaining({
          event_type: "assigned",
          description: expect.stringContaining("Balance workload"),
        }),
      ]),
    )
  })

  it("rejects a cross-tenant or missing record before writing assignments", async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      create: jest.fn((_entity, value) => value),
    }

    const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) }

    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource as any,
    )

    await expect(
      service.assign(
        {
          job_ids: [999],
          candidate_ids: [],
          application_ids: [],
          team_id: null,
          recruiter_id: null,
          reason: "Return to queue",
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(manager.save).not.toHaveBeenCalled()
  })

  it("reassigns work between teams and recruiters with both audit reasons", async () => {
    const application = { id: 3, organization_id: 12 }

    const teams = [
      { id: 4, organization_id: 12, manager_id: 41, is_active: true },
      { id: 5, organization_id: 12, manager_id: 42, is_active: true },
    ]

    const recruiters = [
      {
        id: 31,
        organization_id: 12,
        role: UserRole.RECRUITER,
        team_id: 4,
        is_active: true,
        email: "a@test",
      },
      {
        id: 32,
        organization_id: 12,
        role: UserRole.RECRUITER,
        team_id: 5,
        is_active: true,
        email: "b@test",
      },
    ]

    const savedValues: any[] = []

    const manager = {
      findOne: jest.fn(async (entity, options) => {
        if (entity === AgencyTeamEntity) {
          return teams.find((team) => team.id === options.where.id) || null
        }

        if (entity === UserEntity) {
          return recruiters.find((recruiter) => recruiter.id === options.where.id) || null
        }

        return null
      }),
      find: jest.fn(async (entity) => (entity === ApplicationEntity ? [application] : [])),
      save: jest.fn(async (_entity, value) => {
        savedValues.push(value)

        return value
      }),
      create: jest.fn((_entity, value) => value),
    }

    const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) }

    const users = {
      findOne: jest.fn(async ({ where }) => recruiters.find((item) => item.id === where.id)),
    }

    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      users as any,
      {} as any,
      { create: jest.fn().mockResolvedValue({}) } as any,
      dataSource as any,
    )

    await service.assign(
      {
        job_ids: [],
        candidate_ids: [],
        application_ids: [3],
        team_id: 4,
        recruiter_id: 31,
        reason: "Initial allocation",
      } as any,
      actor,
    )
    expect(application).toEqual(
      expect.objectContaining({ recruiter_id: 31, team_manager_id: 41, assigned_to: 31 }),
    )

    await service.assign(
      {
        job_ids: [],
        candidate_ids: [],
        application_ids: [3],
        team_id: 5,
        recruiter_id: 32,
        reason: "Capacity balancing",
      } as any,
      actor,
    )
    expect(application).toEqual(
      expect.objectContaining({ recruiter_id: 32, team_manager_id: 42, assigned_to: 32 }),
    )
    expect(savedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: "Initial allocation",
            team_id: 4,
            recruiter_id: 31,
          }),
        }),
        expect.objectContaining({
          metadata: expect.objectContaining({
            reason: "Capacity balancing",
            team_id: 5,
            recruiter_id: 32,
          }),
        }),
      ]),
    )
    expect(dataSource.transaction).toHaveBeenCalledTimes(2)
  })

  it("rejects a recruiter who is not a member of the selected team", async () => {
    const manager = {
      findOne: jest.fn(async (entity) => {
        if (entity === AgencyTeamEntity) {
          return { id: 4, organization_id: 12, manager_id: 41, is_active: true }
        }

        if (entity === UserEntity) {
          return {
            id: 32,
            organization_id: 12,
            role: UserRole.RECRUITER,
            team_id: 5,
            is_active: true,
          }
        }

        return null
      }),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((_entity, value) => value),
    }

    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { transaction: jest.fn(async (callback) => callback(manager)) } as any,
    )

    await expect(
      service.assign(
        {
          job_ids: [],
          candidate_ids: [],
          application_ids: [3],
          team_id: 4,
          recruiter_id: 32,
          reason: "Invalid cross-team move",
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(manager.find).not.toHaveBeenCalled()
    expect(manager.save).not.toHaveBeenCalled()
  })

  it("scopes Team Manager dashboard queries to canonical team_id", async () => {
    const applications = { find: jest.fn().mockResolvedValue([]) }

    const jobs = { find: jest.fn().mockResolvedValue([]) }

    const users = { find: jest.fn().mockResolvedValue([]) }

    const teams = { find: jest.fn().mockResolvedValue([{ id: 4, name: "Alpha", manager_id: 41 }]) }

    const teamManager = {
      id: 41,
      email: "tm@agency.test",
      role: UserRole.TEAM_MANAGER,
      organization_id: 12,
      org_type: "staffing_agency",
      team_id: 4,
    } as any

    const service = new RecruitmentManagementService(
      applications as any,
      {} as any,
      jobs as any,
      users as any,
      teams as any,
      { createUnreadOnce: jest.fn() } as any,
      {} as any,
    )

    await service.dashboard(teamManager)

    expect(applications.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, team_id: 4 }),
      }),
    )
    expect(jobs.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, team_id: 4 }),
      }),
    )
    expect(users.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 12,
          role: UserRole.RECRUITER,
          team_id: 4,
        }),
      }),
    )
    expect(teams.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organization_id: 12, id: 4 }),
      }),
    )
  })

  it("rejects a Team Manager dashboard query for another team", async () => {
    const service = new RecruitmentManagementService(
      { find: jest.fn() } as any,
      {} as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      {} as any,
      {} as any,
    )

    await expect(
      service.dashboard(
        {
          id: 41,
          role: UserRole.TEAM_MANAGER,
          organization_id: 12,
          org_type: "staffing_agency",
          team_id: 4,
        } as any,
        false,
        { team_id: 5 },
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("rejects a Team Manager assignment that targets another team", async () => {
    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { transaction: jest.fn() } as any,
    )

    await expect(
      service.assign(
        {
          job_ids: [],
          candidate_ids: [],
          application_ids: [3],
          team_id: 5,
          recruiter_id: 31,
          reason: "Cross-team assign",
        } as any,
        {
          id: 41,
          role: UserRole.TEAM_MANAGER,
          organization_id: 12,
          org_type: "staffing_agency",
          team_id: 4,
        } as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("rejects a Team Manager assignment of a recruiter from another team", async () => {
    const manager = {
      findOne: jest.fn(async (entity, options) => {
        if (entity === AgencyTeamEntity) {
          return { id: 4, organization_id: 12, manager_id: 41, is_active: true }
        }

        if (entity === UserEntity) {
          if (options?.where?.team_id && options.where.team_id !== 5) {
            return null
          }

          return {
            id: 32,
            organization_id: 12,
            role: UserRole.RECRUITER,
            team_id: 5,
            is_active: true,
          }
        }

        return null
      }),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((_entity, value) => value),
    }

    const service = new RecruitmentManagementService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { transaction: jest.fn(async (callback) => callback(manager)) } as any,
    )

    await expect(
      service.assign(
        {
          job_ids: [],
          candidate_ids: [],
          application_ids: [3],
          team_id: 4,
          recruiter_id: 32,
          reason: "Foreign recruiter",
        } as any,
        {
          id: 41,
          role: UserRole.TEAM_MANAGER,
          organization_id: 12,
          org_type: "staffing_agency",
          team_id: 4,
        } as any,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(manager.find).not.toHaveBeenCalled()
    expect(manager.save).not.toHaveBeenCalled()
  })
})
