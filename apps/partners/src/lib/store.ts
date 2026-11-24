// The partners' own databases, kept in memory because this is a demo. A restart
// clears them. Nothing here is AmarID data.

type Store = {
  /** Bazar: coupon claims keyed the old way, by phone number. */
  couponByPhone: Map<string, number>;
  /** Bazar: coupon claims keyed by the AmarID pairwise subject. */
  couponBySub: Map<string, number>;
  /** Bank: accounts keyed by the AmarID pairwise subject. */
  bankAccounts: Map<string, { number: string; openedAt: number; seconds: number }>;
};

const g = globalThis as unknown as { partnerStore?: Store };
export const store: Store = (g.partnerStore ??= { couponByPhone: new Map(), couponBySub: new Map(), bankAccounts: new Map() });

export const COUPON = { code: "WELCOME200", amount: 200 };
