import { parseHeaderAuth } from "@spill-it/auth/headers";
import { isSignatureValid } from "@spill-it/auth/signing";
import { UserPublic } from "@spill-it/db/schema/drizzle";
import { readFollowBetweenUsers } from "@spill-it/db/tables/follows";
import {
  isSessionExpired,
  readSessionWithUser,
} from "@spill-it/db/tables/sessions";
import { readUser } from "@spill-it/db/tables/users";
import { formatError } from "@spill-it/utils/errors";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "./utils/env";
import { localizeLogger } from "./utils/logger";

const logger = localizeLogger(__filename);

/** Same functions as `Result` type at `@spill-it/utils/safe` */
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

/**
 * Ensure `requestingUserId` is allowed|authorized|"has permissions" to view
 * the data (e.g. posts, followers) of `requestedUserId`
 */
export async function ensureAllowedToViewDataOfAnotherUser<T extends Response>(
  res: T,
  requestedUserId: UserPublic["id"],
  requestingUserId: UserPublic["id"] | undefined,
): Promise<MiddlewareResult<null, T>> {
  logger.info("Fetching info of data owner...");
  const requestedUserResult = await safeAsync(() => readUser(requestedUserId));
  if (!requestedUserResult.success) {
    logger.error(formatError(requestedUserResult.error));
    res.sendStatus(StatusCodes.BAD_GATEWAY);
    return { success: false, res };
  }
  const requestedUser = requestedUserResult.value;

  if (requestedUser === null) {
    logger.error("Data owner does not exist");
    res.sendStatus(StatusCodes.BAD_REQUEST);
    return { success: false, res };
  }
  if (!requestedUser.isPrivate) {
    return { success: true, value: null };
  }
  /* At this point, data owner is private */

  if (requestingUserId === undefined) {
    logger.error("Requested private data without authentication");
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return { success: false, res };
  }
  if (requestingUserId === requestedUser.id) {
    logger.warn("Data owner is self; allowing...");
    return { success: true, value: null };
  }
  /* At this point, data owner is another user */

  logger.info("Fetching follow relationship with data owner...");
  const followResult = await safeAsync(() =>
    readFollowBetweenUsers(requestingUserId, requestedUser.id),
  );
  if (!followResult.success) {
    logger.error(formatError(followResult.error));
    res.sendStatus(StatusCodes.BAD_GATEWAY);
    return { success: false, res };
  }
  const follow = followResult.value;

  if (follow === null) {
    logger.error("Requested private data without following owner");
    res.sendStatus(StatusCodes.FORBIDDEN);
    return { success: false, res };
  }
  if (!follow.isAccepted) {
    logger.error("Requested private data with pending follow request to owner");
    res.sendStatus(StatusCodes.FORBIDDEN);
    return { success: false, res };
  }

  return { success: true, value: null };
}
