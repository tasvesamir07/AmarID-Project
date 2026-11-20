import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { CryptoKeyModule } from './common/crypto/crypto-key.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { CsrfGuard } from './common/auth/csrf.guard';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { BiometricsModule } from './modules/biometrics/biometrics.module';
import { OidcModule } from './modules/oidc/oidc.module';
import { ConsentModule } from './modules/consent/consent.module';
import { EkycModule } from './modules/ekyc/ekyc.module';
import { ProofOfLifeModule } from './modules/proofoflife/proofoflife.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TerminusModule,
    CryptoKeyModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    IdentityModule,
    EnrollmentModule,
    BiometricsModule,
    OidcModule,
    ConsentModule,
    EkycModule,
    ProofOfLifeModule,
    NotificationsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  controllers: [HealthController],
})
export class AppModule {}
