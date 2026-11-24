// End-to-end tests over HTTP against a running identity provider
// (`npm run dev` in another terminal, sandbox mode).
//
// They drive the real routes with a software passkey authenticator and
// synthetic face embeddings, and cover the guarantees the product makes:
// one person → one ID, strict OIDC, consent that can be withdrawn, passes that
// can be revoked, proof of life, and recovery.
import assert from "node:assert/strict";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { VirtualAuthenticator } from "./virtual-authenticator";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const BAZAR_SECRET = process.env.DARAZ_CLIENT_SECRET ?? "";
const BANK_SECRET = process.env.BKASH_CLIENT_SECRET ?? "";
const PARTNERS = process.env.PARTNERS_URL ?? "http://localhost:3001";

/** A browser-like client: cookie jar, same-origin headers, its own network address. */
class Browser {
  private cookies = new Map<string, string>();
  constructor(private readonly ip = `10.${randomInt(256)}.${randomInt(256)}.${randomInt(256)}`) {}

  async request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      method,
      redirect: "manual",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { Origin: BASE } : {}),
        "X-Forwarded-For": this.ip,
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const [name, ...rest] = pair!.split("=");
      const value = rest.join("=");
      if (value === "" || /max-age=0/i.test(line)) this.cookies.delete(name!);
      else this.cookies.set(name!, value);
    }
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, location: res.headers.get("location") };
  }
  get = (path: string) => this.request("GET", path);
  post = (path: string, body?: unknown) => this.request("POST", path, body ?? {});
  put = (path: string, body?: unknown) => this.request("PUT", path, body ?? {});
  del = (path: string) => this.request("DELETE", path);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const digits = (n: number) => Array.from({ length: n }, () => randomInt(10)).join("");
const newNid = () => `${randomInt(1, 10)}${digits(9)}`;
const newPhone = () => `017${digits(8)}`;

/** A synthetic "face": a random point in embedding space. Captures of the same face are that point plus small noise. */
function face(): number[] {
  return Array.from({ length: 1024 }, () => (Math.random() - 0.5) * 1.2);
}
const capture = (f: number[]) => f.map((x) => x + (Math.random() - 0.5) * 0.04);

async function liveness(browser: Browser, path: string, f: number[]) {
  const challenge = await browser.post(path);
  assert.equal(challenge.status, 200, JSON.stringify(challenge.json));
  await sleep(1600); // a real check cannot be completed instantly; the server enforces that
  const peaks: Record<string, number> = { TURN_LEFT: 0.2, TURN_RIGHT: 0.2, OPEN_MOUTH: 0.5, BLINK: 0.7 };
  return browser.put(path, {
    challengeId: challenge.json.challengeId,
    samples: [capture(f), capture(f), capture(f)],
    steps: challenge.json.steps.map((kind: string, i: number) => ({ kind, atMs: 400 + i * 400, peak: peaks[kind] })),
    durationMs: 1600,
    frames: 24,
    antispoof: 0.9,
    liveness: 0.9,
  });
}

async function readCode(browser: Browser): Promise<string> {
  const inbox = await browser.get("/api/sandbox/inbox");
  const body: string = inbox.json.inbox.messages[0].body;
  return /\b(\d{6})\b/.exec(body)![1]!;
}

type Person = { browser: Browser; device: VirtualAuthenticator; face: number[]; nid: string; phone: string; name: string; dob: string; universalId: string };

async function enroll(overrides: Partial<Person> = {}): Promise<{ person: Person; failedAt?: string; code?: string }> {
  const person: Person = {
    browser: new Browser(),
    device: new VirtualAuthenticator(BASE),
    face: face(),
    nid: newNid(),
    phone: newPhone(),
    name: `Test Citizen ${digits(4)}`,
    dob: "1994-05-17",
    universalId: "",
    ...overrides,
  };
  const b = person.browser;
  const start = await b.post("/api/enroll", { docType: "NID", docNumber: person.nid, fullName: person.name, dob: person.dob, phone: person.phone });
  if (start.status !== 200) return { person, failedAt: "start", code: start.json?.error?.code };
  const confirm = await b.post("/api/enroll/code", { code: await readCode(b) });
  if (confirm.status !== 200) return { person, failedAt: "code", code: confirm.json?.error?.code };
  const live = await liveness(b, "/api/enroll/liveness", person.face);
  if (live.status !== 200) return { person, failedAt: "liveness", code: live.json?.error?.code };
  const options = await b.post("/api/enroll/passkey");
  const issued = await b.put("/api/enroll/passkey", person.device.create(options.json.options));
  if (issued.status !== 200) return { person, failedAt: "passkey", code: issued.json?.error?.code };
  person.universalId = issued.json.universalId;
  return { person };
}

