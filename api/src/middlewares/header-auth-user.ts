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
  const resultHeaderAuth = safe(() =>
    parseHeaderAuth("SPILLITSESS", authorization),
  );
  if (!resultHeaderAuth.success) {
    logger.error(formatError(resultHeaderAuth.error));
    const error = new StatusCodeError(StatusCodes.BAD_REQUEST);
    return { success: false, error };
  }
  const headerAuth = resultHeaderAuth.value;

  logger.info("Verifying session signature...");
  const { id, signature } = headerAuth.params;
  const isValidSignature = isSignatureValid(id, signature);
  if (!isValidSignature) {
    logger.error("Invalid signature");
    const error = new StatusCodeError(StatusCodes.UNAUTHORIZED);
    return { success: false, error };
  }

  logger.info("Fetching session info...");
  const resultSession = await safeAsync(() => readSessionWithUser(id));
  if (!resultSession.success) {
    logger.error(formatError(resultSession.error));
    const error = new StatusCodeError(StatusCodes.BAD_GATEWAY);
    return { success: false, error };
  }
  const session = resultSession.value;

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
