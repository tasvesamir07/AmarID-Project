import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: { actor?: string; action: string; subjectPseudonym?: string; metadata: Record<string, unknown>; prevHash: string }) {
    const payload = JSON.stringify({ ...params.metadata, timestamp: new Date().toISOString(), action: params.action });
    const hash = createHmac('sha256', params.prevHash).update(payload).digest('hex');
    return this.prisma.auditLog.create({
      data: {
        actor: params.actor ?? null,
        action: params.action,
        subjectPseudonym: params.subjectPseudonym ?? null,
        metadata: params.metadata as Prisma.InputJsonValue,
        prevHash: params.prevHash,
        hash,
      },
    });
  }

  async getLastHash() {
    const last = await this.prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { hash: true } });
    return last?.hash || 'genesis';
  }
}
