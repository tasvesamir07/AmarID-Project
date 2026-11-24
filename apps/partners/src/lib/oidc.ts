import * as oidc from "openid-client";
import { env, tenants, type Tenant } from "./env";

/**
 * The whole AmarID integration. It is plain OpenID Connect through
 * openid-client, a certified relying-party library: there is no AmarID SDK,
 * and nothing here is specific to this demo.
 */

const configs = new Map<Tenant, Promise<oidc.Configuration>>();

function configuration(tenant: Tenant): Promise<oidc.Configuration> {
  let pending = configs.get(tenant);
  if (!pending) {
    const { clientId, secret } = tenants[tenant];
    const issuer = new URL(env.issuer);
    // Plain http is accepted only for a local issuer during development.
    const local = issuer.protocol === "http:" && ["localhost", "127.0.0.1"].includes(issuer.hostname);
    pending = oidc.discovery(issuer, clientId, secret(), undefined, local ? { execute: [oidc.allowInsecureRequests] } : undefined);
    pending.catch(() => configs.delete(tenant));
    configs.set(tenant, pending);
  }
  return pending;
}

export const redirectUri = (tenant: Tenant) => `${env.baseUrl}/${tenant}/callback`;

export type Pending = { verifier: string; state: string; nonce: string };

export async function beginLogin(tenant: Tenant): Promise<{ url: string; pending: Pending }> {
  const config = await configuration(tenant);
  const pending: Pending = { verifier: oidc.randomPKCECodeVerifier(), state: oidc.randomState(), nonce: oidc.randomNonce() };
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(tenant),
    scope: tenants[tenant].scope,
    code_challenge: await oidc.calculatePKCECodeChallenge(pending.verifier),
    code_challenge_method: "S256",
    state: pending.state,
    nonce: pending.nonce,
  });
  return { url: url.href, pending };
}

/** Exchanges the code and returns the verified ID token claims. */
export async function completeLogin(tenant: Tenant, callbackUrl: URL, pending: Pending): Promise<Record<string, unknown>> {
  const config = await configuration(tenant);
  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: pending.verifier,
    expectedState: pending.state,
    expectedNonce: pending.nonce,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  if (!claims) throw new Error("no ID token");
  return claims as Record<string, unknown>;
}
