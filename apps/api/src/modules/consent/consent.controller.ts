import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { CurrentIdentity } from '../../common/auth/current-identity.decorator';

@Controller('v1')
export class ConsentController {
  constructor(private readonly s: ConsentService) {}

  @Post('me/consents')
  async grant(@CurrentIdentity() identityId: string, @Body() body: { clientId: string; scopes: string[]; ttlDays?: number }) {
    return this.s.grant(identityId, body.clientId, body.scopes, body.ttlDays);
  }

  @Get('me/consents')
  async list(@CurrentIdentity() identityId: string) {
    return this.s.list(identityId);
  }

  @Delete('me/consents/:id')
  async revoke(@CurrentIdentity() identityId: string, @Param('id') id: string) {
    return this.s.revoke(identityId, id);
  }
}
