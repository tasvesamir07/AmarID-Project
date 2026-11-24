-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('ACTIVE', 'DORMANT', 'SUSPENDED', 'DECEASED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('NID', 'PASSPORT');

-- CreateEnum
CREATE TYPE "EnrollmentState" AS ENUM ('DOCUMENT_VERIFIED', 'PHONE_VERIFIED', 'FACE_VERIFIED', 'ISSUED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ChallengeKind" AS ENUM ('OTP', 'LIVENESS', 'WEBAUTHN_REGISTRATION', 'WEBAUTHN_AUTHENTICATION', 'AUTHORIZATION_REQUEST', 'RECOVERY');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('CONFIDENTIAL', 'PUBLIC');

-- CreateTable
CREATE TABLE "Identity" (
    "id" UUID NOT NULL,
    "universalId" TEXT NOT NULL,
    "status" "IdentityStatus" NOT NULL DEFAULT 'ACTIVE',
    "docType" "DocType" NOT NULL,
    "docIndex" TEXT NOT NULL,
    "nameSealed" BYTEA NOT NULL,
    "dobSealed" BYTEA NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLivenessAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "livenessDueAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceTemplate" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "sealed" BYTEA NOT NULL,
    "transformVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phone" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "phoneIndex" TEXT NOT NULL,
    "phoneSealed" BYTEA NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "identityId" UUID NOT NULL,
    "amr" TEXT[],
    "authAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "state" "EnrollmentState" NOT NULL,
    "docType" "DocType" NOT NULL,
    "docIndex" TEXT NOT NULL,
    "nameSealed" BYTEA NOT NULL,
    "dobSealed" BYTEA NOT NULL,
    "phoneIndex" TEXT,
    "phoneSealed" BYTEA,
    "faceSealed" BYTEA,
    "rejectedReason" TEXT,
    "identityId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" UUID NOT NULL,
    "kind" "ChallengeKind" NOT NULL,
    "subject" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateBucket_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateTable
CREATE TABLE "SigningKey" (
    "kid" TEXT NOT NULL,
    "alg" TEXT NOT NULL,
    "publicJwk" JSONB NOT NULL,
    "privateSealed" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "SigningKey_pkey" PRIMARY KEY ("kid")
);

-- CreateTable
CREATE TABLE "OidcClient" (
    "id" UUID NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Service',
    "type" "ClientType" NOT NULL,
    "secretHash" TEXT,
    "redirectUris" TEXT[],
    "allowedScopes" TEXT[],
    "sector" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OidcClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "scopes" TEXT[],
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCode" (
    "codeHash" TEXT NOT NULL,
    "grantId" UUID NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[],
    "nonce" TEXT,
    "codeChallenge" TEXT NOT NULL,
    "authTime" TIMESTAMP(3) NOT NULL,
    "amr" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("codeHash")
);

-- CreateTable
CREATE TABLE "VerificationPass" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "claims" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "checks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VerificationPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "seq" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "identityId" UUID,
    "clientId" TEXT,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "prevHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "RegistryPerson" (
    "id" UUID NOT NULL,
    "docType" "DocType" NOT NULL,
    "docNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistryPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrySim" (
    "msisdn" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "operator" TEXT NOT NULL,

    CONSTRAINT "RegistrySim_pkey" PRIMARY KEY ("msisdn")
);

-- CreateTable
CREATE TABLE "SandboxMessage" (
    "id" UUID NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SandboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Identity_universalId_key" ON "Identity"("universalId");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_docIndex_key" ON "Identity"("docIndex");

-- CreateIndex
CREATE INDEX "FaceTemplate_identityId_idx" ON "FaceTemplate"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "Phone_phoneIndex_key" ON "Phone"("phoneIndex");

-- CreateIndex
CREATE INDEX "Phone_identityId_idx" ON "Phone"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_identityId_idx" ON "Passkey"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_identityId_idx" ON "Session"("identityId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_tokenHash_key" ON "Enrollment"("tokenHash");

-- CreateIndex
CREATE INDEX "Enrollment_expiresAt_idx" ON "Enrollment"("expiresAt");

-- CreateIndex
CREATE INDEX "Challenge_kind_subject_idx" ON "Challenge"("kind", "subject");

-- CreateIndex
CREATE INDEX "Challenge_expiresAt_idx" ON "Challenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OidcClient_clientId_key" ON "OidcClient"("clientId");

-- CreateIndex
CREATE INDEX "Grant_identityId_idx" ON "Grant"("identityId");

-- CreateIndex
CREATE INDEX "Grant_clientId_idx" ON "Grant"("clientId");

-- CreateIndex
CREATE INDEX "VerificationPass_identityId_idx" ON "VerificationPass"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_hash_key" ON "AuditEvent"("hash");

-- CreateIndex
CREATE INDEX "AuditEvent_identityId_seq_idx" ON "AuditEvent"("identityId", "seq");

-- CreateIndex
CREATE INDEX "AuditEvent_type_idx" ON "AuditEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RegistryPerson_docType_docNumber_key" ON "RegistryPerson"("docType", "docNumber");

-- CreateIndex
CREATE INDEX "SandboxMessage_to_createdAt_idx" ON "SandboxMessage"("to", "createdAt");

-- AddForeignKey
ALTER TABLE "FaceTemplate" ADD CONSTRAINT "FaceTemplate_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phone" ADD CONSTRAINT "Phone_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OidcClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationPass" ADD CONSTRAINT "VerificationPass_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrySim" ADD CONSTRAINT "RegistrySim_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "RegistryPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
