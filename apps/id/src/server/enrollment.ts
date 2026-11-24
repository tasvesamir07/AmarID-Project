import { randomUUID } from "node:crypto";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import type { Enrollment } from "@/generated/prisma/client";
import type { LivenessChallenge } from "@/lib/liveness";
import { maskMsisdn, type DocType } from "@/lib/validation";
import { civilRegistry, simRegistry } from "./adapters";
import { audit, auditIn } from "./audit";
import { issueLivenessChallenge, verifyLivenessEvidence } from "./biometrics/liveness";
import { findDuplicate } from "./biometrics/match";
import { protectTemplate, rebindTemplate, TRANSFORM_VERSION } from "./biometrics/template";
import { openText, seal } from "./crypto/seal";
import { blindIndex, randomToken, sha256 } from "./crypto/tokens";
import { db } from "./db";
import { AppError } from "./errors";
import { newUniversalId, nextLivenessDue, sealContext } from "./identity";
import { sendOtp, verifyOtp } from "./otp";
import { rateLimit } from "./ratelimit";
import { clearCookie, createSession, readCookie, setCookie } from "./session";
import { deviceLabel, registrationOptions, verifyRegistration } from "./webauthn";

/**
 * Enrollment: document → SIM → face → device, then issue.
 *
 * Each step is only reachable from the one before it, and the whole attempt is
 * bound to an HttpOnly cookie — knowing an enrollment id grants nothing.
 *
 * Nothing is told to the caller about *other* people until they have proven a
 * document, a SIM and a live face: "this document already has an AmarID" is
 * only revealed at the face step, so the first form cannot be used to probe
 * who is enrolled.
 */

const COOKIE = "amarid_enroll";
const TTL_MS = 45 * 60_000;

const ctx = {
  name: (id: string) => `enrollment:${id}:name`,
  dob: (id: string) => `enrollment:${id}:dob`,
  phone: (id: string) => `enrollment:${id}:phone`,
};

export type EnrollmentView = {
  state: Enrollment["state"];
  name: string;
  docType: DocType;
  phone: string | null;
  phoneVerified: boolean;
  expiresAt: string;
};

function view(e: Enrollment): EnrollmentView {
  return {
    state: e.state,
    name: openText(e.nameSealed, ctx.name(e.id)),
    docType: e.docType as DocType,
    phone: e.phoneSealed ? maskMsisdn(openText(e.phoneSealed, ctx.phone(e.id))) : null,
    phoneVerified: e.state !== "DOCUMENT_VERIFIED",
    expiresAt: e.expiresAt.toISOString(),
  };
}

async function current(): Promise<Enrollment | null> {
  const token = await readCookie(COOKIE);
  if (!token) return null;
  const e = await db.enrollment.findUnique({ where: { tokenHash: sha256(token) } });
  if (!e || e.expiresAt < new Date() || e.state === "REJECTED" || e.state === "ISSUED") return null;
  return e;
}

async function requireCurrent(...states: Enrollment["state"][]): Promise<Enrollment> {
  const e = await current();
  if (!e) throw new AppError("ENROLLMENT_EXPIRED", 409);
  if (!states.includes(e.state)) throw new AppError("ENROLLMENT_WRONG_STEP", 409, undefined, { state: e.state });
  return e;
}

async function reject(e: Enrollment, reason: string, detail: Record<string, string | number> = {}): Promise<void> {
  await db.$transaction(async (tx) => {
    // Drop everything collected so far; a rejected attempt keeps no personal data.
    await tx.enrollment.update({
      where: { id: e.id },
      data: { state: "REJECTED", rejectedReason: reason, faceSealed: null, phoneSealed: null, phoneIndex: null },
    });
    await auditIn(tx, {
      type: reason === "DUPLICATE_PERSON" ? "enrollment.duplicate_blocked" : "enrollment.rejected",
      detail: { enrollment: e.id, reason, ...detail },
    });
  });
  await clearCookie(COOKIE);
}

