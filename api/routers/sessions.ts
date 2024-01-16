import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { convertCodeIntoGoogleInfo } from "../auth/google";
import {
  createSession,
  deleteSession,
  isSessionExpired,
  readUserSession,
} from "../data/sessions";
import { createUserFromGoogle, readGoogleUser } from "../data/users";
import { endpoint, parseHeaderAuthGoogle } from "../utils/express";
import { localizeLogger } from "../utils/logger";
import { safe, safeAsync } from "../utils/try-catch";

const logger = localizeLogger(import.meta.url);
export const SessionsRouter = Router();

/** Get a session ID using Google authorization code */
const epGoogle = endpoint("/api/v0/sessions/google");
SessionsRouter.get(epGoogle, async (req, res, next) => {
  logger.info("Parsing headers...");
  const parsingHeaderAuth = safe(() => parseHeaderAuthGoogle(req.headers));
  if (!parsingHeaderAuth.success) {
    logger.error(parsingHeaderAuth.error.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }
  const headerAuth = parsingHeaderAuth.value;

  logger.info("Fetching Google info using provided auth params...");
  const { code, redirectedOn } = headerAuth.params;
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

  logger.info("Querying user info on database...");
  const { googleId } = info;
  const resultUser = await safeAsync(() => readGoogleUser(googleId));
  if (!resultUser.success) {
    logger.error(resultUser.error.stack);
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
      logger.error(resultUser.error.stack);
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
    logger.error(resultSession.error.stack);
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
      logger.error(resultDelete.error.stack);
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ error: "Delete expired session failed" });
    }
  }

  if (session === null || hasSessionButExpired) {
    logger.info("Session does not exist; creating...");
    const resultSession = await safeAsync(() => createSession(userId));
    if (!resultSession.success) {
      logger.error(resultSession.error.stack);
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
