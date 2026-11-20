import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { OidcService } from './oidc.service';
import { OidcController } from './oidc.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [OidcService],
  controllers: [OidcController],
  exports: [OidcService],
})
export class OidcModule {}
