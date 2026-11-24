// Input rules shared by the forms and the API, so both agree on what is valid.

export type DocType = "NID" | "PASSPORT";

/** Bangladesh NID: 10 digits (smart card), 13 or 17 digits (older laminated cards). */
export function normalizeDocNumber(type: DocType, input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]/g, "");
  if (type === "NID") return /^(\d{10}|\d{13}|\d{17})$/.test(raw) ? raw : null;
  // Bangladesh passports are nine characters: e-passports are one letter and
  // eight digits, machine-readable passports two letters and seven digits.
  return /^([A-Z]\d{8}|[A-Z]{2}\d{7})$/.test(raw) ? raw : null;
}

/** Returns the number as 8801XXXXXXXXX, or null if it is not a Bangladeshi mobile number. */
export function normalizeMsisdn(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits;
  return /^01[3-9]\d{8}$/.test(local) ? `88${local}` : null;
}

export const formatMsisdn = (msisdn: string) =>
  msisdn.replace(/^880(\d{4})(\d{6})$/, "+880 $1-$2");

/** +880 17••-•••456 */
export const maskMsisdn = (msisdn: string) =>
  msisdn.replace(/^880(\d{2})\d{5}(\d{3})$/, "+880 $1••-•••$2");

export function normalizeName(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** YYYY-MM-DD, a real calendar date, not in the future, not before 1900. */
export function isValidDob(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input) return false;
  return date.getTime() <= Date.now() && date.getUTCFullYear() >= 1900;
}

export function ageOn(dob: string, at: Date = new Date()): number {
  const [y, m, d] = dob.split("-").map(Number) as [number, number, number];
  let age = at.getUTCFullYear() - y;
  const beforeBirthday =
    at.getUTCMonth() + 1 < m || (at.getUTCMonth() + 1 === m && at.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}
