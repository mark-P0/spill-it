import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertCodeIntoGoogleInfo } from "../auth/google-manual";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";
import { safe, safeAsync } from "../utils/try-catch";

function splitAtFirstInstance(str: string, sep: string): [string, string] {
  const sepIdx = str.indexOf(sep);
  if (sepIdx === -1) {
    return [str, ""];
  }

  return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
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
 * Expected `authorization` format is `<scheme> <key>=<value>; <key>=<value>; ... <key>=<value>`
 */
function parseAuthHeaderValue(
  authorization: string,
  scheme = "SPILLITGOOGLE" as const,
  sep = { header: " ", params: "; ", paramEntry: "=" }
) {
  const parts = splitAtFirstInstance(authorization, sep.header);
  const [givenScheme, givenParams] = parts;
  if (givenScheme !== scheme) {
    throw new Error("Invalid authorization scheme");
  }

  const parsingParams = z
    .object({ code: z.string(), redirectedOn: z.string() })
    .safeParse(
      Object.fromEntries(
        givenParams
          .split(sep.params)
          .map((entryStr) => entryStr.split(sep.paramEntry))
      )
    );
  if (!parsingParams.success) {
    throw new Error("Invalid authorization parameters");
  }

  const params = parsingParams.data;
  return { scheme, params };
}

const logger = localizeLogger(import.meta.url);
export const SessionsRouter = Router();

/** Get a session ID using Google authorization code */
SessionsRouter.get(endpoints.api.v0.sessions.google, async (req, res, next) => {
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(req.headers);
  if (!parsingHeaders.success) {
    logger.error(parsingHeaders.error.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }

  const headers = parsingHeaders.data;
  const [authValues, authValuesError] = safe(() =>
    parseAuthHeaderValue(headers.authorization)
  );
  if (authValuesError !== null) {
    logger.error(authValuesError.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid authorization header" });
  }

  const { code, redirectedOn } = authValues.params;
  const [info, infoErrors] = await safeAsync(
    async () => await convertCodeIntoGoogleInfo(code, redirectedOn)
  );
  if (infoErrors !== null) {
    logger.error(infoErrors.stack);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid authorization code" });
  }

  // TODO Create new entry on session table
  // TODO If fail, 502 Data operation failed

  res.json({ data: { headers, authValues, info } });
});
