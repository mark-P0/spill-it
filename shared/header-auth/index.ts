import { z } from "zod";

function splitAtFirstInstance(str: string, sep: string): [string, string] {
  const sepIdx = str.indexOf(sep);
  if (sepIdx === -1) {
    return [str, ""];
  }

  return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
}

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
  if (scheme !== targetScheme) {
    throw new Error("Invalid authorization scheme");
  }

  const parsing = mapSchemeZod[targetScheme].safeParse(
    Object.fromEntries(new URLSearchParams(paramsEncoded))
  );
  if (!parsing.success) {
    throw new Error("Invalid authorization parameters");
  }

  const params: SchemeParams<TScheme> = parsing.data;
  return { scheme: targetScheme, params };
}
