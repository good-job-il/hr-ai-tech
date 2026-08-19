import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { NotificationEntity } from "./notification.entity"
import { CreateNotificationDto, QueryNotificationsDto } from "./dto/notifications.dto"
import { buildPaginatedResponse, getSkipTake } from "../../common/utils/pagination.utils"
import { UserEntity } from "../users/user.entity"
import { UserRole } from "../../common/enums/user-role.enum"

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity) private readonly repo: Repository<NotificationEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  private assertOwner(n: NotificationEntity, user: UserEntity) {
    const isAdmin = user.role === UserRole.ADMIN

    if (!isAdmin && n.recipient_user_id !== user.id) {
      throw new ForbiddenException("Access denied")
    }
  }

  async findAll(query: QueryNotificationsDto, user: UserEntity) {
    const { page, limit, sort, order, is_read, type } = query

    const where: Record<string, any> = { recipient_user_id: user.id }

    if (is_read !== undefined) {
      where.is_read = is_read
    }

    if (type) {
      where.type = type
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

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const recipient = await this.userRepo.findOne({ where: { email: dto.recipient_email } })

    const n = this.repo.create({ ...dto, recipient_user_id: recipient?.id ?? null } as any)

    return this.repo.save(n) as unknown as Promise<NotificationEntity>
  }

  async createUnreadOnce(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const existing = await this.repo.findOne({
      where: { recipient_email: dto.recipient_email, title: dto.title, is_read: false },
    })

    return existing ?? this.create(dto)
  }

  async markRead(id: number, user: UserEntity): Promise<NotificationEntity> {
    const n = await this.repo.findOne({ where: { id } as any })

    if (!n) {
      throw new NotFoundException(`Notification ${id} not found`)
    }

    this.assertOwner(n, user)
    n.is_read = true

    return this.repo.save(n) as unknown as Promise<NotificationEntity>
  }

  async markAllRead(recipientEmail: string): Promise<void> {
    const recipient = await this.userRepo.findOne({ where: { email: recipientEmail } })

    if (!recipient) {
      return
    }

    await this.repo.update({ recipient_user_id: recipient.id, is_read: false } as any, {
      is_read: true,
    })
  }

  async remove(id: number, user: UserEntity): Promise<void> {
    const n = await this.repo.findOne({ where: { id } as any })

    if (!n) {
      throw new NotFoundException(`Notification ${id} not found`)
    }

    this.assertOwner(n, user)
    await this.repo.remove(n)
  }
}
