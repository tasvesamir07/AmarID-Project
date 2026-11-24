import { api } from "@/server/http";
import { walletData } from "@/server/me";
import { requireSession } from "@/server/session";

export const GET = api(async () => walletData(await requireSession()));
