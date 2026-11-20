import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AdaptersModule } from '../../adapters/adapters.module';
import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { AuthController } from './auth.controller';
import { SessionService } from '../../common/auth/session.service';

@Module({
  imports: [PrismaModule, RedisModule, AdaptersModule],
  providers: [AuthService, PasskeyService, SessionService],
  controllers: [AuthController],
  exports: [AuthService, PasskeyService, SessionService],
})
export class AuthModule {}
