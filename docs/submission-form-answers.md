# Submission form answers (true for the code in this repository)

Each answer below describes something that exists in the repository now. Paste the
text into the field with the same name. Where the form asks you to tick options,
the "Select" line lists what is true; tick only options that match.

---

## Basics / data sections

**Data lifecycle**
Collect: a person enters an NID or passport number, date of birth and phone number, then completes a live face check in the browser. Verify: the server checks the document and SIM against registry adapters and sends a one-time code. Transform: the document and phone numbers become keyed HMAC indexes; the face becomes a 1024-number embedding that is turned into a revocable template on the server. Store: PostgreSQL, with names, dates and templates sealed with AES-256-GCM. Use: sign-in, consent-based sharing of yes/no facts with partners, and verification passes. Review: yearly proof of life; an identity that misses it turns dormant. Delete: face images are never stored, one-time codes and sessions expire, and rotating the template key revokes every stored template.

**Data sources** — Select: user-entered form data; camera / biometric capture; external API (civil registry and SIM registry adapters); device authenticator (passkey).

**Data source details**
Four sources: (1) the enrollment form (document number, date of birth, phone); (2) the device camera, analysed in the browser by an open-source face model; (3) civil registry and SIM registry adapters, which are sandbox simulations in this build and refuse to run when SANDBOX=false; (4) the device's passkey authenticator, which supplies a public key and a user-verification flag.

**Acquisition methods** — Select: API calls; user input / forms; device sensors.

**Acquisition details**
Data arrives only through first-party HTTPS requests from the person's own browser. Every state-changing request passes an Origin check, a rate limit and schema validation. Registry lookups go through adapter interfaces so a real Election Commission or operator API can replace the sandbox without changing callers. Nothing is scraped or bought.

**Scrapers / crawlers used**
None, by design. An identity provider must not collect data about people from third-party sites. All personal data comes from the person, with consent, or from an authorised registry adapter.

**Parsers used**
zod schemas parse every request body; jose parses and verifies JWTs (ID tokens, access tokens, verification passes); @simplewebauthn/server parses WebAuthn attestation and assertion objects (CBOR/COSE); a custom parser reads the Universal ID format AID-XXXX-XXXX-XXXC with a check character.

**Formatters / converters**
Phone numbers are normalised to 8801XXXXXXXXX; document numbers are normalised before indexing; Universal IDs are encoded in Crockford base32; dates and numbers are shown in English or Bangla digits.

**Formats handled** — Select: JSON; JWT / JWS; binary (sealed bytes, Float32 embeddings, CBOR); SQL / relational rows.

**Data cleaning & enrichment**
Input is trimmed and normalised (phone prefixes, document spacing, letter case) before validation. Low-quality face frames (face too far, too close or off-centre) are rejected in the browser before anything is sent. No enrichment from outside sources is done.

**Schema validation**
Three layers: zod schemas at every API boundary; a typed Prisma schema with unique constraints on the document index, SIM index and passkey ID in PostgreSQL; and a check character on every Universal ID (Luhn mod 32) so a mistyped ID is rejected before any lookup.

**Storage targets** — Select: relational database (PostgreSQL).

**Storage details**
One PostgreSQL 17 database through Prisma 7. Document and phone numbers are stored only as HMAC-SHA256 blind indexes. Names, dates of birth and face templates are sealed with AES-256-GCM, with the record ID bound as associated data. Session, grant and code tokens are stored as hashes. All keys derive from one master key with HKDF, so production can move that key into a KMS or HSM.

**Visualization tools / Dashboards & reports**
The wallet shows each person their own activity timeline, connected apps and passes. The operator console shows counts of identities by status, partners, recent audit events and the result of the audit-chain check. Both are built with React and Tailwind; no external BI tool is used.

**ML methods** — Select: computer vision; face detection / recognition; embeddings; similarity search.

**AI / ML details**
The open-source @vladmandic/human library (TensorFlow.js) runs in the browser. It detects the face, tracks head rotation, mouth and eye state for a random liveness challenge, and produces a 1024-dimension embedding. The server applies a keyed orthogonal transform (sign flips, permutations, Walsh–Hadamard) to make a cancelable template, then runs a 1:N search at enrollment to stop duplicate identities and a 1:1 match for recovery and proof of life.

**Non-AI analytics**
Rate-limit counters per address and per phone number; counts of identities by status; proof-of-life due dates; and a full recomputation of the audit hash chain to detect edits.

