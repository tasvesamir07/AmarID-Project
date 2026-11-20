import { PrismaClient, IdentityStatus, AssuranceLevel, EnrollmentState, EkycLevel, EkycStatus, Consent } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AmarID demo data...');

  // Partner OIDC clients
  const bazar = await prisma.oidcClient.upsert({
    where: { clientId: 'bazar-local' },
    update: {},
    create: {
      clientId: 'bazar-local',
      name: 'Bazar Local (Demo E-commerce)',
      secretHash: 'dev-hash',
      redirectUris: ['http://localhost:3001/callback'],
      scopes: ['openid', 'profile.name', 'age.over_18', 'contact.phone_verified', 'uniqueness.promo', 'status.active'],
      type: 'confidential',
      sectorIdentifier: 'bazar-local',
      verifiedPartner: true,
      tier: 'sandbox',
    },
  });

  const bank = await prisma.oidcClient.upsert({
    where: { clientId: 'probashi-bank' },
    update: {},
    create: {
      clientId: 'probashi-bank',
      name: 'Probashi Bank (Demo)',
      secretHash: 'dev-hash',
      redirectUris: ['http://localhost:3001/bank-callback'],
      scopes: ['openid', 'profile.name', 'age.over_18', 'contact.phone_verified', 'kyc.level', 'status.active'],
      type: 'confidential',
      sectorIdentifier: 'probashi-bank',
      verifiedPartner: true,
      tier: 'regulated',
    },
  });

  // Citizens
  const c1 = await prisma.identity.create({
    data: {
      universalId: 'AID-7K4M-ABCD-92QX',
      docHmac: 'demo-hmac-nid-001',
      status: IdentityStatus.ACTIVE,
      assuranceLevel: AssuranceLevel.LOA3,
      issuedAt: new Date(),
      nextProofOfLifeDueAt: new Date(Date.now() + 365 * 86400000),
    },
  });

  const c2 = await prisma.identity.create({
    data: {
      universalId: 'AID-P9R2-WXYZ-11QA',
      docHmac: 'demo-hmac-nid-002',
      status: IdentityStatus.ACTIVE,
      assuranceLevel: AssuranceLevel.LOA2,
      issuedAt: new Date(),
      nextProofOfLifeDueAt: new Date(Date.now() + 300 * 86400000),
    },
  });

  const c3 = await prisma.identity.create({
    data: {
      universalId: 'AID-D4F5-GHIJ-77ZB',
      docHmac: 'demo-hmac-nid-003',
      status: IdentityStatus.DORMANT,
      assuranceLevel: AssuranceLevel.LOA1,
      issuedAt: new Date(),
      nextProofOfLifeDueAt: new Date(Date.now() - 10 * 86400000), // overdue
    },
  });

  // Consents (c1 -> bazar)
  await prisma.consent.create({
    data: { identityId: c1.id, clientId: bazar.id, scopes: ['openid', 'profile.name', 'age.over_18', 'uniqueness.promo'], grantedAt: new Date() },
  });

  // eKYC request (c1 -> bank)
  await prisma.ekycRequest.create({
    data: { clientId: bank.id, identityId: c1.id, level: EkycLevel.STANDARD, status: EkycStatus.APPROVED, expiresAt: new Date(Date.now() + 30 * 86400000) },
  });

  // Audit genesis
  await prisma.auditLog.create({
    data: { action: 'SEED', subjectPseudonym: 'system', metadata: { note: 'demo seed' }, prevHash: 'genesis', hash: 'genesis-hash' },
  });

  console.log('Seed complete.');
  console.log('Citizen 1:', c1.universalId, c1.id);
  console.log('Citizen 2:', c2.universalId, c2.id);
  console.log('Citizen 3 (dormant):', c3.universalId, c3.id);
  console.log('Client bazar-local:', bazar.clientId);
  console.log('Client probashi-bank:', bank.clientId);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
