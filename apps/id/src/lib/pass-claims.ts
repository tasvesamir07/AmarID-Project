// Facts a citizen can put on a verification pass. Each is the smallest
// statement that answers a real question a platform asks.

export const PASS_CLAIMS = ["real_person", "age_over_18", "bangladesh_id_holder", "recently_verified", "name"] as const;
export type PassClaim = (typeof PASS_CLAIMS)[number];

export const PASS_DURATIONS = [15, 60, 24 * 60, 7 * 24 * 60] as const; // minutes

export const isPassClaim = (v: string): v is PassClaim => (PASS_CLAIMS as readonly string[]).includes(v);
