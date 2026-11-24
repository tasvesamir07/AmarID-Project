// The partners' own databases, kept in memory because this is a demo. A restart
// clears them. Nothing here is AmarID data.

type Store = {
  /** Shop: voucher claims keyed the old way, by phone number. */
  voucherByPhone: Map<string, number>;
  /** Shop: voucher claims keyed by the AmarID pairwise subject. */
  voucherBySub: Map<string, number>;
  /** Wallet: accounts keyed by the AmarID pairwise subject. */
  walletAccounts: Map<string, { openedAt: number; seconds: number }>;
  /** Verification abroad: completed checks keyed by the AmarID pairwise subject. */
  checks: Map<string, { reference: string; at: number; seconds: number }>;
};

const g = globalThis as unknown as { partnerStore2?: Store };
export const store: Store = (g.partnerStore2 ??= { voucherByPhone: new Map(), voucherBySub: new Map(), walletAccounts: new Map(), checks: new Map() });

export const VOUCHER = { code: "NEWUSER200", amount: 200 };
