// What a partner can ask for. Shared by the provider, the consent screen and
// the partner console, so all three describe a scope the same way.

export const SCOPES = ["openid", "nid", "passport", "age", "nationality", "profile", "birthdate", "phone", "kyc"] as const;
export type Scope = (typeof SCOPES)[number];

export type ScopeInfo = {
  /** Claims released for this scope. */
  claims: string[];
  /** Cannot be declined: without it there is no sign-in. */
  required?: boolean;
  /** Reveals a personal attribute, as opposed to a yes/no fact or a pseudonym. */
  personal: boolean;
  /** Only for partners that are legally required to know their customer. */
  regulated?: boolean;
  /**
   * The partner requires the person to hold a verified document of this type.
   * The person must verify one with AmarID before they can continue; the
   * partner then learns that it exists, never its number.
   */
  document?: "NID" | "PASSPORT";
};

export const SCOPE_INFO: Record<Scope, ScopeInfo> = {
  openid: { claims: ["sub", "amarid_unique", "amarid_liveness_date"], required: true, personal: false },
  nid: { claims: ["nid_verified"], required: true, personal: false, document: "NID" },
  passport: { claims: ["passport_verified"], required: true, personal: false, document: "PASSPORT" },
  age: { claims: ["age_over_18"], personal: false },
  nationality: { claims: ["nationalities"], personal: false },
  profile: { claims: ["name"], personal: true },
  birthdate: { claims: ["birthdate"], personal: true, regulated: true },
  phone: { claims: ["phone_number", "phone_number_verified"], personal: true, regulated: true },
  kyc: { claims: ["verified_claims"], personal: true, regulated: true },
};

export const isScope = (value: string): value is Scope => (SCOPES as readonly string[]).includes(value);

export function parseScopes(value: string | null | undefined): Scope[] {
  const seen = new Set<Scope>();
  for (const part of (value ?? "").split(/\s+/)) if (isScope(part)) seen.add(part);
  return SCOPES.filter((s) => seen.has(s));
}
