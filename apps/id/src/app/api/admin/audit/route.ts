import { requireAdmin } from "@/server/admin";
import { verifyAuditChain } from "@/server/audit";
import { api } from "@/server/http";

/** Re-computes every hash in the activity log and reports the first break, if any. */
export const POST = api(async () => {
  await requireAdmin();
  return verifyAuditChain();
});
