import {
  createPost,
  deletePost,
  readPost,
  readPostsOfUserBeforeTimestamp,
} from "@spill-it/db/tables/posts";
import { POST_CT_CAP } from "@spill-it/db/utils/constants";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertHeaderAuthToUser } from "../middlewares/header-auth-user";
import { endpointWithParam } from "../utils/endpoints";
import { apiHost } from "../utils/env";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const PostsRouter = Router();

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
    const input = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
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

    logger.info("Sending post info...");
    const result = safe(() => {
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
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
    const input = inputParsing.data;

    const { headers, query } = input;
    const { beforeISODateStr, size } = query;

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
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
    }
    const user = userResult.value;

    // TODO Check if user is authorized to view posts of queried user ID

    logger.info("Fetching posts...");
    const userId = query.userId ?? user.id;
    const postsResult = await safeAsync(() =>
      readPostsOfUserBeforeTimestamp(userId, beforeISODate, size),
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

    logger.info("Sending posts...");
    const result = safe(() => {
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
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
    const input = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
    }
    const user = userResult.value;

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

    logger.info("Sending post info...");
    const result = safe(() => {
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
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
    const input = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
    }
    const user = userResult.value;

    logger.info("Fetching post...");
    const { query } = input;
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

    logger.info("Sending response...");
    const result = safe(() => {
      const rawOutput = jsonPack(output);
      return res.send(rawOutput);
    });
    if (!result.success) {
      logger.error(formatError(result.error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
  });
}
