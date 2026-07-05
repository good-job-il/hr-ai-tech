import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './message.entity';
import { CreateMessageDto, UpdateMessageDto, QueryMessagesDto } from './dto/messages.dto';
import { buildPaginatedResponse, getSkipTake } from '../../common/utils/pagination.utils';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class MessagesService {
  constructor(@InjectRepository(MessageEntity) private readonly repo: Repository<MessageEntity>) {}

  async findAll(query: QueryMessagesDto) {
    const { page, limit, sort, order, application_id, sender_email, is_read } = query;
    const where: Record<string, any> = {};
    if (application_id) where.application_id = application_id;
    if (sender_email) where.sender_email = sender_email;
    if (is_read !== undefined) where.is_read = is_read;
    const { skip, take } = getSkipTake(page, limit);
    const [data, total] = await this.repo.findAndCount({ where, order: { [sort]: order }, skip, take });
    return buildPaginatedResponse(data, total, { page, limit });
  }

  async findById(id: string): Promise<MessageEntity> {
    const msg = await this.repo.findOne({ where: { id } as any });
    if (!msg) throw new NotFoundException(`Message ${id} not found`);
    return msg;
  }

  async create(dto: CreateMessageDto, user: UserEntity): Promise<MessageEntity> {
    // Prevent identity spoofing: sender identity is always derived from the authenticated user,
    // never trusted from the request body.
    const msg = this.repo.create({
      ...dto,
      sender_email: user.email,
      sender_role: dto.sender_role ?? user.role,
    } as any);
    return this.repo.save(msg) as unknown as Promise<MessageEntity>;
  }

  async update(id: string, dto: UpdateMessageDto): Promise<MessageEntity> {
    const msg = await this.findById(id);
    Object.assign(msg, dto);
    return this.repo.save(msg) as unknown as Promise<MessageEntity>;
  }

  async markAllRead(applicationId: string): Promise<void> {
    await this.repo.update({ application_id: applicationId, is_read: false }, { is_read: true });
  }
}

