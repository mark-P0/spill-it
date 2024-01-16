import { z } from "zod";
import { raise } from "./errors";
import { localizeLogger } from "./logger";
import { splitAtFirstInstance } from "./strings";

const logger = localizeLogger(import.meta.url);

/**
 * - Try to keep "sorted"
 * - Group related routes as much as possible
 */
const endpoints = [
  ...["/api/v0/users/me", "/api/v0/sessions/google"],
  ...[
    "/try/hello",
    "/try/sample",
    "/try/protected",
    "/try/unprotected",
    "/try/not-found",
    "/try/error",
    "/try/ui/login/google",
    "/try/ui/login/google/redirect",
  ],
] as const;
type Endpoint = (typeof endpoints)[number];
export function endpoint<T extends Endpoint>(endpoint: T): T {
  return endpoint;
}

logger.info(
  "Using the following endpoints: " + endpoints.map((ep) => `"${ep}"`).join(" ")
);

const mapSchemeZod = {
  SPILLITGOOGLE: z.object({ code: z.string(), redirectedOn: z.string() }),
  SPILLITSESS: z.object({ id: z.string().uuid() }),
};
type MapSchemeZod = typeof mapSchemeZod;
type AuthScheme = keyof MapSchemeZod;

/**
 * https://stackoverflow.com/a/43164958
 * - Use standard "Authorization" header instead of custom
 * - Can use custom authorization scheme
 * - Recommended not to separate parameters with commas
 *
 * https://stackoverflow.com/a/11420667
 * - Parameters follow a `key=value` format
 * - Parameters are separated by comma
 *
 * Expected `authorization` format is `<scheme> <key>=<value>; <key>=<value>; ... <key>=<value>`
 */
function parseAuth<TScheme extends AuthScheme>(
  targetScheme: TScheme,
  authHeaderValue: string,
  sep = { header: " ", params: "; ", paramEntry: "=" }
) {
  const parts = splitAtFirstInstance(authHeaderValue, sep.header);
  const [scheme, givenParams] = parts;
  if (scheme !== targetScheme) raise("Invalid authorization scheme");

  const parsingParams = mapSchemeZod[targetScheme].safeParse(
    Object.fromEntries(
      givenParams
        .split(sep.params)
        .map((entryStr) => entryStr.split(sep.paramEntry))
    )
  );
  const params: z.infer<MapSchemeZod[TScheme]> = parsingParams.success
    ? parsingParams.data
    : raise("Invalid authorization parameters", parsingParams.error);

  return { scheme: targetScheme, params };
}
export function parseHeaderAuthGoogle(possibleHeaders: unknown) {
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(possibleHeaders);
  const headers = parsingHeaders.success
    ? parsingHeaders.data
    : raise("Invalid headers", parsingHeaders.error);

  return parseAuth("SPILLITGOOGLE", headers.authorization);
}
export function parseHeaderAuthSession(possibleHeaders: unknown) {
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(possibleHeaders);
  const headers = parsingHeaders.success
    ? parsingHeaders.data
    : raise("Invalid headers", parsingHeaders.error);

  return parseAuth("SPILLITSESS", headers.authorization);
}
