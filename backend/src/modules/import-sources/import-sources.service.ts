import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ImportSourceEntity } from "./import-source.entity"
import {
  CreateImportSourceDto,
  UpdateImportSourceDto,
  QueryImportSourcesDto,
} from "./dto/import-source.dto"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"

@Injectable()
export class ImportSourcesService {
  constructor(
    @InjectRepository(ImportSourceEntity)
    private readonly repo: Repository<ImportSourceEntity>,
  ) {}

  async findAll(query: QueryImportSourcesDto) {
    const { page, limit, is_active } = query

    const where: Record<string, any> = {}

    if (is_active !== undefined) {
      where.is_active = is_active
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.repo.findAndCount({ where, skip, take })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async findById(id: number): Promise<ImportSourceEntity> {
    const source = await this.repo.findOne({ where: { id } })

    if (!source) {
      throw new NotFoundException(`Import source ${id} not found`)
    }

    return source
  }

  async create(dto: CreateImportSourceDto): Promise<ImportSourceEntity> {
    const source = this.repo.create(dto as any)

    return this.repo.save(source) as unknown as Promise<ImportSourceEntity>
  }

  async update(id: number, dto: UpdateImportSourceDto): Promise<ImportSourceEntity> {
    const source = await this.findById(id)

    Object.assign(source, dto)

    return this.repo.save(source)
  }

  async remove(id: number): Promise<void> {
    const source = await this.findById(id)

    await this.repo.remove(source)
  }
}
