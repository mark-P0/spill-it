import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertCodeIntoGoogleInfo } from "../auth/google-manual";
import { createUserFromGoogle, readGoogleUser } from "../data/users";
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

  const resultAuthHeaderValue = safe(() =>
    parseAuthHeaderValue(headers.authorization)
  );
  if (!resultAuthHeaderValue.success) {
    logger.error(resultAuthHeaderValue.error.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid authorization header" });
  }
  const authHeaderValue = resultAuthHeaderValue.value;

  const { code, redirectedOn } = authHeaderValue.params;
  const resultInfo = await safeAsync(() =>
    convertCodeIntoGoogleInfo(code, redirectedOn)
  );
  if (!resultInfo.success) {
    logger.error(resultInfo.error.stack);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid authorization code" });
  }
  const info = resultInfo.value;

  const { googleId } = info;
  const resultUser = await safeAsync(() => readGoogleUser(googleId));
  if (!resultUser.success) {
    logger.error(resultUser.error.stack);
    return res
      .status(StatusCodes.BAD_GATEWAY)
      .json({ error: "Read data operation failed" });
  }
  let user = resultUser.value;

  if (user === null) {
    const { name, picture } = info;
    const resultUser = await safeAsync(() =>
      createUserFromGoogle(googleId, name, picture)
    );
    if (!resultUser.success) {
      logger.error(resultUser.error.stack);
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ error: "Create data operation failed" });
    }
    user = resultUser.value;
  }

  // TODO Check if user (as Google ID) exists on session table
  // TODO If fail, 502 Data operation failed

  // TODO If exists, and not expired, 200 {data: {sessionId}}
  // TODO If exists, and expired, create new entry
  // TODO If not exists, create new entry

  // TODO on create new entry: add new row on database
  // TODO IF fail, 502 Data operation failed

  res.json({ data: { headers, authHeaderValue, info, user } });
});
