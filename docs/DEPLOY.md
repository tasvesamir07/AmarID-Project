# Deploying to Railway

The project deploys as one Railway project with three parts:

| Service | What it is | Config file |
|---|---|---|
| `amarid` | The identity provider and wallet (`apps/id`) | `/apps/id/railway.json` |
| `demos` | The partner demos: mobile wallet, marketplace, verification abroad (`apps/partners`) | `/apps/partners/railway.json` |
| `Postgres` | PostgreSQL database | Railway template |

Both web services build from the repository root, because the repository is an npm workspace with one lockfile. Do not set a root directory on either service.

## Steps

1. Create a Railway project and add a **PostgreSQL** database.
2. Add a service from this GitHub repository and name it `amarid`. In its settings, set **Config file path** to `/apps/id/railway.json`.
3. Add a second service from the same repository and name it `demos`. Set **Config file path** to `/apps/partners/railway.json`.
4. Generate a public domain for each service (Settings → Networking).
5. Set the variables below, then deploy.

## Variables

Set these as **shared variables** on the project, so both services read the same values:

| Variable | Value |
|---|---|
| `APP_URL` | the public address of `amarid`, for example `https://amarid-production.up.railway.app` |
| `PARTNERS_URL` | the public address of `demos` |
| `DARAZ_CLIENT_SECRET` | a new random value |
| `BKASH_CLIENT_SECRET` | a new random value |
| `GLOBALVERIFY_CLIENT_SECRET` | a new random value |

Set these on the `amarid` service only:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `AMARID_MASTER_KEY` | 32 random bytes in hex (64 characters) |
| `ADMIN_TOKEN` | a new random value, at least 12 characters |
| `SANDBOX` | `true` |

Set this on the `demos` service only:

| Variable | Value |
|---|---|
| `PARTNERS_SESSION_SECRET` | 32 random bytes in hex |

Type the two addresses as plain text instead of referencing each service from the other: the two services need each other's address, and a reference in both directions makes Railway wait on a deploy order that cannot be satisfied.

Generate random values with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not reuse the values from a local `.env`, and never commit them.

## What happens on deploy

- `amarid` builds with `npm run build -w @amarid/id`. Before each release starts, the pre-deploy command `npm run setup` applies database migrations and registers the three demo partners with redirect addresses on `PARTNERS_URL`.
- `amarid` is healthy when `/api/health` answers, which requires the database to be reachable.
- `demos` builds with `npm run build -w @amarid/partners` and needs no database.

## Things that must be true

- `APP_URL` must be exactly the address people open in the browser. Passkeys and OpenID Connect are bound to it. If the domain changes, existing passkeys stop working and people must enroll again.
- `AMARID_MASTER_KEY` must never change after the first enrollment. Every sealed field and every face template depends on it.
- Keep `SANDBOX=true` for the demo. With `SANDBOX=false` the registry and SMS adapters refuse to run until real ones are wired in.
- Tell visitors not to enter real personal data. The banner on every page says so.

## Temporary public address from a laptop

`npm run tunnel` builds both apps and publishes the local stack through two Cloudflare quick tunnels. It needs no account. The addresses change on every run and close when the command stops. It is meant for a short demo to a phone or a remote reviewer, not for hosting.
