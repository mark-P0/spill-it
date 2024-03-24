import { parseHeaderAuth } from "@spill-it/auth/headers";
import { isSignatureValid } from "@spill-it/auth/signing";
import { UserPublic } from "@spill-it/db/schema/drizzle";
import {
  isSessionExpired,
  readSessionWithUser,
} from "@spill-it/db/tables/sessions";
import { formatError } from "@spill-it/utils/errors";
import { Result, safe, safeAsync } from "@spill-it/utils/safe";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../utils/env";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);

export type MiddlewareResult<TValue, T extends Response> =
  | { success: true; value: TValue }
  | { success: false; res: T };

export async function convertHeaderAuthToUser<T extends Response>(
  res: T,
  authorization: string,
): Promise<MiddlewareResult<UserPublic, T>> {
  logger.info("Parsing header authorization...");
  const headerAuthResult = safe(() =>
    parseHeaderAuth("SPILLITSESS", authorization),
  );
  if (!headerAuthResult.success) {
    logger.error(formatError(headerAuthResult.error));
    res.sendStatus(StatusCodes.BAD_REQUEST);
    return { success: false, res };
  }
  const headerAuth = headerAuthResult.value;

  logger.info("Verifying session signature...");
  const { id, signature } = headerAuth.params;
  const isValidSignatureResult = safe(() =>
    isSignatureValid(env.HMAC_KEY, id, signature),
  );
  if (!isValidSignatureResult.success) {
    logger.error(formatError(isValidSignatureResult.error));
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    return { success: false, res };
  }
  const isValidSignature = isValidSignatureResult.value;

  if (!isValidSignature) {
    logger.error("Invalid signature");
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return { success: false, res };
  }

  logger.info("Fetching session info...");
  const sessionResult = await safeAsync(() => readSessionWithUser(id));
  if (!sessionResult.success) {
    logger.error(formatError(sessionResult.error));
    res.sendStatus(StatusCodes.BAD_GATEWAY);
    return { success: false, res };
  }
  const session = sessionResult.value;

  logger.info("Verifying session...");
  if (session === null) {
    logger.error("Session does not exist");
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return { success: false, res };
  }
  if (isSessionExpired(session)) {
    logger.error("Session is expired");
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return { success: false, res };
  }

  const { user } = session;
  return { success: true, value: user };
}
