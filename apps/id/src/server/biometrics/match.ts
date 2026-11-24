import { db } from "../db";
import { env } from "../env";
import { applyTransform, openTemplate, similarity } from "./template";

export type Match = { identityId: string; score: number };

/**
 * 1:N search — "does this face already own an AmarID?"
 *
 * This is what makes one person = one ID hold even when someone turns up with
 * a second document and a second SIM. The probe is transformed with the same
 * key as the stored templates and compared in memory; nothing is written.
 *
 * Scale note: a linear scan is correct and fast enough for a pilot (about a
 * microsecond per comparison). At national scale the same comparison runs
 * behind an approximate-nearest-neighbour index inside a secure enclave; the
 * interface of this function does not change.
 */
export async function findDuplicate(embedding: Float32Array, excludeIdentityId?: string): Promise<Match | null> {
  const probe = applyTransform(embedding);
  const threshold = env().faceMatchThreshold;
  let best: Match | null = null;
  let cursor: string | undefined;

  for (;;) {
    const page = await db.faceTemplate.findMany({
      take: 500,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, identityId: true, sealed: true },
    });
    if (page.length === 0) break;
    for (const row of page) {
      if (row.identityId === excludeIdentityId) continue;
      const score = similarity(probe, openTemplate(row.sealed, row.identityId));
      if (score >= threshold && (!best || score > best.score)) best = { identityId: row.identityId, score };
    }
    cursor = page[page.length - 1]!.id;
  }
  return best;
}

/** 1:1 check — "is this the person who owns this AmarID?" Returns the best score. */
export async function matchIdentity(embedding: Float32Array, identityId: string): Promise<{ matched: boolean; score: number }> {
  const probe = applyTransform(embedding);
  const templates = await db.faceTemplate.findMany({ where: { identityId }, select: { sealed: true } });
  let score = 0;
  for (const t of templates) score = Math.max(score, similarity(probe, openTemplate(t.sealed, identityId)));
  return { matched: score >= env().faceMatchThreshold, score };
}
