import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConsentService } from '../consent/consent.service';

@Injectable()
export class EkycService {
  constructor(private prisma: PrismaService, private consent: ConsentService) {}

  async request(clientId: string, identityId: string, level: string, purpose: string, retentionDays?: number) {
    const valid = await this.consent.isValid(identityId, clientId, 'kyc.level');
    if (!valid) throw new ForbiddenException('CONSENT_REQUIRED');
    const expiresAt = new Date(Date.now() + ((retentionDays ?? 30) * 86400000));
    return this.prisma.ekycRequest.create({
      data: { clientId, identityId, level: level as any, status: 'PENDING', expiresAt },
    });
  }

  async approve(requestId: string, attestationJws: string) {
    return this.prisma.ekycRequest.update({ where: { id: requestId }, data: { status: 'APPROVED', attestationJws } });
  }

  async get(requestId: string, clientId: string) {
    const r = await this.prisma.ekycRequest.findUnique({ where: { id: requestId } });
    if (!r) throw new NotFoundException('eKYC request not found');
    if (r.clientId !== clientId) throw new ForbiddenException('Not your client');
    return r;
  }

  async status(pairwiseSub: string) {
    return { pairwiseSub, status: 'active' };
  }
}
