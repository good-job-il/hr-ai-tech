import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Rate limiting ───────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ─── Cron / Scheduling ──────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Database ───────────────────────────────────────────────────
    DatabaseModule,

    // ─── Feature modules ────────────────────────────────────────────
    AuthModule,
    UsersModule,
    OrganizationsModule,
    TaxonomyModule,
  ],
})
export class AppModule {}

