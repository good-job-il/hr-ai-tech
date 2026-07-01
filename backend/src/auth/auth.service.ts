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
import * as crypto from 'crypto';
import { UserEntity } from '../modules/users/user.entity';
import { RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      organization_id: dto.organization_id ?? null,
      is_active: true,
      last_login: new Date(),
    });

    const saved = await this.userRepository.save(user);
    const tokens = await this.generateTokens(saved);
    await this.saveRefreshToken(saved.id, tokens.refresh_token);

    return { ...tokens, user: this.sanitizeUser(saved) };
  }

  // ─── Logout ────────────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refresh_token_hash: null });
  }

  // ─── Get current user (me) ─────────────────────────────────────────────
  async getMe(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─── Update me ─────────────────────────────────────────────────────────
  async updateMe(userId: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    const allowedFields: (keyof UserEntity)[] = [
      'full_name',
      'phone',
      'display_role_name',
      'last_login',
      'org_type',
      'is_active',
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

    // TODO: Send email via MailService (Phase 3)
    // await this.mailService.sendPasswordReset(user.email, resetToken);
    console.log(`[Auth] Password reset token for ${user.email}: ${resetToken}`);

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
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
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

