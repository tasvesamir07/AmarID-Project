import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { EkycService } from './ekyc.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentIdentity } from '../../common/auth/current-identity.decorator';

@Controller('v1/ekyc')
export class EkycController {
  constructor(private readonly s: EkycService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  async request(@CurrentIdentity() identityId: string, @Body() body: { clientId: string; level: string; purpose: string; retentionDays?: number }) {
    return this.s.request(body.clientId, identityId, body.level, body.purpose, body.retentionDays);
  }

  @Post('requests/:id/approve')
  async approve(@Param('id') id: string, @Body() body: { attestationJws: string }) {
    return this.s.approve(id, body.attestationJws);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  async get(@CurrentIdentity() identityId: string, @Param('id') id: string, @Body() body: { clientId: string }) {
    return this.s.get(id, body.clientId);
  }

  @Get('identities/:pairwiseSub/status')
  async status(@Param('pairwiseSub') pairwiseSub: string) {
    return this.s.status(pairwiseSub);
  }
}
