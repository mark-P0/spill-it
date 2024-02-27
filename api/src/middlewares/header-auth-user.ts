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

class ResponseAsError<T extends Response> extends Error {
  constructor(public res: T) {
    super("Express response packaged as an error");
  }
}

export async function convertHeaderAuthToUser<T extends Response>(
  res: T,
  authorization: string,
): Promise<Result<UserPublic, ResponseAsError<T>>> {
  logger.info("Parsing header authorization...");
  const headerAuthResult = safe(() =>
    parseHeaderAuth("SPILLITSESS", authorization),
  );
  if (!headerAuthResult.success) {
    logger.error(formatError(headerAuthResult.error));
    const error = new ResponseAsError(res.sendStatus(StatusCodes.BAD_REQUEST));
    return { success: false, error };
  }
  const headerAuth = headerAuthResult.value;

  logger.info("Verifying session signature...");
  const { id, signature } = headerAuth.params;
  const isValidSignatureResult = safe(() =>
    isSignatureValid(env.HMAC_KEY, id, signature),
  );
  if (!isValidSignatureResult.success) {
    logger.error(formatError(isValidSignatureResult.error));
    const error = new ResponseAsError(
      res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR),
    );
    return { success: false, error };
  }
  const isValidSignature = isValidSignatureResult.value;

  if (!isValidSignature) {
    logger.error("Invalid signature");
    const error = new ResponseAsError(res.sendStatus(StatusCodes.UNAUTHORIZED));
    return { success: false, error };
  }

  logger.info("Fetching session info...");
  const sessionResult = await safeAsync(() => readSessionWithUser(id));
  if (!sessionResult.success) {
    logger.error(formatError(sessionResult.error));
    const error = new ResponseAsError(res.sendStatus(StatusCodes.BAD_GATEWAY));
    return { success: false, error };
  }
  const session = sessionResult.value;

  logger.info("Verifying session...");
  if (session === null) {
    logger.error("Session does not exist");
    const error = new ResponseAsError(res.sendStatus(StatusCodes.UNAUTHORIZED));
    return { success: false, error };
  }
  if (isSessionExpired(session)) {
    logger.error("Session is expired");
    const error = new ResponseAsError(res.sendStatus(StatusCodes.UNAUTHORIZED));
    return { success: false, error };
  }

  const { user } = session;
  return { success: true, value: user };
}
