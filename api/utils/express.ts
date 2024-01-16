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
  ...["/api/v0/users/me", "/api/v0/sessions"],
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
  SPILLITGOOGLE: z.object({ code: z.string(), redirectUri: z.string() }),
  SPILLITSESS: z.object({ id: z.string().uuid() }),
};
type MapSchemeZod = typeof mapSchemeZod;
type AuthScheme = keyof MapSchemeZod;
type SchemeParams<T extends AuthScheme> = z.infer<MapSchemeZod[T]>;

export function buildHeaderAuth<TScheme extends AuthScheme>(
  scheme: TScheme,
  params: SchemeParams<TScheme>
) {
  const paramsEncoded = new URLSearchParams(params);
  return `${scheme} ${paramsEncoded}`;
}

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
 * Expected `authorization` format is `<scheme> URLSearchParams({key: value}).toString()`
 */
export function parseHeaderAuth<TScheme extends AuthScheme>(
  targetScheme: TScheme,
  value: string
) {
  const [scheme, paramsEncoded] = splitAtFirstInstance(value, " ");
  if (scheme !== targetScheme) raise("Invalid authorization scheme");

  const parsing = mapSchemeZod[targetScheme].safeParse(
    Object.fromEntries(new URLSearchParams(paramsEncoded))
  );
  const params: SchemeParams<TScheme> = parsing.success
    ? parsing.data
    : raise("Invalid authorization parameters", parsing.error);

  return { scheme: targetScheme, params };
}
