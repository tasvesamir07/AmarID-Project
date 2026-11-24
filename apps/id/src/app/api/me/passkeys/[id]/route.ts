import { api } from "@/server/http";
import { revokePasskey } from "@/server/me";
import { requireSession } from "@/server/session";

export const DELETE = api<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  await revokePasskey(await requireSession(), (await params).id);
});
