import {
  Controller,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/auth/public.decorator';
import { EnrollmentService } from './enrollment.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  enrollmentStartSchema,
  enrollmentDocumentSchema,
  enrollmentSimOtpRequestSchema,
  enrollmentSimOtpVerifySchema,
  enrollmentEmailOtpRequestSchema,
  enrollmentEmailOtpVerifySchema,
  enrollmentLivenessSchema,
  enrollmentLivenessResultSchema,
  enrollmentFingerprintSchema,
  enrollmentFinalizeSchema,
} from '@amarid/shared';

@Public()
@Controller('v1/enrollments')
export class EnrollmentController {
  constructor(private readonly s: EnrollmentService) {}

  private clientMeta(req: Request) {
    const rawDev = req.headers['x-device-fingerprint'];
    const deviceFingerprint = (Array.isArray(rawDev) ? rawDev[0] : rawDev) || 'unknown';
    return {
      ip: (req.ip as string) || 'unknown',
      deviceFingerprint,
    };
  }

  @Post()
  start(@Body(new ZodValidationPipe(enrollmentStartSchema)) body: any) {
    return this.s.start({
      docType: body.docType,
      docNumber: body.docNumber,
      msisdn: body.msisdn,
      email: body.email,
      cfp: body.clientFingerprintHash,
    });
  }

  @Post(':id/document')
  async document(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentDocumentSchema)) body: any,
  ) {
    return this.s.document(id, { docType: body.docType, number: body.docNumber });
  }

  @Post(':id/sim/otp/request')
  async simOtpRequest(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentSimOtpRequestSchema)) body: any,
    @Req() req: Request,
  ) {
    return this.s.simOtpRequest(id, body.msisdn, this.clientMeta(req).ip, this.clientMeta(req).deviceFingerprint);
  }

  @Post(':id/sim/otp/verify')
  async simOtpVerify(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentSimOtpVerifySchema)) body: any,
  ) {
    return this.s.simOtpVerify({
      enrollmentId: id,
      msisdn: body.msisdn,
      challengeId: body.challengeId,
      code: body.code,
    });
  }

  @Post(':id/email/otp/request')
  async emailOtpRequest(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentEmailOtpRequestSchema)) body: any,
    @Req() req: Request,
  ) {
    return this.s.emailOtpRequest(
      id,
      body.email,
      this.clientMeta(req).ip,
      this.clientMeta(req).deviceFingerprint,
    );
  }

  @Post(':id/email/otp/verify')
  async emailOtpVerify(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentEmailOtpVerifySchema)) body: any,
  ) {
    return this.s.emailOtpVerify({
      enrollmentId: id,
      email: body.email,
      challengeId: body.challengeId,
      code: body.code,
    });
  }

  @Post(':id/liveness/session')
  async livenessSession(@Param('id') id: string) {
    return this.s.livenessSession(id);
  }

  @Post(':id/liveness/result')
  async livenessResult(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentLivenessResultSchema)) body: any,
  ) {
    return this.s.livenessResult({
      enrollmentId: id,
      sessionId: body.sessionId,
      faceProbe: body.faceProbe,
    });
  }

  @Post(':id/fingerprint')
  async fingerprint(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(enrollmentFingerprintSchema)) body: any,
  ) {
    return this.s.fingerprint(id, body.template);
  }

  @Post(':id/finalize')
  async finalize(@Param('id') id: string) {
    return this.s.finalize(id);
  }
}
