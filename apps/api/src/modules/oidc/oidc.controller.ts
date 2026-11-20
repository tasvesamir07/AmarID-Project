import {
  Controller, Get, Post, Body, Query, BadRequestException,
} from '@nestjs/common';
import { OidcService } from './oidc.service';
import { Public } from '../../common/auth/public.decorator';

@Controller()
export class OidcController {
  constructor(private readonly oidc: OidcService) {}

  @Public()
  @Get('.well-known/openid-configuration')
  discovery(@Query('issuer') issuer: string) {
    return this.oidc.getDiscovery(issuer || 'http://localhost:4000');
  }

  @Public()
  @Get('jwks.json')
  jwks() {
    return this.oidc.getJwks();
  }

  @Public()
  @Post('authorize')
  async authorize(@Body() body: any) {
    return this.oidc.authorize({
      client_id: body.client_id, redirect_uri: body.redirect_uri, scope: body.scope,
      state: body.state, nonce: body.nonce, code_challenge: body.code_challenge,
      identityId: body.identityId,
    });
  }

  @Public()
  @Post('consent')
  async consent(@Body() body: { requestId: string; identityId: string; approve: boolean; scopes: string[] }) {
    return this.oidc.consent(body.requestId, body.identityId, body.approve, body.scopes);
  }

  @Public()
  @Post('token')
  async token(@Body() body: any) {
    return this.oidc.token(body);
  }

  @Public()
  @Post('userinfo')
  async userinfo(@Body() body: { accessToken: string }) {
    return this.oidc.userinfo(body.accessToken);
  }
}
