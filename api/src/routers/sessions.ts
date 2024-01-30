import {
  createSession,
  deleteSession,
  isSessionExpired,
  readUserSession,
} from "@spill-it/db/tables/sessions";
import {
  createUserFromGoogle,
  readGoogleUser,
} from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { AuthScheme, parseHeaderAuth } from "@spill-it/header-auth";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertCodeIntoGoogleInfo } from "../auth/google";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const SessionsRouter = Router();

/** Get a session ID using Google authorization code */
{
  const details = endpointDetails("/api/v0/sessions", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  SessionsRouter[methodLower](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const parsingInput = parseInputFromRequest(ep, method, req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.value;

    const { headers } = input;
    const resultHeaderAuth = safe(() =>
      parseHeaderAuth("SPILLITGOOGLE", headers.Authorization),
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Fetching Google info...");
    const { code, redirectUri } = headerAuth.params;
    const resultInfo = await safeAsync(() =>
      convertCodeIntoGoogleInfo(code, redirectUri),
    );
    if (!resultInfo.success) {
      logger.error(formatError(resultInfo.error));
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }
    const info = resultInfo.value;

    logger.info("Fetching user info...");
    const { googleId } = info;
    const resultUser = await safeAsync(() => readGoogleUser(googleId));
    if (!resultUser.success) {
      logger.error(formatError(resultUser.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    let user = resultUser.value;

    if (user === null) {
      logger.info("User does not exist; creating...");
      const { name, picture } = info;
      const resultUser = await safeAsync(() =>
        createUserFromGoogle(googleId, name, picture),
      );
      if (!resultUser.success) {
        logger.error(formatError(resultUser.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      user = resultUser.value;
    }
    user satisfies NonNullable<typeof user>;

    logger.info("Fetching user session...");
    const userId = user.id; // For some reason TS will not accept nesting this in below
    const resultSession = await safeAsync(() => readUserSession(userId));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    let session = resultSession.value;

    const hasSessionButExpired = session !== null && isSessionExpired(session);
    if (session !== null && hasSessionButExpired) {
      logger.info("Session expired; deleting...");
      // TODO Have a background task that regularly deletes expired sessions?
      const sessionId = session.id;
      const resultDelete = await safeAsync(() => deleteSession(sessionId));
      if (!resultDelete.success) {
        logger.error(formatError(resultDelete.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
    }

    if (session === null || hasSessionButExpired) {
      logger.info("Session does not exist; creating...");
      const resultSession = await safeAsync(() => createSession(userId));
      if (!resultSession.success) {
        logger.error(formatError(resultSession.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      session = resultSession.value;
    }
    session satisfies NonNullable<typeof session>;

    logger.info("Sending session ID...");
    const output: Output = {
      data: {
        scheme: "SPILLITSESS" satisfies AuthScheme,
        id: session.uuid,
      },
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
