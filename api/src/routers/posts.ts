import { POST_CT_CAP } from "@spill-it/constraints";
import { UserPublic } from "@spill-it/db/schema/drizzle";
import {
  createPost,
  deletePost,
  readPost,
  readPostsFeedWithAuthorViaUserBeforeTimestamp,
  readPostsWithAuthorViaUserBeforeTimestamp,
} from "@spill-it/db/tables/posts";
import { endpointDetails } from "@spill-it/endpoints";
import { today } from "@spill-it/utils/dates";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  convertHeaderAuthToUser,
  ensureAllowedToViewDataOfAnotherUser,
} from "../middlewares";
import { endpointWithParam } from "../utils/endpoints";
import { apiHost } from "../utils/env";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const PostsRouter = Router();

{
  const details = endpointDetails("/api/v0/posts/feed", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query } = inputParsing.data;

    const beforeISODateStr = query.beforeISODateStr ?? today().toISOString();
    const size = query.size ?? Math.floor(POST_CT_CAP / 2);

    if (size > POST_CT_CAP) {
      logger.error("Requested post count greater than set cap");
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }

    const beforeISODateResult = safe(() => new Date(beforeISODateStr));
    if (!beforeISODateResult.success) {
      logger.error(formatError(beforeISODateResult.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const beforeISODate = beforeISODateResult.value;

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    logger.info("Fetching feed...");
    const userId = user.id;
    const feedResult = await safeAsync(() =>
      readPostsFeedWithAuthorViaUserBeforeTimestamp(
        userId,
        beforeISODate,
        size,
      ),
    );
    if (!feedResult.success) {
      logger.error(formatError(feedResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const feed = feedResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: feed,
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

    logger.info("Sending posts...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/posts/:postId", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers } = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    logger.info("Parsing URL params...");
    const paramsParsing = z
      .object({
        postId: z.string().uuid(),
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

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: post,
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

    logger.info("Sending post info...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/posts", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query } = inputParsing.data;

    const beforeISODateStr = query.beforeISODateStr ?? today().toISOString();
    const size = query.size ?? Math.floor(POST_CT_CAP / 2);

    if (size > POST_CT_CAP) {
      logger.error("Requested post count greater than set cap");
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }

    const beforeISODateResult = safe(() => new Date(beforeISODateStr));
    if (!beforeISODateResult.success) {
      logger.error(formatError(beforeISODateResult.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const beforeISODate = beforeISODateResult.value;

    let user: UserPublic | undefined;
    if (headers.Authorization !== undefined) {
      logger.info("Converting header authorization to user info...");
      const userResult = await convertHeaderAuthToUser(
        res,
        headers.Authorization,
      );
      if (!userResult.success) {
        return userResult.res;
      }
      user = userResult.value;
    }

    logger.info("Determining user whose posts to fetch...");
    const userId = query.userId ?? user?.id;
    if (userId === undefined) {
      logger.error("Cannot determine user");
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }

    logger.info("Checking if posts can be fetched...");
    const permissionResult = await ensureAllowedToViewDataOfAnotherUser(
      res,
      userId,
      user?.id,
    );
    if (!permissionResult.success) {
      return permissionResult.res;
    }

    logger.info("Fetching posts...");
    const postsResult = await safeAsync(() =>
      readPostsWithAuthorViaUserBeforeTimestamp(userId, beforeISODate, size),
    );
    if (!postsResult.success) {
      logger.error(formatError(postsResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const posts = postsResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: posts,
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

    logger.info("Sending posts...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/posts", "POST");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, body } = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    logger.info("Creating post...");
    const { content } = body;
    const userId = user.id;
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

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: post,
      links: { self: link },
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

    logger.info("Sending post info...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/posts", "DELETE");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  PostsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query } = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    logger.info("Fetching post...");
    const postResult = await safeAsync(() => readPost(query.id));
    if (!postResult.success) {
      logger.error(formatError(postResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const post = postResult.value;

    logger.info("Verifying post...");
    if (post === null) {
      logger.error("Requested post does not exist");
      return res.sendStatus(StatusCodes.NOT_FOUND);
    }

    logger.info("Checking authorization...");
    const isPostOfUser = post.userId === user.id;
    if (!isPostOfUser) {
      logger.error("Post is not of user");
      return res.sendStatus(StatusCodes.FORBIDDEN);
    }

    logger.info("Deleting post...");
    const deleteResult = await safeAsync(() => deletePost(post.id));
    if (!deleteResult.success) {
      logger.error(formatError(deleteResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({} satisfies Output);
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

    logger.info("Sending response...");
    return res.send(rawOutput);
  });
}
