import { AuditService } from "./audit.service"

describe("AuditService OA-3 filters", () => {
  it("applies actor and date filters together with tenant scope", async () => {
    const repo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) }
    const service = new AuditService(repo as any)
    await service.findAll(
      {
        page: 1,
        limit: 20,
        sort: "created_date",
        order: "DESC",
        actor_email: "owner",
        date_from: new Date("2026-01-01"),
        date_to: new Date("2026-01-31"),
      } as any,
      { role: "org_admin", organization_id: 31 } as any,
    )
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organization_id: 31,
          actor_email: expect.anything(),
          created_date: expect.anything(),
        }),
      }),
    )
  })

  it("audits a server-side operational activity export", async () => {
    const repo = {
      findAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      create: jest.fn((value) => value),
      save: jest.fn((value) => Promise.resolve(value)),
    }
    const service = new AuditService(repo as any)

    const result = await service.export(
      { page: 1, limit: 20, sort: "created_date", order: "DESC", action: "update" } as any,
      { id: 7, email: "manager@test", role: "recruitment_manager", organization_id: 31 } as any,
    )

    expect(result.data).toHaveLength(1)
    expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ take: 500 }))
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export",
        organization_id: "31",
        metadata: expect.objectContaining({ exported_records: 1 }),
      }),
    )
  })
})
