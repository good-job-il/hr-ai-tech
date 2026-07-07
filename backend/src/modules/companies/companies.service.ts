import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CompanyEntity, CompanyReviewEntity, StaffEntity } from './company.entity';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompaniesDto, CreateCompanyReviewDto, CreateStaffDto, UpdateStaffDto } from './dto/companies.dto';
import { UserEntity } from '../users/user.entity';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyReviewEntity) private readonly reviewRepo: Repository<CompanyReviewEntity>,
    @InjectRepository(StaffEntity) private readonly staffRepo: Repository<StaffEntity>,
  ) {}

  async findAll(query: QueryCompaniesDto) {
    const { page, limit, sort, order, search, industry, is_deleted } = query;
    const where: Record<string, any> = { is_deleted: is_deleted ?? false };
    if (industry) where.industry = industry;
    const { skip, take } = getSkipTake(page, limit);
    let findWhere: any = where;
    if (search) {
      findWhere = [
        { ...where, name: Like(`%${search}%`) },
        { ...where, industry: Like(`%${search}%`) },
      ];
    }
    const [data, total] = await this.companyRepo.findAndCount({ where: findWhere, order: { [sort]: order }, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async findById(id: number): Promise<CompanyEntity> {
    const c = await this.companyRepo.findOne({ where: { id } as any });
    if (!c) throw new NotFoundException(`Company ${id} not found`);
    return c;
  }

  async create(dto: CreateCompanyDto): Promise<CompanyEntity> {
    const c = this.companyRepo.create(dto as any);
    return this.companyRepo.save(c) as unknown as Promise<CompanyEntity>;
  }

  async update(id: number, dto: UpdateCompanyDto, user: UserEntity): Promise<CompanyEntity> {
    const c = await this.findById(id);
    Object.assign(c, dto);
    if (dto.is_deleted && !c.deleted_at) {
      c.deleted_at = new Date();
      c.deleted_by = user.id;
    }
    return this.companyRepo.save(c) as unknown as Promise<CompanyEntity>;
  }

  async softDelete(id: number, user: UserEntity): Promise<void> {
    await this.update(id, { is_deleted: true } as any, user);
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────
  async getReviews(companyId: number) {
    return this.reviewRepo.find({ where: { company_id: companyId } as any, order: { created_date: 'DESC' } as any });
  }

  async createReview(dto: CreateCompanyReviewDto): Promise<CompanyReviewEntity> {
    const r = this.reviewRepo.create(dto as any);
    return this.reviewRepo.save(r) as unknown as Promise<CompanyReviewEntity>;
  }

  // ─── Staff ────────────────────────────────────────────────────────────────
  async getStaff(companyId: number) {
    return this.staffRepo.find({ where: { company_id: companyId } as any });
  }

  /** Flat list — mirrors base44.entities.Staff.list()/.filter(...) */
  async findAllStaff(filters: Record<string, any> = {}) {
    const where: Record<string, any> = {};
    // StaffEntity only has company_id; treat organization_id filter as an alias for it.
    if (filters.company_id) where.company_id = filters.company_id;
    if (filters.organization_id) where.company_id = filters.organization_id;
    return this.staffRepo.find({ where, order: { created_date: 'DESC' } as any });
  }

  async createStaff(dto: CreateStaffDto): Promise<StaffEntity> {
    const s = this.staffRepo.create(dto as any);
    return this.staffRepo.save(s) as unknown as Promise<StaffEntity>;
  }

  async updateStaff(id: number, dto: UpdateStaffDto): Promise<StaffEntity> {
    const s = await this.staffRepo.findOne({ where: { id } as any });
    if (!s) throw new NotFoundException(`Staff ${id} not found`);
    Object.assign(s, dto);
    return this.staffRepo.save(s) as unknown as Promise<StaffEntity>;
  }

  async deleteStaff(id: number): Promise<void> {
    const s = await this.staffRepo.findOne({ where: { id } as any });
    if (!s) throw new NotFoundException(`Staff ${id} not found`);
    await this.staffRepo.remove(s);
  }
}

