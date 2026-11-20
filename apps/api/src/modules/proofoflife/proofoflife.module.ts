import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProofOfLifeService } from './proofoflife.service';
import { ProofOfLifeController } from './proofoflife.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProofOfLifeService],
  controllers: [ProofOfLifeController],
  exports: [ProofOfLifeService],
})
export class ProofOfLifeModule {}
