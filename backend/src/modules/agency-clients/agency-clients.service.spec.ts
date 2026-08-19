import { ForbiddenException } from "@nestjs/common"
import { UserRole } from "../../common/enums/user-role.enum"
import { AgencyClientsService } from "./agency-clients.service"

describe("AgencyClientsService RM-1 assignments", () => {
  it("rejects an account manager outside the tenant or allowed manager roles", async () => {
    const clients = { create: jest.fn(), save: jest.fn() }

    const users = { findOne: jest.fn().mockResolvedValue(null) }

    const dataSource = { transaction: jest.fn() }

    const service = new AgencyClientsService(
      clients as any,
      {} as any,
      {} as any,
      {} as any,
      users as any,
      dataSource as any,
    )

    await expect(
      service.create(
        {
          name: "Client",
          account_manager_id: 999,
        } as any,
        {
          id: 6,
          role: UserRole.RECRUITMENT_MANAGER,
          organization_id: 22,
          org_type: "staffing_agency",
        } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(dataSource.transaction).not.toHaveBeenCalled()
  })
})
