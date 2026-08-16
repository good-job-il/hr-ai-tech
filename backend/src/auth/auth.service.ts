import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { AuditService } from '../modules/audit/audit.service';
import { RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from '../modules/integrations/services/email.service';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<UserEntity, 'password_hash' | 'refresh_token_hash' | 'reset_token_hash' | 'reset_token_expires'>;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepository: Repository<OrganizationEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Validate credentials (used by LocalStrategy) ──────────────────────
  async validateCredentials(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), is_active: true },
    });

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password_hash);
    return isMatch ? user : null;
  }

  // ─── Login ─────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last_login
    await this.userRepository.update(user.id, {
      last_login: new Date(),
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  // ─── Register ──────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      password_hash,
      full_name: dto.full_name,
      phone: dto.phone ?? null,
      role: dto.role as any,
      // Public registration never attaches a user to an existing tenant.
      // Staff membership and tenant identity are assigned by invitation/onboarding flows.
      organization_id: null,
      is_active: true,
      last_login: new Date(),
    });

    const saved = await this.userRepository.save(user);
    const tokens = await this.generateTokens(saved);
    await this.saveRefreshToken(saved.id, tokens.refresh_token);

    return { ...tokens, user: this.sanitizeUser(saved) };
  }

  // ─── Logout ────────────────────────────────────────────────────────────
  async logout(userId: number): Promise<void> {
    await this.userRepository.update(userId, { refresh_token_hash: null });
  }

  // ─── Get current user (me) ─────────────────────────────────────────────
  async getMe(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─── Update me ─────────────────────────────────────────────────────────
  async updateMe(userId: number, updates: Partial<UserEntity>): Promise<UserEntity> {
    const allowedFields: (keyof UserEntity)[] = [
      'full_name',
      'phone',
      'display_role_name',
      'last_login',
      'org_type',
      'is_active',
      'company_culture',
      'benefits',
      'gallery_urls',
      'video_url',
      'testimonials',
    ];

    const safeUpdates: Partial<UserEntity> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        (safeUpdates as any)[key] = (updates as any)[key];
      }
    }

    await this.userRepository.update(userId, safeUpdates);
    return this.getMe(userId);
  }

  // ─── Refresh tokens ────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_active: true },
    });

    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // ─── Forgot password ───────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), is_active: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account with this email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, this.SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.update(user.id, {
      reset_token_hash: resetTokenHash,
      reset_token_expires: expiresAt,
    });

    await this.emailService.sendPasswordReset({ email: user.email, token: resetToken });

    return { message: 'If an account with this email exists, a reset link has been sent.' };
  }

  // ─── Reset password ────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const users = await this.userRepository.find({
      where: { is_active: true },
      select: ['id', 'reset_token_hash', 'reset_token_expires'],
    });

    let targetUser: UserEntity | null = null;

    for (const user of users) {
      if (!user.reset_token_hash || !user.reset_token_expires) continue;
      if (new Date() > user.reset_token_expires) continue;

      const isMatch = await bcrypt.compare(token, user.reset_token_hash);
      if (isMatch) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.userRepository.update(targetUser.id, {
      password_hash,
      reset_token_hash: null,
      reset_token_expires: null,
      refresh_token_hash: null,
    });
  }

  // ─── Admin: enter an organization's workspace (impersonation) ──────────
  // Only ADMIN may call this (enforced by @Roles(UserRole.ADMIN) on the
  // controller route). Issues a short-lived, non-refreshable token scoped
  // to the target organization instead of mutating the admin's real
  // session — the admin's own long-lived access/refresh tokens are left
  // completely untouched, so "exiting" is just discarding this token.
  async enterOrganization(admin: UserEntity, organizationId: number): Promise<{
    access_token: string;
    organization: OrganizationEntity;
  }> {
    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only platform admins can enter an organization workspace');
    }

    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      organization_id: org.id,
      org_type: org.org_type,
      impersonating: true,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      // Deliberately short — forces re-entry, limits blast radius, and
      // there is no matching refresh token for this scoped session.
      expiresIn: this.configService.get<string>('JWT_WORKSPACE_EXPIRES_IN', '2h') as SignOptions['expiresIn'],
    });

    await this.auditService.log({
      organization_id: String(org.id),
      actor_user_id: String(admin.id),
      actor_email: admin.email,
      actor_role: admin.role,
      entity_type: 'Organization',
      entity_id: org.id,
      entity_label: org.name,
      action: 'impersonate',
      metadata: { event: 'enter' },
    });

    return { access_token, organization: org };
  }

  // ─── Admin: exit an organization's workspace ───────────────────────────
  // Stateless by design — the frontend simply discards the workspace token
  // and reverts to the admin's normal access token. This call only exists
  // to leave an audit trail.
  async exitOrganization(admin: UserEntity, organizationId: number | null): Promise<void> {
    if (!organizationId) return;
    await this.auditService.log({
      organization_id: String(organizationId),
      actor_user_id: String(admin.id),
      actor_email: admin.email,
      actor_role: admin.role,
      entity_type: 'Organization',
      entity_id: organizationId,
      action: 'impersonate',
      metadata: { event: 'exit' },
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────
  private async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as SignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as SignOptions['expiresIn'],
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    await this.userRepository.update(userId, { refresh_token_hash: hash });
  }

  sanitizeUser(user: UserEntity): any {
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
