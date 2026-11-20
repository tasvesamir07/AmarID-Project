import {
  Controller, Get, Param, Post, Body, UseGuards,
} from '@nestjs/common';
import { IdentityService } from './identity.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Public } from '../../common/auth/public.decorator';
import { CurrentIdentity } from '../../common/auth/current-identity.decorator';

@Controller('v1')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentIdentity() identityId: string) {
    return this.identity.getProfile(identityId);
  }

  @Get('me/card')
  @UseGuards(JwtAuthGuard)
  async card(@CurrentIdentity() identityId: string) {
    return this.identity.getCard(identityId);
  }

  @Public()
  @Get('identities/:universalId/status')
  async status(@Param('universalId') universalId: string) {
    return { universalId, status: 'active' }; // coarse public status only
  }

  @Post('admin/identities/:id/suspend')
  @UseGuards(JwtAuthGuard)
  async suspend(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.identity.suspend(id, body.reason);
  }
}