async function signIn(person: Person, browser = new Browser()) {
  const options = await browser.post("/api/auth/passkey");
  const res = await browser.put("/api/auth/passkey", { attemptId: options.json.attemptId, response: person.device.get(options.json.options) });
  return { browser, res };
}

const pkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
};

/** Runs the browser half of the code flow and returns the redirect back to the partner. */
async function authorize(browser: Browser, client: { id: string; redirect: string; scope: string }, approve = true, grantScopes?: string[]) {
  const { verifier, challenge } = pkce();
  const state = randomBytes(8).toString("hex");
  const nonce = randomBytes(8).toString("hex");
  const query = new URLSearchParams({ response_type: "code", client_id: client.id, redirect_uri: client.redirect, scope: client.scope, state, nonce, code_challenge: challenge, code_challenge_method: "S256" });
  const begin = await browser.get(`/oauth/authorize?${query}`);
  assert.equal(begin.status, 303);
  const requestId = begin.location!.split("/authorize/")[1]!;
  const decision = await browser.post(`/api/authorize/${requestId}`, { approve, scopes: grantScopes ?? client.scope.split(" ") });
  if (decision.status !== 200 && process.env.DEBUG_E2E) console.error("authorize decision:", decision.status, JSON.stringify(decision.json));
  return { decision, verifier, state, nonce, redirectTo: decision.json?.redirectTo ? new URL(decision.json.redirectTo) : null };
}

async function token(client: { id: string; secret: string; redirect: string }, code: string, verifier: string) {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${client.id}:${client.secret}`).toString("base64")}` },
    body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: client.redirect }),
  });
  return { status: res.status, json: (await res.json()) as any };
}

const bazar = { id: "daraz-demo", secret: BAZAR_SECRET, redirect: `${PARTNERS}/daraz/callback`, scope: "openid age profile" };
const bank = { id: "bkash-demo", secret: BANK_SECRET, redirect: `${PARTNERS}/bkash/callback`, scope: "openid nid profile birthdate phone kyc" };

let alice: Person;

before(async () => {
  const health = await fetch(`${BASE}/.well-known/openid-configuration`).catch(() => null);
  assert.ok(health?.ok, `Identity provider is not reachable at ${BASE}. Start it with "npm run dev".`);
  const { person, failedAt, code } = await enroll();
  assert.equal(failedAt, undefined, `enrollment failed at ${failedAt}: ${code}`);
  alice = person;
});

