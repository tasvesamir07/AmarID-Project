import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  Req,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PasskeyService } from './passkey.service';
import { SessionService } from '../../common/auth/session.service';
import { Public } from '../../common/auth/public.decorator';
import { CurrentIdentity } from '../../common/auth/current-identity.decorator';
import {
  otpRequestSchema,
  otpVerifySchema,
  otpResendSchema,
} from '@amarid/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { cookieNames, parseCookies } from '../../common/auth/cookies';

@Controller('v1')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passkey: PasskeyService,
    private readonly sessions: SessionService,
  ) {}

  /* ---------------- OTP ---------------- */

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema)) body: any,
    @Req() req: Request,
  ) {
    return this.auth.requestOtp({
      purpose: body.purpose,
      channel: body.channel,
      destination: body.destination,
      enrollmentId: body.enrollmentId,
      ip: (req.ip as string) || 'unknown',
      deviceFingerprint: (Array.isArray(req.headers['x-device-fingerprint']) ? req.headers['x-device-fingerprint'][0] : req.headers['x-device-fingerprint']) || 'unknown',
    });
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body(new ZodValidationPipe(otpVerifySchema)) body: any) {
    return this.auth.verifyOtp({
      challengeId: body.challengeId,
      code: body.code,
    });
  }

  @Public()
  @Post('otp/resend')
  @HttpCode(200)
  resendOtp(@Body(new ZodValidationPipe(otpResendSchema)) body: any) {
    return this.auth.resendOtp(body.challengeId);
  }

  /* ---------------- Passkey registration (end of signup) ---------------- */

  @Public()
  @Get('auth/passkey/register-options')
  registerOptions(@Query('setupToken') setupToken: string) {
    return this.passkey.createRegistrationOptions(setupToken);
  }

  @Public()
  @Post('auth/passkey/register')
  @HttpCode(200)
  async register(
    @Body() body: { setupToken: string; response: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const device = await this.passkey.verifyRegistration(body.setupToken, body.response);
    const { csrfToken } = await this.sessions.issueSession(res, device.identityId);
    return {
      credentialId: device.id,
      label: device.label,
      identityId: device.identityId,
      csrfToken,
    };
  }

  /* ---------------- Passkey login ---------------- */

  @Public()
  @Post('auth/passkey/login-options')
  @HttpCode(200)
  loginOptions(@Body() body: { universalId: string }) {
    return this.passkey.createAuthenticationOptions(body.universalId);
  }

  @Public()
  @Post('auth/passkey/login')
  @HttpCode(200)
  async login(
    @Body() body: { universalId: string; response: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const identityId = await this.passkey.verifyAuthentication(body.universalId, body.response);
    const { csrfToken } = await this.sessions.issueSession(res, identityId);
    return { identityId, csrfToken };
  }

  /* ---------------- Session lifecycle ---------------- */

  @Public()
  @Post('auth/refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[cookieNames().refresh];
    if (!token) throw new UnauthorizedException('SESSION_EXPIRED');
    const { csrfToken } = await this.sessions.refresh(res, token);
    return { ok: true, csrfToken };
  }

  @Public()
  @Post('auth/logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = parseCookies(req.headers.cookie);
    await this.sessions.logout(res, cookies[cookieNames().refresh]);
    return { ok: true };
  }

  /* ---------------- Device management (authenticated) ---------------- */

  @Get('auth/devices')
  devices(@CurrentIdentity() identityId: string) {
    return this.passkey.listDevices(identityId);
  }

  @Delete('auth/devices/:id')
  revokeDevice(@CurrentIdentity() identityId: string, @Param('id') id: string) {
    return this.passkey.revokeDevice(identityId, id);
  }
}
