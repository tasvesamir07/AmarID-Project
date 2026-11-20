import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaService) {}

  async grant(identityId: string, clientId: string, scopes: string[], ttlDays?: number) {
    const expiresAt = ttlDays ? new Date(Date.now() + ttlDays * 86400000) : null;
    return this.prisma.consent.create({
      data: { identityId, clientId, scopes, grantedAt: new Date(), expiresAt },
    });
  }

  async revoke(identityId: string, consentId: string) {
    const consent = await this.prisma.consent.findUnique({ where: { id: consentId } });
    if (!consent) throw new NotFoundException('Consent not found');
    if (consent.identityId !== identityId) throw new ForbiddenException('Not your consent');
    return this.prisma.consent.update({ where: { id: consentId }, data: { revokedAt: new Date() } });
  }

  async list(identityId: string) {
    return this.prisma.consent.findMany({ where: { identityId }, orderBy: { grantedAt: 'desc' } });
  }

  async isValid(identityId: string, clientId: string, scope: string) {
    const c = await this.prisma.consent.findFirst({
      where: { identityId, clientId, revokedAt: null, scopes: { has: scope } },
    });
    return !!c;
  }
}
