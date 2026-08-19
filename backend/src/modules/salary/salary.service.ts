import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, Like } from "typeorm"
import { SalaryDataEntity } from "./salary-data.entity"
import { CreateSalaryDataDto, UpdateSalaryDataDto, QuerySalaryDataDto } from "./dto/salary-data.dto"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(SalaryDataEntity)
    private readonly repo: Repository<SalaryDataEntity>,
  ) {}

  async findAll(query: QuerySalaryDataDto) {
    const { page, limit, job_title, category, location } = query

    const where: Record<string, any> = {}

    if (job_title) {
      where.job_title = Like(`%${job_title}%`)
    }

    if (category) {
      where.category = category
    }

    if (location) {
      where.location = location
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.repo.findAndCount({ where, skip, take })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async findById(id: number): Promise<SalaryDataEntity> {
    const record = await this.repo.findOne({ where: { id } })

    if (!record) {
      throw new NotFoundException(`Salary data ${id} not found`)
    }

    return record
  }

  async create(dto: CreateSalaryDataDto): Promise<SalaryDataEntity> {
    const record = this.repo.create(dto as any)

    return this.repo.save(record) as unknown as Promise<SalaryDataEntity>
  }

  async update(id: number, dto: UpdateSalaryDataDto): Promise<SalaryDataEntity> {
    const record = await this.findById(id)

    Object.assign(record, dto)

    return this.repo.save(record)
  }

  async remove(id: number): Promise<void> {
    const record = await this.findById(id)

    await this.repo.remove(record)
  }
}
