import { api } from "@/server/http";
import { sandboxInbox } from "@/server/sandbox";

export const GET = api(async () => ({ inbox: await sandboxInbox() }));