**Insights delivery**
To the person: the wallet activity page lists every sign-in, consent and pass in plain English or Bangla. To partners: signed claims that answer yes/no questions (for example "over 18"). To operators: the console overview and audit view.

**Orchestration**
No external orchestrator. One command (npm run dev) starts PostgreSQL, applies migrations, seeds demo partners and starts both apps. GitHub Actions runs type checks, unit tests, the production build and end-to-end tests on every push.

**Scheduling / triggers**
Proof-of-life status is evaluated when an identity is used, so no background job is needed; CI is triggered by push and pull request.

**Outbound APIs**
A standards-based OpenID Connect provider: discovery document, authorization endpoint (code flow with required PKCE), token endpoint, userinfo and JWKS. A public pass-check endpoint lets anyone verify a verification pass. An MCP endpoint serves AI agents, and a health endpoint serves the hosting platform.

**Embeddings / model serving**
Face model weights are served as static files from the app's own origin and run on the user's device with WebGL; no image leaves the device. Only the embedding and the liveness evidence are sent to the server.

**Open-source data stack**
PostgreSQL, Prisma, Next.js, React, zod, jose, SimpleWebAuthn, openid-client, @vladmandic/human on TensorFlow.js, Tailwind CSS, embedded-postgres for local development.

**Data quality**
Check characters on IDs, schema validation on every request, unique indexes for document, SIM and face, face-frame quality gates, and a similarity threshold checked on sample faces (same face 0.87–1.0, different faces 0.31–0.53). The threshold still needs tuning on a representative population.

**Privacy & compliance**
Data minimisation by design: no document numbers, document images, face images or fingerprints are stored. Partners receive a different pseudonymous subject each, so they cannot link a person across services, and only the facts the person approves. Every release of data is consent-based and logged where the person can see it. The design follows the principles of Bangladesh's personal data protection framework and GDPR (purpose limitation, minimisation, storage limitation); no formal certification has been done.

**Lineage & observability**
Every security event is written to an append-only audit log in which each entry includes the hash of the previous one; the operator console can recompute the chain to prove nothing was edited or removed. Each event records the actor, the partner and the fields released.

**Cost & performance**
Face analysis runs on the user's device, so the server needs no GPU. The whole system is two Node.js services and one PostgreSQL database and runs on free hosting tiers. The 1:N face search is exact today; at national scale it would move to an approximate vector index.

---

## AI detail usage

**Evaluation & quality methods**
42 automated tests: 16 unit tests (ID check characters, template transform properties, documentation search ranking) and 26 end-to-end tests that run the real HTTP flows with a software passkey authenticator, including duplicate enrollment, code replay, PKCE failures and the MCP server. Face matching was calibrated on sample faces, and a still photo used as a webcam was confirmed to fail the liveness challenge.

**Guardrails, safety & privacy**
The server issues a random, single-use liveness challenge with a time limit. Sandbox adapters refuse to run in production mode. Sensitive scopes are limited to regulated partners. One-time codes are never returned by the API. A strict Content Security Policy blocks third-party scripts. docs/SECURITY.md lists what is simulated and the known limits.

**Fine-tuning / adaptation**
No model was fine-tuned. The face model is used with its published weights; adaptation is limited to the similarity threshold and the liveness challenge parameters, which are configuration values.

**Open-source AI tools & libraries**
@vladmandic/human 3.3 (face detection, mesh, embedding) on TensorFlow.js with the WebGL backend. No hosted AI API is called at run time.

**LLM usage commentary**
LLMs were used to build the project, not inside the product. Claude, through Claude Code in VS Code, audited the preliminary prototype, proposed the new architecture, wrote code and tests, and ran the checks. A human reviewed the decisions and the limits stated in the documentation. The running product makes no LLM calls, so no personal data reaches an LLM.

**Prompt strategy / Prompt usage**
Prompts gave the goal and the fixed facts first (the pitch, problem statement and solution description), then asked for an audit before any code, then for a rebuild. Standing rules lived in a context file rather than being repeated: where to install, how to report, what to clean up. Each task ended with a required three-part report (problem, fix, result) so claims could be checked against test output.

**Token optimization**
Long sessions were compacted into summaries instead of restarted. Standing instructions were kept in one context file so they were not re-sent. File searches used targeted patterns rather than reading whole folders, and large files were generated by scripts rather than rewritten in chat.

