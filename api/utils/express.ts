import { z } from "zod";
import { localizeLogger } from "./logger";
import { splitAtFirstInstance } from "./strings";

const logger = localizeLogger(import.meta.url);

function buildKeySequence(key: string, parent: string, sep = "/") {
  if (key === "/" && parent === "") {
    return "/";
  }
  if (key === "/") {
    return parent;
  }
  return `${parent}${sep}${key}`;
}

type EndpointMap = { [key: string]: EndpointMap | string };
/** Heavily based on https://stackoverflow.com/a/65883097 */
function assignEndpoints(obj: EndpointMap, parent = "") {
  for (const [key, value] of Object.entries(obj)) {
    const sequence = buildKeySequence(key, parent);

    if (typeof value === "object") {
      assignEndpoints(value, sequence);
    } else {
      obj[key] = sequence;
    }
  }
}

export const endpoints = {
  "/": "",
  api: {
    v0: {
      users: { me: "" },
      sessions: { google: "" },
    },
  },
  try: {
    hello: "",
    sample: "",
    protected: "",
    unprotected: "",
    "not-found": "",
    error: "",
    ui: {
      login: {
        google: {
          "/": "",
          redirect: "",
        },
      },
    },
  },
};
assignEndpoints(endpoints);
logger.info(
  "Using the following endpoints: " + JSON.stringify(endpoints, undefined, 1)
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
  if (scheme !== targetScheme) {
    throw new Error("Invalid authorization scheme");
  }

  const parsingParams = mapSchemeZod[targetScheme].safeParse(
    Object.fromEntries(
      givenParams
        .split(sep.params)
        .map((entryStr) => entryStr.split(sep.paramEntry))
    )
  );
  if (!parsingParams.success) {
    throw new Error("Invalid authorization parameters");
  }

  const params: z.infer<MapSchemeZod[TScheme]> = parsingParams.data;
  return { scheme: targetScheme, params };
}
export function parseHeaderAuthGoogle(possibleHeaders: unknown) {
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(possibleHeaders);
  if (!parsingHeaders.success) {
    throw new Error("Invalid headers");
  }
  const headers = parsingHeaders.data;

  return parseAuth("SPILLITGOOGLE", headers.authorization);
}
export function parseHeaderAuthSession(possibleHeaders: unknown) {
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(possibleHeaders);
  if (!parsingHeaders.success) {
    throw new Error("Invalid headers");
  }
  const headers = parsingHeaders.data;

  return parseAuth("SPILLITSESS", headers.authorization);
}
