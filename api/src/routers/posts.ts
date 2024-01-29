import { createPost } from "@spill-it/db/tables/posts";
import {
  isSessionExpired,
  readSessionFromUUID,
} from "@spill-it/db/tables/sessions";
import { readUser } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { parseHeaderAuth } from "@spill-it/header-auth";
import { formatError } from "@spill-it/utils/errors";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const PostsRouter = Router();

{
  const details = endpointDetails("/api/v0/posts", "POST");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter.post(ep, async (req, res: Response<Output>, next) => {
    logger.info("Parsing input...");
    const inputParsing = parseInputFromRequest(ep, method, req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = inputParsing.value;

    const { headers } = input;
    const headerAuthResult = safe(() =>
      parseHeaderAuth("SPILLITSESS", headers.Authorization),
    );
    if (!headerAuthResult.success) {
      logger.error(formatError(headerAuthResult.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = headerAuthResult.value;

    logger.info("Fetching session info...");
    const { id } = headerAuth.params;
    const sessionResult = await safeAsync(() => readSessionFromUUID(id));
    if (!sessionResult.success) {
      logger.error(formatError(sessionResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const session = sessionResult.value;

    logger.info("Verifying session...");
    if (session === null) {
      logger.error("Session does not exist");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }
    if (isSessionExpired(session)) {
      logger.error("Session is expired");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }

    logger.info("Fetching user info...");
    const userResult = await safeAsync(() => readUser(session.userId));
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const user = userResult.value;

    logger.info("Verifying user info...");
    if (user === null) {
      logger.error("User of given session does not exist...?");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }

    logger.info("Creating post...");
    const userId = user.id;
    const { content } = input.body;
    const postResult = await safeAsync(() => createPost({ content, userId }));
    if (!postResult.success) {
      logger.error(formatError(postResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const post = postResult.value;

    logger.info("Sending post info...");
    res.json({ data: post });
  });
}
