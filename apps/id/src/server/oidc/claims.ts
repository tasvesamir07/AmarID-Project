import { createHmac } from "node:crypto";
import type { Identity, OidcClient } from "@/generated/prisma/client";
import type { Scope } from "@/lib/scopes";
import { formatMsisdn } from "@/lib/validation";
import { deriveKey } from "../crypto/keys";
import { openText } from "../crypto/seal";
import { db } from "../db";
import { holdsDocument } from "../documents";
import { env } from "../env";
import { profileOf, sealContext } from "../identity";

/**
 * Pairwise subject: each partner sector gets a different, stable pseudonym for
 * the same person.
 *
 *  - Stable per partner → the partner can enforce "one account / one coupon
 *    per real person", whatever phone or email the person signs up with.
 *  - Different across partners → two partners comparing their user tables
 *    cannot link the same person, and none of them learns the Universal ID.
 */
export function pairwiseSubject(identityId: string, sector: string): string {
  return createHmac("sha256", deriveKey("pairwise-subject")).update(`${sector}\n${identityId}`).digest("base64url");
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Claims for the scopes the citizen approved — and nothing else. */
export async function claimsFor(identity: Identity, client: OidcClient, scopes: Scope[]): Promise<Record<string, unknown>> {
  const profile = profileOf(identity);
  const claims: Record<string, unknown> = {
    sub: pairwiseSubject(identity.id, client.sector),
    // Facts every partner gets with sign-in. None of them identifies the person.
    amarid_unique: true,
    amarid_liveness_date: day(identity.lastLivenessAt),
  };

  // "Holds a verified NID / passport": a yes, released only when it is true.
  // The document number is not in the database, so it cannot be released.
  if (scopes.includes("nid") && (await holdsDocument(identity, "NID"))) claims.nid_verified = true;
  if (scopes.includes("passport") && (await holdsDocument(identity, "PASSPORT"))) claims.passport_verified = true;

  if (scopes.includes("age")) claims.age_over_18 = profile.age >= 18; // a yes/no, not the birth date
  // Every AmarID is backed by a Bangladeshi civil record, so this is a fact about
  // the scheme, not a lookup: it lets a foreign service confirm nationality
  // without seeing a passport.
  if (scopes.includes("nationality")) claims.nationalities = ["BD"];
  if (scopes.includes("profile")) claims.name = profile.name;
  if (scopes.includes("birthdate")) claims.birthdate = profile.dob;

  if (scopes.includes("phone")) {
    const phone = await db.phone.findFirst({ where: { identityId: identity.id }, orderBy: { verifiedAt: "desc" } });
    if (phone) {
      claims.phone_number = formatMsisdn(openText(phone.phoneSealed, sealContext.phone(identity.id))).replace(/[\s-]/g, "");
      claims.phone_number_verified = true;
    }
  }

  if (scopes.includes("kyc")) {
    // Shaped after OpenID Connect for Identity Assurance (`verified_claims`):
    // the partner learns what was verified, how and when — and receives no
    // document number and no document image.
    claims.verified_claims = {
      verification: {
        trust_framework: env().sandbox ? "bd_amarid_sandbox" : "bd_amarid",
        assurance_level: "high",
        time: identity.issuedAt.toISOString(),
        evidence: [
          {
            type: "electronic_record",
            check_details: [{ check_method: "data" }],
            record: { type: identity.docType === "NID" ? "national_id" : "passport", source: { name: env().sandbox ? "Sandbox civil registry" : "Civil registry", country_code: "BD" } },
          },
          { type: "electronic_record", check_details: [{ check_method: "kbv" }], record: { type: "mobile_account", source: { name: env().sandbox ? "Sandbox SIM registry" : "SIM registry", country_code: "BD" } } },
          { type: "biometric", check_details: [{ check_method: "pvr", time: identity.lastLivenessAt.toISOString() }], method: "face_liveness_and_uniqueness" },
        ],
      },
      claims: { name: profile.name, birthdate: profile.dob, nationalities: ["BD"] },
    };
  }

  return claims;
}
