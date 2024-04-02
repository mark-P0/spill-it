import {
  exchangeCodeForTokens,
  extractGoogleInfoFromJwt,
} from "@spill-it/auth/google";
import { buildHeaderAuth, parseHeaderAuth } from "@spill-it/auth/headers";
import { sign } from "@spill-it/auth/signing";
import {
  createSession,
  deleteSession,
  isSessionExpired,
  readSessionOfGuest,
  readSessionViaUser,
} from "@spill-it/db/tables/sessions";
import {
  createUserFromGoogle,
  readUserViaGoogleId,
} from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { env } from "../utils/env";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const SessionsRouter = Router();

{
  const details = endpointDetails("/api/v0/sessions/guest", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  SessionsRouter[method](ep, async (req, res, next) => {
    logger.info("Fetching guest session...");
    const sessionResult = await safeAsync(() => readSessionOfGuest());
    if (!sessionResult.success) {
      logger.error(formatError(sessionResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const session = sessionResult.value;

    logger.info("Signing session ID...");
    const sessionIdSignatureResult = safe(() => sign(env.HMAC_KEY, session.id));
    if (!sessionIdSignatureResult.success) {
      logger.error(formatError(sessionIdSignatureResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const sessionIdSignature = sessionIdSignatureResult.value;

    logger.info("Building authorization header string...");
    const authResult = safe(() =>
      buildHeaderAuth("SPILLITSESS", {
        id: session.id,
        signature: sessionIdSignature,
      }),
    );
    if (!authResult.success) {
      logger.error(formatError(authResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const Authorization = authResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      Authorization,
    } satisfies Output);
    if (!outputParsing.success) {
      logger.error(formatError(outputParsing.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const output = outputParsing.data;

    logger.info("Packaging output...");
    const rawOutputResult = safe(() => jsonPack(output));
    if (!rawOutputResult.success) {
      logger.error(formatError(rawOutputResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const rawOutput = rawOutputResult.value;

    logger.info("Sending guest session ID...");
    return res.send(rawOutput);
  });
}

/** Get a session ID using Google authorization code */
{
  const details = endpointDetails("/api/v0/sessions", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  SessionsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers } = inputParsing.data;

    const headerAuthResult = safe(() =>
      parseHeaderAuth("SPILLITGOOGLE", headers.Authorization),
    );
    if (!headerAuthResult.success) {
      logger.error(formatError(headerAuthResult.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = headerAuthResult.value;

    logger.info("Fetching Google info...");
    const { code, redirectUri } = headerAuth.params;
    const infoResult = await safeAsync(async () => {
      const tokens = await exchangeCodeForTokens(
        env.AUTH_GOOGLE_CLIENT_ID,
        env.AUTH_GOOGLE_CLIENT_SECRET,
        code,
        redirectUri,
      );
      const googleInfo = await extractGoogleInfoFromJwt(tokens.id_token);
      return googleInfo;
    });
    if (!infoResult.success) {
      logger.error(formatError(infoResult.error));
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }
    const info = infoResult.value;

    logger.info("Fetching user info...");
    const { googleId } = info;
    const userResult = await safeAsync(() => readUserViaGoogleId(googleId));
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    let user = userResult.value;

    if (user === null) {
      logger.info("User does not exist; creating...");
      const { name, picture } = info;
      const userResult = await safeAsync(() =>
        createUserFromGoogle(googleId, name, picture),
      );
      if (!userResult.success) {
        logger.error(formatError(userResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      user = userResult.value;
    }
    user satisfies NonNullable<typeof user>;

    logger.info("Fetching user session...");
    const userId = user.id; // For some reason TS will not accept nesting this in below
    const sessionResult = await safeAsync(() => readSessionViaUser(userId));
    if (!sessionResult.success) {
      logger.error(formatError(sessionResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    let session = sessionResult.value;

    const hasSessionButExpired = session !== null && isSessionExpired(session);
    if (session !== null && hasSessionButExpired) {
      logger.info("Session expired; deleting...");
      // TODO Have a background task that regularly deletes expired sessions?
      const sessionId = session.id;
      const deleteResult = await safeAsync(() => deleteSession(sessionId));
      if (!deleteResult.success) {
        logger.error(formatError(deleteResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
    }

    if (session === null || hasSessionButExpired) {
      logger.info("Session does not exist; creating...");
      const sessionResult = await safeAsync(() => createSession(userId));
      if (!sessionResult.success) {
        logger.error(formatError(sessionResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      session = sessionResult.value;
    }
    session satisfies NonNullable<typeof session>;

    logger.info("Signing session ID...");
    const sessionId = session.id;
    const sessionIdSignatureResult = safe(() => sign(env.HMAC_KEY, sessionId));
    if (!sessionIdSignatureResult.success) {
      logger.error(formatError(sessionIdSignatureResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const sessionIdSignature = sessionIdSignatureResult.value;

    logger.info("Building authorization header string...");
    const authResult = safe(() =>
      buildHeaderAuth("SPILLITSESS", {
        id: sessionId,
        signature: sessionIdSignature,
      }),
    );
    if (!authResult.success) {
      logger.error(formatError(authResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const Authorization = authResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      Authorization,
    } satisfies Output);
    if (!outputParsing.success) {
      logger.error(formatError(outputParsing.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const output = outputParsing.data;

    logger.info("Packaging output...");
    const rawOutputResult = safe(() => jsonPack(output));
    if (!rawOutputResult.success) {
      logger.error(formatError(rawOutputResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const rawOutput = rawOutputResult.value;

    logger.info("Sending session ID...");
    return res.send(rawOutput);
  });
}
