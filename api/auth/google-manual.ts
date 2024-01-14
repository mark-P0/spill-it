/**
 * - https://developers.google.com/identity/openid-connect/openid-connect
 * - https://developers.google.com/identity/protocols/oauth2/web-server
 */

import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
} from "jose";
import { z } from "zod";
import { env } from "../utils/env";
import { logger } from "../utils/logger";

// TODO Cache this? Is it cached by default?
/**
 * - https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest
 * - https://developers.google.com/identity/openid-connect/openid-connect#discovery
 */
async function fetchDiscoveryDocument(
  url = "https://accounts.google.com/.well-known/openid-configuration"
) {
  const response = await fetch(url);
  const doc = await response.json();

  return z
    .object({
      authorization_endpoint: z.string(),
      token_endpoint: z.string(),
      jwks_uri: z.string(),
    })
    .parse(doc);
}

/** https://developers.google.com/identity/openid-connect/openid-connect#sendauthrequest */
export async function buildAuthUrl({
  scope = ["openid", "email", "profile"],
  redirectUri = "https://localhost:3000/api/v0/login/google-manual/redirect", // TODO Construct this from endpoints? Create client dynamically upon request?
  includeGrantedScopes = true,
} = {}) {
  const { authorization_endpoint } = await fetchDiscoveryDocument();
  const url = new URL(authorization_endpoint);

  url.searchParams.set("client_id", env.AUTH_GOOGLE_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope.join(" "));
  url.searchParams.set("redirect_uri", redirectUri);
  // url.searchParams.set("state", ""); // TODO Use? Helps protect against CSRF
  // url.searchParams.set("nonce", ""); // TODO Use? Helps protect against "replay attacks"
  if (includeGrantedScopes) {
    url.searchParams.set("include_granted_scopes", "true");
  }

  return url.href;
}

/** https://developers.google.com/identity/openid-connect/openid-connect#exchangecode */
async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri?: string;
}) {
  const {
    code,
    redirectUri = "https://localhost:3000/api/v0/login/google-manual/redirect", // TODO Construct this from endpoints? Create client dynamically upon request?
  } = args;

  const { token_endpoint } = await fetchDiscoveryDocument();
  const url = new URL(token_endpoint);

  const params = new URLSearchParams();
  params.set("code", code);
  params.set("client_id", env.AUTH_GOOGLE_CLIENT_ID);
  params.set("client_secret", env.AUTH_GOOGLE_CLIENT_SECRET);
  params.set("redirect_uri", redirectUri);
  params.set("grant_type", "authorization_code");

  const res = await fetch(url, { method: "POST", body: params });
  const data = await res.json();

  return z
    .object({
      access_token: z.string(),
      expires_in: z.number(),
      id_token: z.string(),
      scope: z.string(),
      token_type: z.string(),
      refresh_token: z.string().optional(),
    })
    .parse(data);
}

/**
 * - https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo
 * - https://github.com/panva/jose/blob/main/docs/functions/jwt_verify.jwtVerify.md
 */
async function extractGoogleInfoFromJwt(jwt: string) {
  const { jwks_uri } = await fetchDiscoveryDocument();
  const jwks = createRemoteJWKSet(new URL(jwks_uri));

  const { payload } = await jwtVerify(jwt, jwks); // Also validates the token
  const { sub, name, picture } = z
    .object({
      sub: z.string(),
      name: z.string(), // TODO Make these optional? Strictly speaking they are not always present...
      picture: z.string(), // TODO Make these optional? Strictly speaking they are not always present...
    })
    .parse(payload);

  return { googleId: sub, name, picture };
}

export async function convertCodeIntoGoogleInfo(
  code: string,
  redirectUri?: string // TODO Make non-optional after deleting old code
) {
  const tokens = await exchangeCodeForTokens({ code, redirectUri });
  const googleInfo = await extractGoogleInfoFromJwt(tokens.id_token);
  return googleInfo;
}
