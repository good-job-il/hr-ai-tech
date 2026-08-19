import { BillingService } from "./billing.service"
import { OrgPlan } from "../organizations/organization.entity"
import { UserRole } from "../../common/enums/user-role.enum"

describe("BillingService OA-3", () => {
  it("returns persisted plan, real usage and an honest unconfigured payment state", async () => {
    const organizations = { findOne: jest.fn().mockResolvedValue({ id: 14, plan: OrgPlan.PRO }) }
    const accounts = { findOne: jest.fn().mockResolvedValue(null) }
    const invoices = { find: jest.fn().mockResolvedValue([]) }
    const jobs = { count: jest.fn().mockResolvedValue(4) }
    const candidates = { count: jest.fn().mockResolvedValue(250) }
    const users = { count: jest.fn().mockResolvedValue(9) }
    const service = new BillingService(
      organizations as any,
      accounts as any,
      invoices as any,
      jobs as any,
      candidates as any,
      users as any,
    )

    const result = await service.overview({ organization_id: 14, role: UserRole.ORG_ADMIN } as any)

    expect(result.plan).toBe("pro")
    expect(result.usage).toEqual({ active_jobs: 4, candidates: 250, seats: 9 })
    expect(result.subscription.payment_status).toBe("not_configured")
    expect(result.capabilities.plan_changes).toBe(false)
  })

  it("exposes synchronized invoices without claiming unsupported plan management", async () => {
    const organizations = {
      findOne: jest.fn().mockResolvedValue({ id: 14, plan: OrgPlan.ENTERPRISE }),
    }
    const accounts = {
      findOne: jest.fn().mockResolvedValue({
        provider: "stripe",
        subscription_status: "active",
        payment_status: "paid",
        current_period_end: new Date("2027-01-01"),
        cancel_at_period_end: false,
      }),
    }
    const invoices = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 3, invoice_pdf_url: "https://billing.test/invoice.pdf" }]),
    }
    const counter = { count: jest.fn().mockResolvedValue(1) }
    const service = new BillingService(
      organizations as any,
      accounts as any,
      invoices as any,
      counter as any,
      counter as any,
      counter as any,
    )

    const result = await service.overview({ organization_id: 14, role: UserRole.ORG_ADMIN } as any)

    expect(result.subscription).toEqual(
      expect.objectContaining({ provider: "stripe", payment_status: "paid" }),
    )
    expect(result.capabilities).toEqual({
      plan_changes: false,
      payment_method_management: false,
      invoice_download: true,
    })
  })

  it("limits a recruitment manager to billing status without invoice access", async () => {
    const organizations = { findOne: jest.fn().mockResolvedValue({ id: 14, plan: OrgPlan.PRO }) }
    const accounts = {
      findOne: jest.fn().mockResolvedValue({
        provider: "stripe",
        subscription_status: "active",
        payment_status: "paid",
        current_period_end: null,
        cancel_at_period_end: false,
      }),
    }
    const invoices = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 3, invoice_pdf_url: "https://billing.test/invoice.pdf" }]),
    }
    const counter = { count: jest.fn().mockResolvedValue(1) }
    const service = new BillingService(
      organizations as any,
      accounts as any,
      invoices as any,
      counter as any,
      counter as any,
      counter as any,
    )

    const result = await service.overview({
      organization_id: 14,
      role: UserRole.RECRUITMENT_MANAGER,
    } as any)

    expect(result.subscription).toEqual(
      expect.objectContaining({ status: "active", payment_status: "paid" }),
    )
    expect(result.invoices).toEqual([])
    expect(result.capabilities.invoice_download).toBe(false)
  })
})
