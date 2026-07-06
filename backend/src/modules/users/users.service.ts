import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/users.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  buildPaginatedResponse,
  getSkipTake,
} from '../../common/utils/pagination.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findAll(query: QueryUsersDto, requestingUser: UserEntity) {
    const { page, limit, sort, order, role, organization_id, is_active, search } = query;

    const where: Record<string, any> = {};

    // Admins see all; org users see their org only
    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      where.organization_id = requestingUser.organization_id;
    }

    if (role) where.role = role;
    if (organization_id && (requestingUser.role === UserRole.ADMIN || requestingUser.role === UserRole.SUPER_ADMIN)) {
      where.organization_id = organization_id;
    }
    if (is_active !== undefined) where.is_active = is_active;

    const findOptions: FindManyOptions<UserEntity> = {
      where,
      order: { [sort ?? 'created_date']: order ?? 'DESC' },
      skip: getSkipTake(page, limit).skip,
      take: getSkipTake(page, limit).take,
    };

    // Full-text search (basic LIKE)
    if (search) {
      findOptions.where = [
        { ...where, full_name: Like(`%${search}%`) },
        { ...where, email: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.repo.findAndCount(findOptions);

    return buildPaginatedResponse(
      data.map((u) => this.sanitize(u)),
      total,
      { page, limit, sort, order },
    );
  }

  async findById(id: string, requestingUser: UserEntity): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Can only view own user or same org (admins unrestricted)
    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN &&
      user.id !== requestingUser.id &&
      user.organization_id !== requestingUser.organization_id
    ) {
      throw new ForbiddenException('Access denied');
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requestingUser: UserEntity,
  ): Promise<UserEntity> {
    const user = await this.findById(id, requestingUser);

    // Only admins can change roles
    if (
      dto.role &&
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    Object.assign(user, dto);
    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async create(dto: CreateUserDto, requestingUser: UserEntity): Promise<any> {
    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only admins can create users');
    }

    const existing = await this.repo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = this.repo.create({
      email: dto.email.toLowerCase().trim(),
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone ?? null,
      role: dto.role as any,
      organization_id: dto.organization_id ?? null,
      is_active: dto.is_active ?? true,
    });

    const saved = await this.repo.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string, requestingUser: UserEntity): Promise<void> {
    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (id === requestingUser.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.repo.remove(user);
  }

  sanitize(user: UserEntity): any {
    const {
      password_hash,
      refresh_token_hash,
      reset_token_hash,
      reset_token_expires,
      ...rest
    } = user as any;
    return rest;
  }
}

