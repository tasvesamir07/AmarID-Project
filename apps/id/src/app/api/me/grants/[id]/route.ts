import { api } from "@/server/http";
import { revokeGrant } from "@/server/oidc/provider";
import { requireSession } from "@/server/session";

export const DELETE = api<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const auth = await requireSession();
  await revokeGrant(auth.identity.id, (await params).id);
});
