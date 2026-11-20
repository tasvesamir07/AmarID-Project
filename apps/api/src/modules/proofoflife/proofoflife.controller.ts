import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProofOfLifeService } from './proofoflife.service';
import { CurrentIdentity } from '../../common/auth/current-identity.decorator';

@Controller('v1')
export class ProofOfLifeController {
  constructor(private readonly s: ProofOfLifeService) {}

  @Post('me/proof-of-life/start')
  async start(@CurrentIdentity() identityId: string) {
    return this.s.start(identityId);
  }

  @Post('me/proof-of-life/complete')
  async complete(@CurrentIdentity() identityId: string, @Body() body: { method: string; passed: boolean }) {
    return this.s.complete(identityId, body.method, body.passed);
  }

  @Get('me/proof-of-life/status')
  async status(@CurrentIdentity() identityId: string) {
    return this.s.status(identityId);
  }
}
