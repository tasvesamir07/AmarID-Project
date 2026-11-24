// Universal ID format: AID-XXXX-XXXX-XXXC
//  * 11 random Crockford base-32 symbols (55 bits) — no I, L, O, U, so it can
//    be read aloud and typed without ambiguity.
//  * 1 check symbol (Luhn mod 32) — a single mistyped or two swapped symbols
//    are caught in the browser before any request is made.
//  * It encodes nothing about the person: not the NID, not the date of birth,
//    not the district. It is safe to print on a card.
//
// Shared by server and browser, so it must stay free of Node-only imports.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const N = ALPHABET.length;

function checkSymbol(payload: string): string {
  let factor = 2;
  let sum = 0;
  for (let i = payload.length - 1; i >= 0; i--) {
    const addend = factor * ALPHABET.indexOf(payload[i]!);
    factor = factor === 2 ? 1 : 2;
    sum += Math.floor(addend / N) + (addend % N);
  }
  return ALPHABET[(N - (sum % N)) % N]!;
}

/** Builds an ID from 11 values in 0..31 (the caller supplies the randomness). */
export function universalIdFrom(values: ArrayLike<number>): string {
  let payload = "";
  for (let i = 0; i < 11; i++) payload += ALPHABET[values[i]! % N];
  return format(payload + checkSymbol(payload));
}

function format(raw: string): string {
  return `AID-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/** Accepts what people actually type: lower case, spaces, missing dashes, O for 0, I/L for 1. */
export function normalizeUniversalId(input: string): string | null {
  const raw = input
    .toUpperCase()
    .replace(/^AID/, "")
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
  if (raw.length !== 12) return null;
  for (const ch of raw) if (!ALPHABET.includes(ch)) return null;
  if (checkSymbol(raw.slice(0, 11)) !== raw[11]) return null;
  return format(raw);
}

/** AID-7K4M-••••-92QX — enough to recognise your own ID, not enough to copy it. */
export function maskUniversalId(id: string): string {
  return id.replace(/^(AID-[0-9A-Z]{4})-[0-9A-Z]{4}-([0-9A-Z]{4})$/, "$1-••••-$2");
}
