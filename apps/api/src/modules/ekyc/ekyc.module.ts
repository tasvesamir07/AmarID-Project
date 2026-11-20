import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConsentModule } from '../consent/consent.module';
import { EkycService } from './ekyc.service';
import { EkycController } from './ekyc.controller';

@Module({
  imports: [PrismaModule, ConsentModule],
  providers: [EkycService],
  controllers: [EkycController],
  exports: [EkycService],
})
export class EkycModule {}
