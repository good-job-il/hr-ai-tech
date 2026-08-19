import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { MessageEntity } from "./message.entity"
import { CreateMessageDto, UpdateMessageDto, QueryMessagesDto } from "./dto/messages.dto"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { UserEntity } from "../users/user.entity"
import { ApplicationsService } from "../applications/applications.service"
import { ApplicationTimelineEntity } from "../applications/entities/application-timeline.entity"

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity) private readonly repo: Repository<MessageEntity>,
    private readonly applications: ApplicationsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryMessagesDto, user: UserEntity) {
    const { page, limit, sort, order, application_id, is_read } = query

    if (!application_id) {
      return buildPaginatedResponse([], 0, { page, limit, sort, order })
    }

    await this.applications.findById(application_id, user)

    const where: Record<string, any> = {}

    if (application_id) {
      where.application_id = application_id
    }

    if (is_read !== undefined) {
      where.is_read = is_read
    }

    const { skip, take } = getSkipTake(page, limit)

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order },
      skip,
      take,
    })

    return buildPaginatedResponse(data, total, { page, limit })
  }

  async findById(id: number, user: UserEntity): Promise<MessageEntity> {
    const msg = await this.repo.findOne({ where: { id } as any })

    if (!msg) {
      throw new NotFoundException(`Message ${id} not found`)
    }

    await this.applications.findById(msg.application_id, user)

    return msg
  }

  async create(dto: CreateMessageDto, user: UserEntity): Promise<MessageEntity> {
    const application = await this.applications.findById(dto.application_id, user)

    // Prevent identity spoofing: sender identity is always derived from the authenticated user,
    // never trusted from the request body.
    const msg = this.repo.create({
      ...dto,
      sender_email: user.email,
      sender_role:
        user.role === "candidate"
          ? "candidate"
          : user.role === "employer"
            ? "employer"
            : "recruiter",
      is_read: false,
    } as any)

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.getRepository(MessageEntity).save(msg as unknown as MessageEntity)

      await manager.save(
        ApplicationTimelineEntity,
        manager.create(ApplicationTimelineEntity, {
          application_id: application.id,
          organization_id: application.organization_id,
          event_type: "message_sent",
          description: "Message sent in the application conversation",
          performed_by: user.email,
          performed_by_role: user.role,
        } as any),
      )

      return saved
    })
  }

  async update(id: number, dto: UpdateMessageDto, user: UserEntity): Promise<MessageEntity> {
    const msg = await this.findById(id, user)

    Object.assign(msg, dto)

    return this.repo.save(msg) as unknown as Promise<MessageEntity>
  }

  async markAllRead(applicationId: number, user: UserEntity): Promise<void> {
    await this.applications.findById(applicationId, user)

    const messages = await this.repo.find({
      where: { application_id: applicationId, is_read: false },
    })

    const incoming = messages
      .filter((message) => message.sender_email !== user.email)
      .map((message) => message.id)

    if (incoming.length) {
      await this.repo.update(incoming, { is_read: true })
    }
  }
}
