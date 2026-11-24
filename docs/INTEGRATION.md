# Integration guide

AmarID is a standard OpenID Connect provider. A partner integrates it with any certified relying-party library; there is no AmarID SDK.

## Add "Continue with AmarID" to an app

1. An operator registers the app in the operator console (`/admin`) with its redirect URIs and the scopes it is allowed to request. A confidential client receives a client secret once.
2. The app reads the discovery document at `/.well-known/openid-configuration`.
3. The app starts an authorization code flow with PKCE (`S256`). PKCE is required for every client. The redirect URI must match a registered one exactly.
4. The person signs in with their passkey and sees a consent screen that lists the exact values the app will receive. Optional scopes can be switched off.
5. The app exchanges the code at the token endpoint and verifies the ID token against the keys at `/oauth/jwks` (algorithm ES256).

The demo partners in `apps/partners` do this with `openid-client` in about fifty lines (`src/lib/oidc.ts`).

## Scopes and claims

| Scope | Claims released | Notes |
|---|---|---|
| `openid` | `sub`, `amarid_unique`, `amarid_liveness_date` | Required. `sub` is a different private ID for every partner. |
| `age` | `age_over_18` | A yes or no. The date of birth is not released. |
| `nationality` | `nationalities` | `["BD"]`. No passport or NID number is released. |
| `profile` | `name` | As on the verified document. |
| `birthdate` | `birthdate` | Regulated partners only. |
| `phone` | `phone_number`, `phone_number_verified` | Regulated partners only. |
| `kyc` | `verified_claims` | Regulated partners only. Says what was checked, how and when. |

A partner can request only the scopes it was registered with. A request for more is refused before the person sees anything.

No scope releases a document number, a document image, a face image, a face template, a fingerprint or the Universal ID.

## Pairwise subjects

The `sub` claim is an HMAC of the person's internal ID and the partner's sector. It is stable for one partner, so the partner can enforce one account per real person. It differs between partners, so two partners cannot join their user tables.

## Authorization code rules

Codes live for 60 seconds and work once. Replaying a code revokes the grant it belongs to. The authorization response carries the `iss` parameter (RFC 9207).

## Verification passes

A person can create a verification pass in their wallet for a service that is not an AmarID partner, for example a platform abroad. The pass is a signed token that carries only the facts the person picked: `real_person`, `age_over_18`, `bangladesh_id_holder`, `recently_verified`, `name`.

A verifier checks a pass in one of two ways:

- Offline: verify the signature with the public key from `/oauth/jwks` and check the expiry. The token type is `amarid-pass+jwt`.
- Online: `POST /api/passes/check` with `{ "token": "..." }`. This also reports whether the pass was revoked and whether the identity behind it is still active. The endpoint needs no account or API key.

## MCP server for AI agents

AmarID exposes a Model Context Protocol server at `/api/mcp` (Streamable HTTP, stateless, no credentials). An AI agent or an AI coding assistant can connect to it to learn how to integrate AmarID and to check passes.

| Tool | What it does |
|---|---|
| `search_docs` | Searches this documentation and returns the best-matching passages. |
| `verify_pass` | Checks a verification pass, the same check as `/api/passes/check`. |
| `list_scopes` | Lists scopes, the claims they release and what is never released. |
| `get_openid_configuration` | Returns the discovery document. |

All tools are read-only. The server cannot look up a person and holds no secrets. Requests are rate limited per address.

Connect from Claude Code:

```
claude mcp add --transport http amarid https://<your-amarid-host>/api/mcp
```

Documentation search uses heading-aware chunking (one passage per section, each carrying its heading trail) and BM25 keyword ranking. The index is built from the Markdown files at build time, so it needs no model and no external service.

## Sandbox

When `SANDBOX=true` the civil registry, SIM registry and SMS gateway are simulated. One-time codes appear in an on-screen sandbox phone and are never returned by the API. The discovery document and the `verified_claims` trust framework both say when the sandbox is on.
