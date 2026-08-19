import { ForbiddenException, NotFoundException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { CommunicationService } from "../communication/communication.service"
import { ImportService } from "../functions/services/import.service"
import { InterviewsService } from "../interviews/interviews.service"

const teamManager = {
  id: 41,
  email: "lead@test",
  role: UserRole.TEAM_MANAGER,
  organization_id: 12,
  org_type: "staffing_agency",
  team_id: 4,
}

describe("TM-1 nested team boundary", () => {
  it("hides an import batch owned by another team", async () => {
    const service = new ImportService(
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 9,
          organization_id: 12,
          team_id: 5,
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await expect(
      service.validateImportBatch({ import_batch_id: 9 } as any, teamManager as any),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("does not return organization-wide communication logs without a scoped candidate", async () => {
    const logs = { findAndCount: jest.fn() }

    const service = new CommunicationService(
      logs as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    const result = await service.findAll(
      { page: 1, limit: 20, sort: "created_date", order: "DESC" } as any,
      teamManager as any,
    )

    expect(result.data).toEqual([])
    expect(logs.findAndCount).not.toHaveBeenCalled()
  })

  it("requires a scoped application before a Team Manager creates an interview", async () => {
    const service = new InterviewsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    )

    await expect(
      service.create({ candidate_id: 8 } as any, teamManager as any),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
