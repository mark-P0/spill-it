import { zodSession } from "@spill-it/db/schema-zod";
import { raise } from "@spill-it/utils/errors";
import { safe } from "@spill-it/utils/safe";
import { z } from "zod";

/** Could use `.split()` array approach but is rather inefficient */
function splitAtFirstInstance(str: string, sep: string): [string, string] {
  const sepIdx = str.indexOf(sep);
  if (sepIdx === -1) {
    return [str, ""];
  }

  return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
}

const schemeMap = {
  SPILLITGOOGLE: z.object({ code: z.string(), redirectUri: z.string().url() }),
  SPILLITSESS: z.object({ id: zodSession.shape.id, signature: z.string() }),
};
type SchemeMap = typeof schemeMap;
export type AuthScheme = keyof SchemeMap;
type SchemeParams<T extends AuthScheme> = z.infer<SchemeMap[T]>;

export function buildHeaderAuth<T extends AuthScheme>(
  scheme: T,
  params: SchemeParams<T>,
) {
  const paramsEncoded = new URLSearchParams(params);
  return `${scheme} ${paramsEncoded}`;
}

/**
 * https://stackoverflow.com/a/43164958
 * - Use standard "Authorization" header instead of custom
 * - Can use custom authorization "scheme"
 * - Recommended not to separate parameters with commas
 *
 * https://stackoverflow.com/a/11420667
 * - Parameters follow a `key=value` format
 * - Parameters are separated by comma
 *
 * Current "Authorization" format used is `<scheme> <URLSearchParams({param: value})>`
 */
export function parseHeaderAuth<T extends AuthScheme>(
  targetScheme: T,
  headerAuth: string,
) {
  const [scheme, paramsEncoded] = splitAtFirstInstance(headerAuth, " ");
  if (scheme !== targetScheme) {
    raise("Invalid authorization scheme");
  }

  const paramsDecodedResult = safe(() => new URLSearchParams(paramsEncoded));
  const paramsDecoded = paramsDecodedResult.success
    ? paramsDecodedResult.value
    : raise("Invalid authorization parameters", paramsDecodedResult.error);

  const paramsParsing = schemeMap[targetScheme].safeParse(
    Object.fromEntries(paramsDecoded),
  );
  const params: SchemeParams<T> = paramsParsing.success
    ? paramsParsing.data
    : raise("Invalid authorization parameters", paramsParsing.error);

  return { scheme: targetScheme, params };
}
