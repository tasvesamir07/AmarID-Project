import { api } from "@/server/http";
import { destroySession } from "@/server/session";

export const POST = api(async () => {
  await destroySession();
});
