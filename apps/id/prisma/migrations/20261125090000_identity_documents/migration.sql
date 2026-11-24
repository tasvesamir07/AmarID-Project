-- Documents a person verified after enrollment (for example a passport added
-- to an identity that was opened with an NID). Like the enrollment document,
-- only a keyed blind index of the number is kept.
CREATE TABLE "IdentityDocument" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "docType" "DocType" NOT NULL,
    "docIndex" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdentityDocument_docIndex_key" ON "IdentityDocument"("docIndex");
CREATE UNIQUE INDEX "IdentityDocument_identityId_docType_key" ON "IdentityDocument"("identityId", "docType");

ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
