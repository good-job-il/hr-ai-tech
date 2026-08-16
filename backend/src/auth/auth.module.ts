import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { NoImpersonationGuard } from '../common/guards/no-impersonation.guard';
import { UserEntity } from '../modules/users/user.entity';
import { OrganizationEntity } from '../modules/organizations/organization.entity';
import { AuditModule } from '../modules/audit/audit.module';
import { IntegrationsModule } from '../modules/integrations/integrations.module';
import type { SignOptions } from 'jsonwebtoken';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'fallback-secret'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as SignOptions['expiresIn'],
        },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]),
    AuditModule,
    IntegrationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    // Apply JWT guard globally — use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply Roles guard globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Blocks @BlockDuringImpersonation() routes for admins acting inside
    // an organization workspace
    {
      provide: APP_GUARD,
      useClass: NoImpersonationGuard,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
