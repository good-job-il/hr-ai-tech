import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { OrganizationEntity, OrgPlan } from "../organizations/organization.entity"
import { UserEntity } from "../users/user.entity"
import { JobEntity } from "../jobs/entities/job.entity"
import { CandidateEntity } from "../candidates/entities/candidate.entity"
import { BillingAccountEntity, BillingInvoiceEntity } from "./billing.entities"
import { UserRole } from "../../common/enums/user-role.enum"

const PLAN_LIMITS: Record<
  OrgPlan,
  {
    active_jobs: number | null
    candidates: number | null
    seats: number | null
    ai_matching: boolean
  }
> = {
  [OrgPlan.TRIAL]: { active_jobs: 3, candidates: 100, seats: 3, ai_matching: false },
  [OrgPlan.STARTER]: { active_jobs: 10, candidates: 2_000, seats: 10, ai_matching: true },
  [OrgPlan.PRO]: { active_jobs: 50, candidates: 20_000, seats: 50, ai_matching: true },
  [OrgPlan.ENTERPRISE]: { active_jobs: null, candidates: null, seats: null, ai_matching: true },
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizations: Repository<OrganizationEntity>,
    @InjectRepository(BillingAccountEntity)
    private readonly accounts: Repository<BillingAccountEntity>,
    @InjectRepository(BillingInvoiceEntity)
    private readonly invoices: Repository<BillingInvoiceEntity>,
    @InjectRepository(JobEntity) private readonly jobs: Repository<JobEntity>,
    @InjectRepository(CandidateEntity) private readonly candidates: Repository<CandidateEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async overview(user: UserEntity) {
    if (!user.organization_id) throw new ForbiddenException("Organization context required")
    const organization = await this.organizations.findOne({ where: { id: user.organization_id } })
    if (!organization) throw new NotFoundException("Organization not found")
    const [account, invoices, activeJobs, candidates, seats] = await Promise.all([
      this.accounts.findOne({ where: { organization_id: organization.id } }),
      this.invoices.find({
        where: { organization_id: organization.id },
        order: { issued_at: "DESC" },
        take: 50,
      }),
      this.jobs.count({
        where: { organization_id: organization.id, state: "open", is_deleted: false },
      }),
      this.candidates.count({ where: { organization_id: organization.id, is_deleted: false } }),
      this.users.count({ where: { organization_id: organization.id, is_active: true } }),
    ])
    const canViewInvoices = [UserRole.ADMIN, UserRole.ORG_ADMIN].includes(user.role)
    const visibleInvoices = canViewInvoices ? invoices : []
    return {
      plan: organization.plan,
      limits: PLAN_LIMITS[organization.plan],
      usage: { active_jobs: activeJobs, candidates, seats },
      subscription: account
        ? {
            provider: account.provider,
            status: account.subscription_status,
            payment_status: account.payment_status,
            current_period_end: account.current_period_end,
            cancel_at_period_end: account.cancel_at_period_end,
          }
        : {
            provider: null,
            status: "not_configured",
            payment_status: "not_configured",
            current_period_end: null,
            cancel_at_period_end: false,
          },
      invoices: visibleInvoices,
      capabilities: {
        plan_changes: false,
        payment_method_management: false,
        invoice_download: visibleInvoices.some((invoice) =>
          Boolean(invoice.invoice_pdf_url || invoice.hosted_invoice_url),
        ),
      },
    }
  }
}
