import { api } from "@/server/http";
import { passToken, revokePass } from "@/server/passes";
import { requireSession } from "@/server/session";

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  const auth = await requireSession();
  return { token: await passToken(auth.identity.id, (await params).id) };
});

export const DELETE = api<Ctx>(async (_req, { params }) => {
  const auth = await requireSession();
  await revokePass(auth.identity.id, (await params).id);
});
