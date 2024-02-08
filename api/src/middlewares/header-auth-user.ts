import { parseHeaderAuth } from "@spill-it/auth/headers";
import { isSignatureValid } from "@spill-it/auth/signing";
import { User } from "@spill-it/db/schema";
import {
  isSessionExpired,
  readSessionWithUser,
} from "@spill-it/db/tables/sessions";
import { formatError } from "@spill-it/utils/errors";
import { Result, safe, safeAsync } from "@spill-it/utils/safe";
import { StatusCodes } from "http-status-codes";
import { env } from "../utils/env";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);

class StatusCodeError extends Error {
  constructor(public statusCode: StatusCodes) {
    super(`Error of status code ${statusCode}`);
  }
}

export async function convertHeaderAuthToUser(
  authorization: string,
): Promise<Result<User, StatusCodeError>> {
  logger.info("Parsing header authorization...");
  const headerAuthResult = safe(() =>
    parseHeaderAuth("SPILLITSESS", authorization),
  );
  if (!headerAuthResult.success) {
    logger.error(formatError(headerAuthResult.error));
    const error = new StatusCodeError(StatusCodes.BAD_REQUEST);
    return { success: false, error };
  }
  const headerAuth = headerAuthResult.value;

  logger.info("Verifying session signature...");
  const { id, signature } = headerAuth.params;
  const isValidSignature = isSignatureValid(env.HMAC_KEY, id, signature);
  if (!isValidSignature) {
    logger.error("Invalid signature");
    const error = new StatusCodeError(StatusCodes.UNAUTHORIZED);
    return { success: false, error };
  }

  logger.info("Fetching session info...");
  const sessionResult = await safeAsync(() => readSessionWithUser(id));
  if (!sessionResult.success) {
    logger.error(formatError(sessionResult.error));
    const error = new StatusCodeError(StatusCodes.BAD_GATEWAY);
    return { success: false, error };
  }
  const session = sessionResult.value;

  logger.info("Verifying session...");
  if (session === null) {
    logger.error("Session does not exist");
    const error = new StatusCodeError(StatusCodes.UNAUTHORIZED);
    return { success: false, error };
  }
  if (isSessionExpired(session)) {
    logger.error("Session is expired");
    const error = new StatusCodeError(StatusCodes.UNAUTHORIZED);
    return { success: false, error };
  }

  const { user } = session;
  return { success: true, value: user };
}