**AI-DLC process notes**
1. Inception: the pitch and problem statement were given as the fixed base. 2. Audit: the AI reviewed the existing prototype and listed what was mocked. 3. Design: a new architecture was proposed and written down (docs/ARCHITECTURE.md). 4. Build: code was written in small verified steps. 5. Verify: unit tests, end-to-end tests and real-browser runs. 6. Disclose: docs/SECURITY.md records what is real, what is simulated and the known limits.

**MCP clients / hosts**
Claude Code (VS Code extension) during development. The AmarID MCP server works with any client that supports Streamable HTTP.

**MCP servers we built** — 1
AmarID MCP server, at /api/mcp on the identity provider. It lets an AI agent or AI coding assistant learn how to integrate AmarID and check a verification pass.

**MCP tools exposed**
search_docs (search the architecture, security and integration documentation), verify_pass (check a signed verification pass), list_scopes (scopes, the claims they release, and what is never released), get_openid_configuration (the discovery document). Two resources: amarid://openid-configuration and amarid://scopes.

**MCP transports** — Select: Streamable HTTP.

**MCP permissions**
Every tool is read-only and marked with readOnlyHint. The server takes no credentials and no cookies, cannot look up a person, and returns only what the public site already publishes. Requests are rate limited per address and limited in size.

**MCP reuse / architecture notes**
The MCP server is a thin layer over existing domain functions: verify_pass calls the same code as the public pass-check API, and get_openid_configuration returns the same document as the discovery endpoint. It is stateless (one JSON-RPC message per request), so it scales with the web app and needs no session store.

**MCP servers we used**
Railway MCP server, to read Railway's deployment documentation while preparing the deployment configuration.

**MCP servers for data access** (Basics section)
The AmarID MCP server gives agents read access to documentation passages and to pass verification results. It gives no access to personal records.

**Retrieval & RAG techniques** — Select only what matches: keyword / BM25 retrieval; structure-aware chunking with variable chunk size. Do not select contextual retrieval, vector search or Graph RAG: they are not used.

**RAG architecture details**
Retrieval is offered to AI agents through the search_docs MCP tool; the agent's own model writes the answer. At build time the Markdown documentation is split by heading into passages of variable length (long sections are split on paragraph boundaries), and each passage keeps its heading trail, for example "Security > Known limits", so it makes sense on its own. At query time passages are ranked with BM25, with heading matches weighted double. The corpus is a few dozen passages, so exact in-memory ranking is used: no embedding model, no vector database and no external service.

**Agent / orchestration notes**
The product runs no agent of its own. It is built to be used by agents: an agent connects to the MCP server, searches the documentation, reads the scopes and discovery document, and can then generate a correct OpenID Connect integration or check a pass a user shared.

**Workflow automation notes**
No workflow engine is used. GitHub Actions runs the checks on every push, and Railway runs migrations and partner registration as a pre-deploy step.

---

## Build provenance

**Frameworks & libraries**
Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7, PostgreSQL 17, SimpleWebAuthn, jose, zod, openid-client, @vladmandic/human.

**Context / memory files**
AGENTS.md files in apps/id and apps/partners (in the repository), and a CLAUDE.md file of standing instructions on the developer machine.

**Prompt library (first entry)**
"Understand the product from the pitch, problem statement and solution description; they are the base. Then audit the existing code and list what is real and what is mocked. Fix it, or rebuild if the faults are structural. Do not copy the existing UI. State honestly what is simulated."

**Deployment method**
Railway: two web services (identity provider, partner demos) and PostgreSQL, built from one repository with a config file per service. Migrations run as a pre-deploy step. Steps are in docs/DEPLOY.md.

**Publish local environment to internet / Tunneling usage notes**
Select Cloudflare Tunnel only after you have run it. The command "npm run tunnel" opens two Cloudflare quick tunnels, rebuilds the apps with the tunnel addresses as their public origins (passkeys and OpenID Connect are bound to the origin), re-registers the partner redirect addresses, and prints the public links. It is for short remote demos, not hosting.

## Links

**Other links**
- Architecture: https://github.com/tasvesamir07/AmarID-Project/blob/main/docs/ARCHITECTURE.md
- Security and honesty notes: https://github.com/tasvesamir07/AmarID-Project/blob/main/docs/SECURITY.md
- Integration guide and MCP server: https://github.com/tasvesamir07/AmarID-Project/blob/main/docs/INTEGRATION.md
