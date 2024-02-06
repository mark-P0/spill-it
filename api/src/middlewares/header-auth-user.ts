import { parseHeaderAuth } from "@spill-it/auth/headers";
import {
  isSessionExpired,
  readSessionFromUUID,
} from "@spill-it/db/tables/sessions";
import { User, readUser } from "@spill-it/db/tables/users";
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

  logger.info("Fetching session info...");
  const { id } = headerAuth.params;
  const resultSession = await safeAsync(() => readSessionFromUUID(id));
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

  logger.info("Fetching user info...");
  const resultUser = await safeAsync(() => readUser(session.userId));
  if (!resultUser.success) {
    logger.error(formatError(resultUser.error));
    const error = new StatusCodeError(StatusCodes.BAD_GATEWAY);
    return { success: false, error };
  }
  const user = resultUser.value;

  logger.info("Verifying user info...");
  if (user === null) {
    logger.error("User of given session does not exist...?");
    const error = new StatusCodeError(StatusCodes.UNAUTHORIZED);
    return { success: false, error };
  }

  return { success: true, value: user };
}
