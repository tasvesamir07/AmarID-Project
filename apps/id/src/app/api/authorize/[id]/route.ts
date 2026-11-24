import { z } from "zod";
import { SCOPES } from "@/lib/scopes";
import { AppError } from "@/server/errors";
import { api, readJson } from "@/server/http";
import { decideAuthorization, loadAuthorization } from "@/server/oidc/provider";
import { requireSession } from "@/server/session";

/** The decision of the signed-in person on a sign-in request from a partner. */
export const POST = api<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const auth = await requireSession();
  const pending = await loadAuthorization((await params).id);
  if (!pending) throw new AppError("AUTHORIZATION_EXPIRED", 410);
  const decision = await readJson(req, z.object({ approve: z.boolean(), scopes: z.array(z.enum(SCOPES)).default([]) }));
  return { redirectTo: await decideAuthorization(pending, auth, decision) };
});
