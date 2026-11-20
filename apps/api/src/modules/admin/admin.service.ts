import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async metrics() {
    const [identities, enrollments, consents, ekyc] = await Promise.all([
      this.prisma.identity.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.enrollment.groupBy({ by: ['state'], _count: { state: true } }),
      this.prisma.consent.count(),
      this.prisma.ekycRequest.groupBy({ by: ['status'], _count: { status: true } }),
    ]);
    return { identities, enrollments, totalConsents: consents, ekyc };
  }

  async createClient(data: { name: string; redirectUris: string[]; scopes: string[]; type: string; sectorIdentifier?: string; verifiedPartner?: boolean; tier?: string }) {
    return this.prisma.oidcClient.create({
      data: {
        clientId: `client_${Math.random().toString(36).slice(2, 10)}`,
        name: data.name,
        redirectUris: data.redirectUris,
        scopes: data.scopes,
        type: data.type,
        sectorIdentifier: data.sectorIdentifier ?? null,
        verifiedPartner: data.verifiedPartner ?? false,
        tier: data.tier ?? 'sandbox',
      },
    });
  }

  async listClients() {
    return this.prisma.oidcClient.findMany({ select: { id: true, clientId: true, name: true, type: true, verifiedPartner: true, tier: true, createdAt: true } });
  }
}
