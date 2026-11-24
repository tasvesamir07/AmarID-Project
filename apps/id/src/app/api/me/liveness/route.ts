import { api } from "@/server/http";
import { completeProofOfLife, proofOfLifeChallenge } from "@/server/proof-of-life";
import { requireSession } from "@/server/session";

export const POST = api(async () => proofOfLifeChallenge(await requireSession()));

export const PUT = api(async (req) => completeProofOfLife(await requireSession(), await req.json().catch(() => null)));
