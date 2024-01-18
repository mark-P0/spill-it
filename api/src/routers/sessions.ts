import { endpoint } from "@spill-it/endpoints";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  createSession,
  deleteSession,
  isSessionExpired,
  readUserSession,
} from "../../data/sessions";
import { createUserFromGoogle, readGoogleUser } from "../../data/users";
import { convertCodeIntoGoogleInfo } from "../auth/google";
import { formatError } from "../utils/errors";
import { parseHeaderAuth } from "../utils/express";
import { localizeLogger } from "../utils/logger";
import { safe, safeAsync } from "../utils/try-catch";

const logger = localizeLogger(import.meta.url);
export const SessionsRouter = Router();

/** Get a session ID using Google authorization code */
SessionsRouter.get(endpoint("/api/v0/sessions"), async (req, res, next) => {
  logger.info("Parsing headers...");
  const parsingHeaders = z
    .object({ authorization: z.string() })
    .safeParse(req.headers);
  if (!parsingHeaders.success) {
    logger.error("Invalid headers");
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }
  const headers = parsingHeaders.data;

  const resultHeaderAuth = safe(() =>
    parseHeaderAuth("SPILLITGOOGLE", headers.authorization)
  );
  if (!resultHeaderAuth.success) {
    logger.error(formatError(resultHeaderAuth.error));
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }
  const headerAuth = resultHeaderAuth.value;

  logger.info("Fetching Google info using provided auth params...");
  const { code, redirectUri } = headerAuth.params;
  const resultInfo = await safeAsync(() =>
    convertCodeIntoGoogleInfo(code, redirectUri)
  );
  if (!resultInfo.success) {
    logger.error(formatError(resultInfo.error));
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid authorization code" });
  }
  const info = resultInfo.value;

  logger.info("Querying user info on database...");
  const { googleId } = info;
  const resultUser = await safeAsync(() => readGoogleUser(googleId));
  if (!resultUser.success) {
    logger.error(formatError(resultUser.error));
    return res
      .status(StatusCodes.BAD_GATEWAY)
      .json({ error: "Read user failed" });
  }
  let user = resultUser.value;

  if (user === null) {
    logger.info("User does not exist; creating...");
    const { name, picture } = info;
    const resultUser = await safeAsync(() =>
      createUserFromGoogle(googleId, name, picture)
    );
    if (!resultUser.success) {
      logger.error(formatError(resultUser.error));
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ error: "Create user failed" });
    }
    user = resultUser.value;
  }
  user satisfies NonNullable<typeof user>;

  logger.info("Querying user session on database...");
  const userId = user.id; // For some reason TS will not accept nesting this in below
  const resultSession = await safeAsync(() => readUserSession(userId));
  if (!resultSession.success) {
    logger.error(formatError(resultSession.error));
    return res
      .status(StatusCodes.BAD_GATEWAY)
      .json({ error: "Read session failed" });
  }
  let session = resultSession.value;

  const hasSessionButExpired = session !== null && isSessionExpired(session);
  if (session !== null && hasSessionButExpired) {
    logger.info("Session expired; deleting...");
    /* TODO Have a background task that regularly deletes expired sessions? */
    const sessionId = session.id;
    const resultDelete = await safeAsync(() => deleteSession(sessionId));
    if (!resultDelete.success) {
      logger.error(formatError(resultDelete.error));
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ error: "Delete expired session failed" });
    }
  }

  if (session === null || hasSessionButExpired) {
    logger.info("Session does not exist; creating...");
    const resultSession = await safeAsync(() => createSession(userId));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ error: "Create session failed" });
    }
    session = resultSession.value;
  }
  session satisfies NonNullable<typeof session>;

  logger.info("Providing session effective ID...");
  const SPILLITSESS = session.uuid;
  return res.json({ data: { SPILLITSESS } });
});