describe("enrollment", () => {
  it("issues a well-formed Universal ID and signs the person in", async () => {
    assert.match(alice.universalId, /^AID-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    const me = await alice.browser.get("/api/me");
    assert.equal(me.json.profile.name, alice.name);
    assert.equal(me.json.profile.status, "ACTIVE");
    assert.equal(me.json.passkeys.length, 1);
  });

  it("refuses a document whose holder is recorded as deceased", async () => {
    const r = await enroll({ nid: "1000000001", name: "Abdul Karim", dob: "1950-03-12" });
    assert.deepEqual([r.failedAt, r.code], ["start", "HOLDER_DECEASED"]);
  });

  it("refuses a name that does not match the registry record", async () => {
    const r = await enroll({ nid: "1000000002", name: "Someone Else", dob: "1988-07-21" });
    assert.deepEqual([r.failedAt, r.code], ["start", "DOCUMENT_MISMATCH"]);
  });

  it("refuses a SIM registered to another person", async () => {
    const r = await enroll({ phone: "01700000002" });
    assert.deepEqual([r.failedAt, r.code], ["start", "SIM_NOT_YOURS"]);
  });

  it("rejects a wrong one-time code and never returns the code in an API response", async () => {
    const b = new Browser();
    const start = await b.post("/api/enroll", { docType: "NID", docNumber: newNid(), fullName: "Otp Tester", dob: "1990-01-01", phone: newPhone() });
    assert.equal(start.status, 200);
    assert.doesNotMatch(JSON.stringify(start.json), /\b\d{6}\b/);
    const real = await readCode(b);
    const wrong = real === "000000" ? "000001" : "000000";
    const bad = await b.post("/api/enroll/code", { code: wrong });
    assert.equal(bad.json.error.code, "OTP_INCORRECT");
    assert.equal((await b.post("/api/enroll/code", { code: real })).status, 200);
  });

  it("blocks the same person enrolling again with a different document and SIM", async () => {
    const r = await enroll({ face: alice.face });
    assert.deepEqual([r.failedAt, r.code], ["liveness", "DUPLICATE_PERSON"]);
  });

  it("blocks a second identity on the same document", async () => {
    // Same registry record (document, name, birth date), a different SIM and a different face.
    const r = await enroll({ nid: alice.nid, name: alice.name, dob: alice.dob });
    assert.deepEqual([r.failedAt, r.code], ["liveness", "ALREADY_ENROLLED"]);
  });

  it("does not accept liveness evidence that skips or reorders the challenge", async () => {
    const b = new Browser();
    await b.post("/api/enroll", { docType: "NID", docNumber: newNid(), fullName: "Replay Tester", dob: "1990-01-01", phone: newPhone() });
    await b.post("/api/enroll/code", { code: await readCode(b) });
    const challenge = await b.post("/api/enroll/liveness");
    await sleep(1600);
    const f = face();
    const res = await b.put("/api/enroll/liveness", {
      challengeId: challenge.json.challengeId,
      samples: [capture(f), capture(f)],
      steps: [...challenge.json.steps].reverse().map((kind: string, i: number) => ({ kind, atMs: 300 + i * 300, peak: 0.9 })),
      durationMs: 1600, frames: 20, antispoof: 0.9, liveness: 0.9,
    });
    assert.equal(res.json.error.code, "LIVENESS_FAILED");
    // The challenge is single use: the same id cannot be tried again.
    const again = await b.put("/api/enroll/liveness", { challengeId: challenge.json.challengeId, samples: [capture(f), capture(f)], steps: [], durationMs: 1600, frames: 20, antispoof: null, liveness: null });
    assert.equal(again.json.error.code, "LIVENESS_CHALLENGE_EXPIRED");
  });
});

describe("sign-in", () => {
  it("signs in with the passkey and nothing else", async () => {
    const { browser, res } = await signIn(alice);
    assert.equal(res.status, 200);
    assert.equal((await browser.get("/api/me")).json.profile.universalId, alice.universalId);
  });

  it("refuses requests without a session and state changes from another origin", async () => {
    assert.equal((await new Browser().get("/api/me")).status, 401);
    const foreign = await alice.browser.request("POST", "/api/auth/signout", {}, { Origin: "https://evil.example" });
    assert.equal(foreign.status, 403);
    assert.equal((await alice.browser.get("/api/me")).status, 200);
  });

  it("recovers access with SIM code + matching face, and only with both", async () => {
    // Wrong pairing: answers like a real attempt, but no code is ever sent.
    const stranger = new Browser();
    assert.equal((await stranger.post("/api/auth/recover", { universalId: alice.universalId, phone: newPhone() })).status, 200);
    assert.equal((await stranger.get("/api/sandbox/inbox")).json.inbox, null);
    assert.equal((await stranger.put("/api/auth/recover", { code: "123456" })).json.error.code, "OTP_INCORRECT");

    // Right SIM, wrong face.
    const thief = new Browser();
    await thief.post("/api/auth/recover", { universalId: alice.universalId, phone: alice.phone });
    assert.equal((await thief.put("/api/auth/recover", { code: await readCode(thief) })).status, 200);
    assert.equal((await liveness(thief, "/api/auth/recover/liveness", face())).json.error.code, "FACE_NOT_MATCHED");
    assert.equal((await thief.get("/api/me")).status, 401);

    // Right SIM, right face.
    const newPhoneBrowser = new Browser();
    await newPhoneBrowser.post("/api/auth/recover", { universalId: alice.universalId, phone: alice.phone });
    await newPhoneBrowser.put("/api/auth/recover", { code: await readCode(newPhoneBrowser) });
    assert.equal((await liveness(newPhoneBrowser, "/api/auth/recover/liveness", alice.face)).status, 200);
    assert.equal((await newPhoneBrowser.get("/api/me")).json.profile.universalId, alice.universalId);
  });
});

describe("OpenID Connect", () => {
  it("publishes discovery metadata and signing keys", async () => {
    const meta = await (await fetch(`${BASE}/.well-known/openid-configuration`)).json();
    assert.equal(meta.issuer, BASE);
    assert.deepEqual(meta.subject_types_supported, ["pairwise"]);
    assert.deepEqual(meta.code_challenge_methods_supported, ["S256"]);
    const keys = await (await fetch(meta.jwks_uri)).json();
    assert.ok(keys.keys.length >= 1 && !("d" in keys.keys[0]), "JWKS must contain public keys only");
  });

  it("never redirects to an unregistered address and requires PKCE", async () => {
    const b = alice.browser;
    const bad = await b.get(`/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: bazar.id, redirect_uri: "https://evil.example/cb", scope: "openid" })}`);
    assert.ok(bad.location!.startsWith(`${BASE}/authorize/error`));
    const noPkce = await b.get(`/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: bazar.id, redirect_uri: bazar.redirect, scope: "openid", state: "s1" })}`);
    const url = new URL(noPkce.location!);
    assert.equal(url.origin + url.pathname, bazar.redirect);
    assert.equal(url.searchParams.get("error"), "invalid_request");
    assert.equal(url.searchParams.get("state"), "s1");
    const greedy = await b.get(`/oauth/authorize?${new URLSearchParams({ response_type: "code", client_id: bazar.id, redirect_uri: bazar.redirect, scope: "openid kyc", code_challenge: pkce().challenge, code_challenge_method: "S256" })}`);
    assert.equal(new URL(greedy.location!).searchParams.get("error"), "invalid_scope");
  });

  it("completes the code flow and releases only the approved claims", async () => {
    // The person declines the optional "profile" scope.
    const flow = await authorize(alice.browser, bazar, true, ["openid", "age"]);
    assert.equal(flow.redirectTo!.searchParams.get("state"), flow.state);
    assert.equal(flow.redirectTo!.searchParams.get("iss"), BASE);
    const tokens = await token(bazar, flow.redirectTo!.searchParams.get("code")!, flow.verifier);
    assert.equal(tokens.status, 200, JSON.stringify(tokens.json));

    const { payload } = await jwtVerify(tokens.json.id_token, createRemoteJWKSet(new URL(`${BASE}/oauth/jwks`)), { issuer: BASE, audience: bazar.id });
    assert.equal(payload.nonce, flow.nonce);
    assert.equal(payload.age_over_18, true);
    assert.equal(payload.amarid_unique, true);
    assert.equal(payload.name, undefined, "a declined scope must not be released");
    assert.equal(payload.birthdate, undefined);
    assert.ok(!JSON.stringify(payload).includes(alice.universalId), "the Universal ID is never given to partners");

    const info = await fetch(`${BASE}/oauth/userinfo`, { headers: { Authorization: `Bearer ${tokens.json.access_token}` } });
    assert.equal(((await info.json()) as any).sub, payload.sub);
  });

  it("gives each partner a different subject for the same person, stable over time", async () => {
    const first = await authorize(alice.browser, bazar);
    const a = decodeJwt((await token(bazar, first.redirectTo!.searchParams.get("code")!, first.verifier)).json.id_token);
    const second = await authorize(alice.browser, bazar);
    const b = decodeJwt((await token(bazar, second.redirectTo!.searchParams.get("code")!, second.verifier)).json.id_token);
    const third = await authorize(alice.browser, bank);
    const c = decodeJwt((await token(bank, third.redirectTo!.searchParams.get("code")!, third.verifier)).json.id_token);
    assert.equal(a.sub, b.sub);
    assert.notEqual(a.sub, c.sub);
    const verified = c.verified_claims as any;
    assert.equal(verified.claims.name, alice.name);
    assert.equal(verified.claims.birthdate, alice.dob);
    assert.ok(!JSON.stringify(c).includes(alice.nid), "the document number is never released");
  });

  it("rejects a wrong client secret, a wrong PKCE verifier and a replayed code", async () => {
    const one = await authorize(alice.browser, bazar);
    const wrongSecret = await token({ ...bazar, secret: "nope" }, one.redirectTo!.searchParams.get("code")!, one.verifier);
    assert.deepEqual([wrongSecret.status, wrongSecret.json.error], [401, "invalid_client"]);

    const two = await authorize(alice.browser, bazar);
    const wrongVerifier = await token(bazar, two.redirectTo!.searchParams.get("code")!, pkce().verifier);
    assert.equal(wrongVerifier.json.error, "invalid_grant");

    const three = await authorize(alice.browser, bazar);
    const code = three.redirectTo!.searchParams.get("code")!;
    const ok = await token(bazar, code, three.verifier);
    assert.equal(ok.status, 200);
    const replay = await token(bazar, code, three.verifier);
    assert.equal(replay.json.error, "invalid_grant");
    // Replay is treated as a leak: the grant is revoked and the first access token stops working.
    const info = await fetch(`${BASE}/oauth/userinfo`, { headers: { Authorization: `Bearer ${ok.json.access_token}` } });
    assert.equal(info.status, 401);
  });

  it("stops releasing claims the moment consent is withdrawn", async () => {
    const flow = await authorize(alice.browser, bank);
    const tokens = await token(bank, flow.redirectTo!.searchParams.get("code")!, flow.verifier);
    const call = () => fetch(`${BASE}/oauth/userinfo`, { headers: { Authorization: `Bearer ${tokens.json.access_token}` } });
    assert.equal((await call()).status, 200);
    const me = await alice.browser.get("/api/me");
    const grant = me.json.grants.find((g: any) => g.name === "bKash (demo)");
    assert.equal((await alice.browser.del(`/api/me/grants/${grant.id}`)).status, 200);
    assert.equal((await call()).status, 401);
  });

  it("passes the decision back to the partner when the person declines", async () => {
    const flow = await authorize(alice.browser, bazar, false);
    assert.equal(flow.redirectTo!.searchParams.get("error"), "access_denied");
  });
});

describe("verification passes", () => {
  it("carries only the chosen facts, verifies publicly and can be revoked", async () => {
    const created = await alice.browser.post("/api/me/passes", { label: "Freelance platform", claims: ["real_person", "age_over_18"], minutes: 60 });
    assert.equal(created.status, 200, JSON.stringify(created.json));
    const claims = decodeJwt(created.json.token) as any;
    assert.deepEqual(claims.facts, { real_person: true, age_over_18: true });
    assert.ok(!JSON.stringify(claims).includes(alice.universalId));

    const check = (t: string) => fetch(`${BASE}/api/passes/check`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://verifier.example" }, body: JSON.stringify({ token: t }) }).then((r) => r.json() as any);
    assert.equal((await check(created.json.token)).valid, true);
    const tampered = created.json.token.slice(0, -4) + "AAAA";
    assert.equal((await check(tampered)).valid, false);
    await alice.browser.del(`/api/me/passes/${created.json.id}`);
    assert.deepEqual(await check(created.json.token), { valid: false, reason: "REVOKED" });
  });
});

describe("proof of life", () => {
  it("turns an overdue identity dormant, blocks partner sign-in, and restores it after a live check", async () => {
    const { person: bob, failedAt } = await enroll();
    assert.equal(failedAt, undefined);
    await bob.browser.post("/api/me/sandbox", { days: 400 }); // a year and a month pass
    assert.equal((await bob.browser.get("/api/me")).json.profile.status, "DORMANT");
    const blocked = await authorize(bob.browser, bazar);
    assert.equal(blocked.decision.json.error.code, "IDENTITY_NOT_ACTIVE");

    // Someone else's face cannot renew it.
    assert.equal((await liveness(bob.browser, "/api/me/liveness", face())).json.error.code, "FACE_NOT_MATCHED");
    assert.equal((await liveness(bob.browser, "/api/me/liveness", bob.face)).status, 200);
    assert.equal((await bob.browser.get("/api/me")).json.profile.status, "ACTIVE");
    assert.ok((await authorize(bob.browser, bazar)).redirectTo!.searchParams.get("code"));
  });
});

describe("verification abroad", () => {
  it("requires a verified passport, accepts one added later, and never releases its number", async () => {
    const abroad = { id: "globalverify", secret: process.env.GLOBALVERIFY_CLIENT_SECRET ?? "", redirect: `${PARTNERS}/abroad/callback`, scope: "openid passport age nationality profile" };

    // Alice enrolled with an NID, so a service that requires a passport is refused.
    const refused = await authorize(alice.browser, abroad);
    assert.equal(refused.decision.status, 409);
    assert.equal(refused.decision.json.error.code, "DOCUMENT_REQUIRED");

    // She verifies her passport once, inside AmarID.
    const passport = `B${String(randomBytes(4).readUInt32BE() % 100_000_000).padStart(8, "0")}`;
    assert.equal((await alice.browser.post("/api/me/documents", { docType: "PASSPORT", docNumber: "12" })).json.error.code, "DOCUMENT_NUMBER_INVALID");
    const added = await alice.browser.post("/api/me/documents", { docType: "PASSPORT", docNumber: passport });
    assert.equal(added.status, 200, JSON.stringify(added.json));
    assert.equal((await alice.browser.post("/api/me/documents", { docType: "PASSPORT", docNumber: passport })).json.error.code, "DOCUMENT_ALREADY_ADDED");
    assert.equal((await alice.browser.post("/api/me/documents", { docType: "NID", docNumber: alice.nid })).json.error.code, "DOCUMENT_ALREADY_ADDED");

    const flow = await authorize(alice.browser, abroad);
    const tokens = await token(abroad, flow.redirectTo!.searchParams.get("code")!, flow.verifier);
    assert.equal(tokens.status, 200);
    const claims = decodeJwt(tokens.json.id_token);
    assert.equal(claims.passport_verified, true);
    assert.equal(claims.nid_verified, undefined, "the NID was not asked for");
    assert.ok(!JSON.stringify(claims).includes(passport), "the passport number must never be released");
    assert.deepEqual(claims.nationalities, ["BD"]);
    assert.equal(claims.age_over_18, true);
    assert.equal(claims.name, alice.name);
    for (const absent of ["birthdate", "phone_number", "verified_claims"]) assert.equal(claims[absent], undefined);
    assert.ok(!JSON.stringify(claims).includes(alice.nid));
  });
});

describe("MCP server", () => {
  const rpc = async (method: string, params?: unknown, id: number | null = 1) => {
    const res = await fetch(`${BASE}/api/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", ...(id === null ? {} : { id }), method, ...(params ? { params } : {}) }),
    });
    return { status: res.status, json: res.status === 202 ? null : ((await res.json()) as any) };
  };

  it("initialises, accepts notifications and lists read-only tools", async () => {
    const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1" } });
    assert.equal(init.json.result.protocolVersion, "2025-06-18");
    assert.equal(init.json.result.serverInfo.name, "amarid");
    assert.equal((await rpc("notifications/initialized", undefined, null)).status, 202);
    const list = await rpc("tools/list");
    const names = list.json.result.tools.map((t: any) => t.name).sort();
    assert.deepEqual(names, ["get_openid_configuration", "list_scopes", "search_docs", "verify_pass"]);
    for (const tool of list.json.result.tools) assert.equal(tool.annotations.readOnlyHint, true);
  });

  it("answers documentation questions and reports bad input as a tool error", async () => {
    const hit = await rpc("tools/call", { name: "search_docs", arguments: { query: "how long does an authorization code live" } });
    assert.equal(hit.json.result.isError, false);
    assert.match(JSON.stringify(hit.json.result.structuredContent.passages), /60 seconds/);
    const bad = await rpc("tools/call", { name: "search_docs", arguments: {} });
    assert.equal(bad.json.result.isError, true);
    assert.equal((await rpc("tools/call", { name: "no_such_tool" })).json.error.code, -32602);
    assert.equal((await rpc("no/such/method")).json.error.code, -32601);
  });

  it("checks a verification pass and cannot be used to look up a person", async () => {
    const created = await alice.browser.post("/api/me/passes", { label: "MCP test", claims: ["real_person", "age_over_18"], minutes: 15 });
    assert.equal(created.status, 200);
    const good = await rpc("tools/call", { name: "verify_pass", arguments: { token: created.json.token } });
    assert.equal(good.json.result.structuredContent.valid, true);
    assert.equal(good.json.result.structuredContent.facts.real_person, true);
    const text = JSON.stringify(good.json);
    for (const secret of [alice.name, alice.nid, alice.universalId]) assert.ok(!text.includes(secret));
    const forged = await rpc("tools/call", { name: "verify_pass", arguments: { token: `${created.json.token.slice(0, -6)}AAAAAA` } });
    assert.equal(forged.json.result.structuredContent.valid, false);
  });

  it("reports health", async () => {
    const res = await fetch(`${BASE}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as any).status, "ok");
  });
});

describe("audit log", () => {
  it("is an intact hash chain and holds no personal data", async () => {
    assert.ok(ADMIN_TOKEN, "ADMIN_TOKEN must be set for this test");
    const admin = new Browser();
    assert.equal((await admin.post("/api/admin/session", { token: "wrong-token-value" })).status, 401);
    assert.equal((await admin.post("/api/admin/session", { token: ADMIN_TOKEN })).status, 200);
    const result = await admin.post("/api/admin/audit");
    assert.equal(result.json.ok, true);
    assert.ok(result.json.events > 10);

    const activity = JSON.stringify((await alice.browser.get("/api/me")).json.activity);
    for (const secret of [alice.name, alice.nid, alice.phone.slice(1)]) assert.ok(!activity.includes(secret));
  });
});

after(() => {});
