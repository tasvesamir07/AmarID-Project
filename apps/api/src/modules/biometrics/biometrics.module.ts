import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdaptersModule } from '../../adapters/adapters.module';
import { BiometricsService } from './biometrics.service';
import { BiometricsController } from './biometrics.controller';

@Module({
  imports: [PrismaModule, AdaptersModule],
  providers: [BiometricsService],
  controllers: [BiometricsController],
  exports: [BiometricsService],
})
export class BiometricsModule {}