export async function getEnrollment(): Promise<EnrollmentView | null> {
  const e = await current();
  return e ? view(e) : null;
}

export async function cancelEnrollment(): Promise<void> {
  const e = await current();
  if (e) await db.enrollment.delete({ where: { id: e.id } });
  await clearCookie(COOKIE);
}

/**
 * Step 1 — the document is checked against the civil registry and the SIM
 * against the SIM registry (it must be registered to the document holder),
 * then a one-time code is sent to that SIM.
 *
 * The document number is used for these two lookups and then discarded: only
 * its blind index is kept.
 */
export async function startEnrollment(input: { docType: DocType; docNumber: string; fullName: string; dob: string; msisdn: string; ip: string }): Promise<EnrollmentView> {
  await rateLimit(`enroll:ip:${input.ip}`, 15, 3600);

  const verdict = await civilRegistry().verify(input);
  if (!verdict.ok) {
    await audit({ type: "enrollment.rejected", detail: { reason: verdict.reason, docType: input.docType } });
    throw new AppError(verdict.reason, 422);
  }
  const sim = await simRegistry().ownerMatches(input.msisdn, input.docType, input.docNumber);
  if (!sim.ok) {
    await audit({ type: "enrollment.rejected", detail: { reason: "SIM_NOT_YOURS", docType: input.docType } });
    throw new AppError("SIM_NOT_YOURS", 422);
  }

  const previous = await current();
  if (previous) await db.enrollment.delete({ where: { id: previous.id } });

  const id = randomUUID();
  const token = randomToken();
  const e = await db.enrollment.create({
    data: {
      id,
      tokenHash: sha256(token),
      state: "DOCUMENT_VERIFIED",
      docType: input.docType,
      docIndex: blindIndex("doc", `${input.docType}:${input.docNumber}`),
      nameSealed: seal(input.fullName, ctx.name(id)),
      dobSealed: seal(input.dob, ctx.dob(id)),
      phoneIndex: blindIndex("phone", input.msisdn),
      phoneSealed: seal(input.msisdn, ctx.phone(id)),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  await setCookie(COOKIE, token, TTL_MS / 1000);
  await audit({ type: "enrollment.started", detail: { enrollment: id, docType: input.docType } });
  await sendOtp({ subject: id, msisdn: input.msisdn, ip: input.ip });
  return view(e);
}

/** Step 2a — send a new code to the same SIM. */
export async function resendPhoneCode(ip: string): Promise<{ expiresAt: string }> {
  const e = await requireCurrent("DOCUMENT_VERIFIED");
  return sendOtp({ subject: e.id, msisdn: openText(e.phoneSealed!, ctx.phone(e.id)), ip });
}

/** Step 2b — the citizen proves they hold the SIM. */
export async function confirmPhoneCode(code: string): Promise<EnrollmentView> {
  const e = await requireCurrent("DOCUMENT_VERIFIED");
  if (!e.phoneSealed) throw new AppError("ENROLLMENT_WRONG_STEP", 409);
  await verifyOtp({ subject: e.id, msisdn: openText(e.phoneSealed, ctx.phone(e.id)), code });
  return view(await db.enrollment.update({ where: { id: e.id }, data: { state: "PHONE_VERIFIED" } }));
}

/** Step 3a — a fresh, unpredictable liveness challenge. */
export async function enrollmentLivenessChallenge(): Promise<LivenessChallenge> {
  const e = await requireCurrent("PHONE_VERIFIED", "FACE_VERIFIED");
  return issueLivenessChallenge(e.id);
}

/**
 * Step 3b — liveness, then the two uniqueness checks:
 *   1. this document does not already own an AmarID, and
 *   2. this face does not already own an AmarID under another document.
 */
export async function completeEnrollmentLiveness(evidence: unknown): Promise<EnrollmentView> {
  const e = await requireCurrent("PHONE_VERIFIED", "FACE_VERIFIED");
  const { embedding } = await verifyLivenessEvidence(e.id, evidence);

  if (await db.identity.findUnique({ where: { docIndex: e.docIndex }, select: { id: true } })) {
    await reject(e, "ALREADY_ENROLLED");
    throw new AppError("ALREADY_ENROLLED", 409);
  }

  const duplicate = await findDuplicate(embedding);
  if (duplicate) {
    // The score band is logged for the fraud team; the other person's identity is not revealed to the applicant.
    await reject(e, "DUPLICATE_PERSON", { scoreBand: duplicate.score >= 0.8 ? "high" : "medium" });
    throw new AppError("DUPLICATE_PERSON", 409);
  }

  const updated = await db.enrollment.update({
    where: { id: e.id },
    data: { state: "FACE_VERIFIED", faceSealed: protectTemplate(embedding, e.id) },
  });
  return view(updated);
}

/** Step 4a — options for creating the passkey that will sign this person in from now on. */
export async function enrollmentPasskeyOptions() {
  const e = await requireCurrent("FACE_VERIFIED");
  const identityId = randomUUID();
  const universalId = newUniversalId();
  return registrationOptions({ subject: e.id, userId: identityId, universalId, extra: { identityId, universalId } });
}

/** Step 4b — verify the passkey and issue the identity, atomically. */
export async function issueIdentity(response: RegistrationResponseJSON, userAgent: string | null): Promise<{ universalId: string }> {
  const e = await requireCurrent("FACE_VERIFIED");
  if (!e.faceSealed || !e.phoneSealed || !e.phoneIndex) throw new AppError("ENROLLMENT_WRONG_STEP", 409);

  const { credential, data } = await verifyRegistration(e.id, response);
  const identityId = String(data.identityId);
  const universalId = String(data.universalId);
  const now = new Date();

  try {
    await db.$transaction(async (tx) => {
      await tx.identity.create({
        data: {
          id: identityId,
          universalId,
          docType: e.docType,
          docIndex: e.docIndex,
          nameSealed: seal(openText(e.nameSealed, ctx.name(e.id)), sealContext.name(identityId)),
          dobSealed: seal(openText(e.dobSealed, ctx.dob(e.id)), sealContext.dob(identityId)),
          issuedAt: now,
          lastLivenessAt: now,
          livenessDueAt: nextLivenessDue(now),
          phones: {
            create: {
              phoneIndex: e.phoneIndex!,
              phoneSealed: seal(openText(e.phoneSealed!, ctx.phone(e.id)), sealContext.phone(identityId)),
            },
          },
          faceTemplates: { create: { sealed: rebindTemplate(e.faceSealed!, e.id, identityId), transformVersion: TRANSFORM_VERSION } },
          passkeys: { create: { ...credential, label: deviceLabel(userAgent), lastUsedAt: now } },
        },
      });
      // The enrollment keeps only the outcome; collected attributes are erased.
      await tx.enrollment.update({
        where: { id: e.id },
        data: { state: "ISSUED", identityId, faceSealed: null, phoneSealed: null, phoneIndex: null },
      });
      await auditIn(tx, { type: "identity.issued", identityId, detail: { docType: e.docType, checks: ["document", "sim", "face_liveness", "face_unique", "passkey"] } });
    });
  } catch (error) {
    // A unique constraint here means the same document or SIM was issued in a parallel attempt.
    if ((error as { code?: string }).code === "P2002") {
      await reject(e, "ALREADY_ENROLLED");
      throw new AppError("ALREADY_ENROLLED", 409);
    }
    throw error;
  }

  await clearCookie(COOKIE);
  await createSession({ identityId, amr: ["face", "hwk", "user"], userAgent });
  return { universalId };
}

/** The phone number of the enrollment in progress — used only by the sandbox inbox. */
export async function enrollmentPhone(): Promise<string | null> {
  const e = await current();
  return e?.phoneSealed ? openText(e.phoneSealed, ctx.phone(e.id)) : null;
}
