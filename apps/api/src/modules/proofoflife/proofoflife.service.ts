import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ProofOfLifeService {
  constructor(private prisma: PrismaService) {}

  async start(identityId: string) {
    const identity = await this.prisma.identity.findUnique({ where: { id: identityId } });
    if (!identity) throw new NotFoundException('Identity not found');
    const dueAt = new Date(Date.now() + 365 * 86400000);
    const event = await this.prisma.proofOfLifeEvent.create({
      data: { identityId, dueAt, method: null, result: null, scoreBucket: null },
    });
    return { eventId: event.id, dueAt };
  }

  async complete(identityId: string, method: string, passed: boolean) {
    const identity = await this.prisma.identity.findUnique({ where: { id: identityId } });
    if (!identity) throw new NotFoundException('Identity not found');
    const latest = await this.prisma.proofOfLifeEvent.findFirst({ where: { identityId }, orderBy: { createdAt: 'desc' } });
    if (latest) {
      await this.prisma.proofOfLifeEvent.update({
        where: { id: latest.id },
        data: { completedAt: new Date(), method, result: passed ? 'PASS' : 'FAIL' },
      });
    }
    await this.prisma.identity.update({
      where: { id: identityId },
      data: { status: passed ? 'ACTIVE' : 'DORMANT', lastProofOfLifeAt: new Date(), nextProofOfLifeDueAt: new Date(Date.now() + 365 * 86400000) },
    });
    return { passed, status: passed ? 'ACTIVE' : 'DORMANT' };
  }

  async status(identityId: string) {
    const identity = await this.prisma.identity.findUnique({ where: { id: identityId } });
    if (!identity) throw new NotFoundException('Identity not found');
    return { status: identity.status, nextProofOfLifeDueAt: identity.nextProofOfLifeDueAt, lastProofOfLifeAt: identity.lastProofOfLifeAt };
  }
}
