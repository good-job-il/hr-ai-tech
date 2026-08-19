import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, Like } from "typeorm"
import { CompanyEntity, CompanyReviewEntity, StaffEntity } from "./company.entity"
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  QueryCompaniesDto,
  CreateCompanyReviewDto,
  CreateStaffDto,
  UpdateStaffDto,
} from "./dto/companies.dto"
import { UserEntity } from "../users/user.entity"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { UserRole } from "../../common/enums/user-role.enum"
import { OrgType } from "../../common/enums/org-type.enum"

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyReviewEntity)
    private readonly reviewRepo: Repository<CompanyReviewEntity>,
    @InjectRepository(StaffEntity) private readonly staffRepo: Repository<StaffEntity>,
  ) {}

  async findAll(query: QueryCompaniesDto) {
    const { page, limit, sort, order, search, industry, is_deleted } = query
    const where: Record<string, any> = { is_deleted: is_deleted ?? false }
    if (industry) where.industry = industry
    const { skip, take } = getSkipTake(page, limit)
    let findWhere: any = where
    if (search) {
      findWhere = [
        { ...where, name: Like(`%${search}%`) },
        { ...where, industry: Like(`%${search}%`) },
      ]
    }
    const [data, total] = await this.companyRepo.findAndCount({
      where: findWhere,
      order: { [sort]: order },
      skip,
      take,
    })
    return buildPaginatedResponse(data, total, { page, limit })
  }

  async findById(id: number): Promise<CompanyEntity> {
    const c = await this.companyRepo.findOne({ where: { id } as any })
    if (!c) throw new NotFoundException(`Company ${id} not found`)
    return c
  }

  async create(dto: CreateCompanyDto): Promise<CompanyEntity> {
    const c = this.companyRepo.create(dto as any)
    return this.companyRepo.save(c) as unknown as Promise<CompanyEntity>
  }

  async update(id: number, dto: UpdateCompanyDto, user: UserEntity): Promise<CompanyEntity> {
    this.assertCanManageCompany(id, user)
    const c = await this.findById(id)
    Object.assign(c, dto)
    if (dto.is_deleted && !c.deleted_at) {
      c.deleted_at = new Date()
      c.deleted_by = user.id
    }
    return this.companyRepo.save(c) as unknown as Promise<CompanyEntity>
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user)
  }

  private assertCanManageCompany(id: number, user: UserEntity) {
    if (user.role === UserRole.ADMIN && !user.impersonating) return
    if (user.org_type === OrgType.STAFFING_AGENCY) {
      throw new ForbiddenException("Agency clients must be managed through the agency client API")
    }
    if (user.employer_company_id !== id) {
      throw new ForbiddenException("You can only manage your own employer company")
    }
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  async getReviews(companyId: number) {
    return this.reviewRepo.find({
      where: { company_id: companyId } as any,
      order: { created_date: "DESC" } as any,
    })
  }

  async createReview(dto: CreateCompanyReviewDto, user: UserEntity): Promise<CompanyReviewEntity> {
    const r = this.reviewRepo.create({
      ...dto,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
    } as any)
    return this.reviewRepo.save(r) as unknown as Promise<CompanyReviewEntity>
  }

  // ─── Staff ────────────────────────────────────────────────────────────────
  async getStaff(companyId: number, user: UserEntity) {
    this.assertCanManageCompany(companyId, user)
    return this.staffRepo.find({ where: { company_id: companyId } as any })
  }

  /** Flat staff list with optional filters. */
  async findAllStaff(filters: Record<string, any> = {}, user: UserEntity) {
    if (user.role !== UserRole.ADMIN || user.impersonating)
      throw new ForbiddenException("Platform administrator access required")
    const where: Record<string, any> = {}
    // StaffEntity only has company_id; treat organization_id filter as an alias for it.
    if (filters.company_id) where.company_id = filters.company_id
    if (filters.organization_id) where.company_id = filters.organization_id
    return this.staffRepo.find({ where, order: { created_date: "DESC" } as any })
  }

  async createStaff(dto: CreateStaffDto, user: UserEntity): Promise<StaffEntity> {
    this.assertCanManageCompany(Number(dto.company_id), user)
    const s = this.staffRepo.create(dto as any)
    return this.staffRepo.save(s) as unknown as Promise<StaffEntity>
  }

  async updateStaff(id: number, dto: UpdateStaffDto, user: UserEntity): Promise<StaffEntity> {
    const s = await this.staffRepo.findOne({ where: { id } as any })
    if (!s) throw new NotFoundException(`Staff ${id} not found`)
    this.assertCanManageCompany(Number(s.company_id), user)
    if (dto.company_id && dto.company_id !== s.company_id)
      this.assertCanManageCompany(Number(dto.company_id), user)
    Object.assign(s, dto)
    return this.staffRepo.save(s) as unknown as Promise<StaffEntity>
  }

  async deleteStaff(id: number, user: UserEntity): Promise<void> {
    const s = await this.staffRepo.findOne({ where: { id } as any })
    if (!s) throw new NotFoundException(`Staff ${id} not found`)
    this.assertCanManageCompany(Number(s.company_id), user)
    await this.staffRepo.remove(s)
  }
}
