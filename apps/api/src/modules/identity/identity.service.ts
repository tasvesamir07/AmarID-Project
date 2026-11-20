import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { maskUniversalId } from '@amarid/shared';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(identityId: string) {
    const identity = await this.prisma.identity.findUnique({
      where: { id: identityId },
      select: {
        id: true, universalId: true, status: true, assuranceLevel: true,
        issuedAt: true, lastProofOfLifeAt: true, nextProofOfLifeDueAt: true,
        createdAt: true,
      },
    });
    if (!identity) throw new NotFoundException('Identity not found');

    return {
      ...identity,
      maskedId: maskUniversalId(identity.universalId),
      nextProofOfLifeInDays: identity.nextProofOfLifeDueAt
        ? Math.ceil((identity.nextProofOfLifeDueAt.getTime() - Date.now()) / 86400000)
        : null,
    };
  }

  async getCard(identityId: string) {
    const profile = await this.getProfile(identityId);
    return {
      maskedId: profile.maskedId,
      status: profile.status,
      assuranceLevel: profile.assuranceLevel,
      issuedAt: profile.issuedAt,
      nextProofOfLifeInDays: profile.nextProofOfLifeInDays,
      // Verification badges derived from assurance level (demo)
      verificationBadges: [
        { modality: 'nid', verified: true },
        { modality: 'sim', verified: profile.assuranceLevel !== 'LOA1' },
        { modality: 'face', verified: profile.assuranceLevel === 'LOA3' },
        { modality: 'finger', verified: profile.assuranceLevel === 'LOA3' },
      ],
    };
  }

  async suspend(identityId: string, reason: string) {
    return this.prisma.identity.update({
      where: { id: identityId },
      data: { status: 'SUSPENDED' },
    });
  }

  async revoke(identityId: string) {
    return this.prisma.identity.update({
      where: { id: identityId },
      data: { status: 'REVOKED' },
    });
  }
}
