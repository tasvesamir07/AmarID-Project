import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';

@Controller('v1/biometrics')
export class BiometricsController {
  constructor(private readonly s: BiometricsService) {}

  @Post(':identityId/templates')
  async enroll(@Param('identityId') identityId: string, @Body() body: { modality: string; protectedBlob: string; keyVersion?: number }) {
    return this.s.enrollTemplate(identityId, body.modality as any, Buffer.from(body.protectedBlob, 'base64'), body.keyVersion);
  }

  @Get(':identityId/templates')
  async templates(@Param('identityId') identityId: string) {
    return this.s.getTemplates(identityId);
  }

  @Post(':identityId/dedup/face')
  async dedupFace(@Param('identityId') identityId: string, @Body() body: { probe: string }) {
    return this.s.dedup(identityId, 'FACE', Buffer.from(body.probe, 'base64'));
  }
}
