/**
 * - https://developers.google.com/identity/openid-connect/openid-connect
 * - https://developers.google.com/identity/protocols/oauth2/web-server
 */

import { raise } from "@spill-it/utils/errors";
import { safeAsync } from "@spill-it/utils/safe";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

// TODO Cache this? Is it cached by default?
/**
 * - https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest
 * - https://developers.google.com/identity/openid-connect/openid-connect#discovery
 */
async function fetchDiscoveryDocument(
  url = "https://accounts.google.com/.well-known/openid-configuration",
) {
  const result = await safeAsync(async () => {
    const res = await fetch(url);
    return await res.json();
  });
  const receivedDoc = result.success
    ? result.value
    : raise("Failed fetching Google discovery document", result.error);

  const parsing = z
    .object({
      authorization_endpoint: z.string(),
      token_endpoint: z.string(),
      jwks_uri: z.string(),
    })
    .safeParse(receivedDoc);
  const doc = parsing.success
    ? parsing.data
    : raise("Unexpected Google discovery document", parsing.error);

  return doc;
}

/**
 * - https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest
 * - https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters
 */
export async function buildAuthUrl(
  googleClientId: string,
  redirectUri: string,
  scopes = ["openid", "email", "profile"],
  includeGrantedScopes = true,
) {
  const { authorization_endpoint } = await fetchDiscoveryDocument();
  const url = new URL(authorization_endpoint);

  url.searchParams.set("client_id", googleClientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("redirect_uri", redirectUri);
  // url.searchParams.set("state", ""); // TODO Use? Helps protect against CSRF
  // url.searchParams.set("nonce", ""); // TODO Use? Helps protect against "replay attacks"
  if (includeGrantedScopes) {
    url.searchParams.set("include_granted_scopes", "true"); // Incremental authorization
  }

  return url.href;
}

/** https://developers.google.com/identity/openid-connect/openid-connect#exchangecode */
export async function exchangeCodeForTokens(
  googleClientId: string,
  googleClientSecret: string,
  code: string,
  redirectUri: string,
) {
  const { token_endpoint } = await fetchDiscoveryDocument();
  const url = new URL(token_endpoint);

  const params = new URLSearchParams();
  params.set("code", code);
  params.set("client_id", googleClientId);
  params.set("client_secret", googleClientSecret);
  params.set("redirect_uri", redirectUri);
  params.set("grant_type", "authorization_code");

  const result = await safeAsync(async () => {
    const res = await fetch(url, { method: "POST", body: params });
    return await res.json();
  });
  const receivedTokens = result.success
    ? result.value
    : raise("Failed code-token exchange with Google", result.error);

  const parsing = z
    .object({
      access_token: z.string(),
      expires_in: z.number(),
      id_token: z.string(),
      scope: z.string(),
      token_type: z.string(),
      refresh_token: z.string().optional(),
    })
    .safeParse(receivedTokens);
  const tokens = parsing.success
    ? parsing.data
    : raise("Unexpected Google tokens", parsing.error);

  return tokens;
}

/**
 * - https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo
 * - https://github.com/panva/jose/blob/main/docs/functions/jwt_verify.jwtVerify.md
 */
export async function extractGoogleInfoFromJwt(jwt: string) {
  const { jwks_uri } = await fetchDiscoveryDocument();

  const jwks = createRemoteJWKSet(new URL(jwks_uri));
  const result = await safeAsync(() => jwtVerify(jwt, jwks)); // Also validates the token
  const { payload } = result.success
    ? result.value
    : raise("Failed verifying Google JWT", result.error);

  const parsing = z
    .object({
      sub: z.string(),
      name: z.string(), // TODO Make these optional? Strictly speaking they are not always present...
      picture: z.string(), // TODO Make these optional? Strictly speaking they are not always present...
    })
    .safeParse(payload);
  const { sub, name, picture } = parsing.success
    ? parsing.data
    : raise("Unexpected Google JWT", parsing.error);

  return { googleId: sub, name, picture };
}
