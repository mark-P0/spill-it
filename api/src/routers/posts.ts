import {
  createPost,
  readPost,
  readPostsOfUser,
} from "@spill-it/db/tables/posts";
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
import { stringify as jsonPack } from "superjson";
import { z } from "zod";
import { endpointWithParam, parseInputFromRequest } from "../utils/endpoints";
import { apiHost } from "../utils/hosts";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const PostsRouter = Router();

{
  const details = endpointDetails("/api/v0/posts/:postId", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
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

    logger.info("Parsing URL params...");
    const paramsParsing = z
      .object({
        postId: z.coerce.number(),
      })
      .safeParse(req.params);
    if (!paramsParsing.success) {
      logger.error(formatError(paramsParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const params = paramsParsing.data;

    logger.info("Fetching post...");
    const postResult = await safeAsync(() => readPost(params.postId));
    if (!postResult.success) {
      logger.error(formatError(postResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const post = postResult.value;

    if (post === null) {
      logger.error("Requested post does not exist");
      return res.sendStatus(StatusCodes.NOT_FOUND);
    }

    // TODO Allow viewing of posts other than user's? e.g. when following, public posts, etc.
    logger.info("Checking authorization...");
    const isPostOfUser = post.userId === user.id;
    if (!isPostOfUser) {
      logger.error("Post is not of user");
      return res.sendStatus(StatusCodes.FORBIDDEN);
    }

    logger.info("Sending post info...");
    res.json({
      data: post,
    });
  });
}

{
  const details = endpointDetails("/api/v0/posts", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[methodLower](ep, async (req, res: Response<Output>, next) => {
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

    logger.info("Fetching user posts...");
    const postsResult = await safeAsync(() => readPostsOfUser(user.id));
    if (!postsResult.success) {
      logger.error(formatError(postsResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const posts = postsResult.value;

    logger.info("Sending user posts...");
    res.json({
      data: posts,
    });
  });
}

{
  const details = endpointDetails("/api/v0/posts", "POST");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[methodLower](ep, async (req, res, next) => {
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

    logger.info("Creating post link...");
    const linkResult = safe(
      () =>
        new URL(
          endpointWithParam("/api/v0/posts/:postId", { postId: `${post.id}` }),
          apiHost,
        ).href,
    );
    if (!linkResult.success) {
      logger.error(formatError(linkResult.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
    const link = linkResult.value;

    logger.info("Sending post info...");
    const output: Output = {
      data: post,
      links: { self: link },
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
