import { raise } from "@spill-it/utils/errors";
import { safe } from "@spill-it/utils/safe";
import { z } from "zod";

function splitAtFirstInstance(str: string, sep: string): [string, string] {
  const sepIdx = str.indexOf(sep);
  if (sepIdx === -1) {
    return [str, ""];
  }

  return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
}

const mapSchemeParams = {
  SPILLITGOOGLE: z.object({ code: z.string(), redirectUri: z.string() }),
  SPILLITSESS: z.object({ id: z.string().uuid() }),
};
type MapSchemeParams = typeof mapSchemeParams;
export type AuthScheme = keyof MapSchemeParams;
type SchemeParams<T extends AuthScheme> = z.infer<MapSchemeParams[T]>;

export function buildHeaderAuth<TScheme extends AuthScheme>(
  scheme: TScheme,
  params: SchemeParams<TScheme>,
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
  value: string,
) {
  const [scheme, paramsEncoded] = splitAtFirstInstance(value, " ");
  if (scheme !== targetScheme) {
    raise("Invalid authorization scheme");
  }

  const result = safe(() => new URLSearchParams(paramsEncoded));
  const paramsMap = result.success
    ? result.value
    : raise("Invalid authorization parameters", result.error);

  const parsing = mapSchemeParams[targetScheme].safeParse(
    Object.fromEntries(paramsMap),
  );
  const params: SchemeParams<TScheme> = parsing.success
    ? parsing.data
    : raise("Invalid authorization parameters", parsing.error);

  return { scheme: targetScheme, params };
}
