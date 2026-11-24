import { completeEnrollmentLiveness, enrollmentLivenessChallenge } from "@/server/enrollment";
import { api } from "@/server/http";

export const POST = api(async () => enrollmentLivenessChallenge());

export const PUT = api(async (req) => ({ enrollment: await completeEnrollmentLiveness(await req.json().catch(() => null)) }));
