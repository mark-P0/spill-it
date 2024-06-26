import { UserPublic } from "@spill-it/db/schema/drizzle";
import {
  createFollow,
  deleteFollowBetweenUsers,
  readFollowBetweenUsers,
  readFollowers,
  readFollowings,
  updateFollow,
} from "@spill-it/db/tables/follows";
import { readUser } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  MiddlewareResult,
  convertHeaderAuthToUser,
  ensureAllowedToViewDataOfAnotherUser,
} from "../middlewares";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const FollowsRouter = Router();

{
  const details = endpointDetails("/api/v0/follows", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
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

    logger.info("Fetching follow info...");
    const followResult = await safeAsync(() =>
      readFollowBetweenUsers(user.id, query.followingUserId),
    );
    if (!followResult.success) {
      logger.error(formatError(followResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const follow = followResult.value;

    if (follow === null) {
      logger.error("Follow entry does not exist");
      return res.sendStatus(StatusCodes.NOT_FOUND);
    }

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: follow,
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

    logger.info("Sending follow entry...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/follows", "PATCH");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query, body } = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    logger.info("Fetching follow entry to update...");
    const followResult = await safeAsync(() =>
      readFollowBetweenUsers(query.followerUserId, user.id),
    );
    if (!followResult.success) {
      logger.error(formatError(followResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const follow = followResult.value;

    if (follow === null) {
      logger.error("Follow entry to update does not exist");
      return res.sendStatus(StatusCodes.NOT_FOUND);
    }

    logger.info("Updating follow entry...");
    const updatedFollowResult = await safeAsync(() =>
      updateFollow(follow.id, body.details),
    );
    if (!updatedFollowResult.success) {
      logger.error(formatError(updatedFollowResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const updatedFollow = updatedFollowResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: updatedFollow,
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

    logger.info("Sending updated follow entry...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/follows", "POST");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
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

    logger.info("Checking if user to follow exists...");
    const { followingUserId } = query;
    const userToFollowResult = await safeAsync(() => readUser(followingUserId));
    if (!userToFollowResult.success) {
      logger.error(formatError(userToFollowResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const userToFollow = userToFollowResult.value;
    if (userToFollow === null) {
      logger.error("User to follow does not exist");
      return res.sendStatus(StatusCodes.BAD_REQUEST); // "Not Found" also seems fitting but the "user to follow" is not the primary target of the request
    }

    logger.info("Checking if follow entry is possible...");
    const followerUserId = user.id;
    {
      if (followerUserId === followingUserId) {
        logger.error("Cannot follow self");
        return res.sendStatus(StatusCodes.BAD_REQUEST);
      }
    }
    {
      const followResult = await safeAsync(() =>
        readFollowBetweenUsers(followerUserId, followingUserId),
      );
      if (!followResult.success) {
        logger.error(formatError(followResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      const follow = followResult.value;
      if (follow !== null) {
        logger.error("Follow entry already exists");
        return res.sendStatus(StatusCodes.CONFLICT); // TODO Respond with existing entry?
      }
    }

    logger.info("Creating follow entry...");
    const isAccepted = !userToFollow.isPrivate; // Follows are accepted by default if the user to follow is public
    const followResult = await safeAsync(() =>
      createFollow({ followerUserId, followingUserId, isAccepted }),
    );
    if (!followResult.success) {
      logger.error(formatError(followResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const follow = followResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: follow,
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

    logger.info("Sending follow entry...");
    return res.send(rawOutput);
  });
}

{
  const details = endpointDetails("/api/v0/follows", "DELETE");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
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

    logger.info("Determining user IDs...");
    const userIdsResult = determineUserIds(res, query, user);
    if (!userIdsResult.success) {
      return userIdsResult.res;
    }
    const { followerUserId, followingUserId } = userIdsResult.value;

    logger.info("Checking if follow entry is possible...");
    {
      if (followerUserId === followingUserId) {
        logger.error("Self-following should not be possible...");
        return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
    {
      const followResult = await safeAsync(() =>
        readFollowBetweenUsers(followerUserId, followingUserId),
      );
      if (!followResult.success) {
        logger.error(formatError(followResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      const follow = followResult.value;
      if (follow === null) {
        logger.error("Follow entry does not exist");
        return res.sendStatus(StatusCodes.BAD_REQUEST);
      }
    }

    logger.info("Deleting follow entry...");
    const deleteResult = await safeAsync(() =>
      deleteFollowBetweenUsers(followerUserId, followingUserId),
    );
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

    logger.info("Sending output...");
    return res.send(rawOutput);
  });

  type FollowUserIds = {
    followerUserId: string;
    followingUserId: string;
  };
  function determineUserIds<T extends Response>(
    res: T,
    query: Input["query"],
    user: UserPublic,
  ): MiddlewareResult<FollowUserIds, T> {
    const { followerUserId, followingUserId } = query;

    if (followerUserId !== undefined && followingUserId === undefined) {
      return {
        success: true,
        value: {
          followerUserId: followerUserId,
          followingUserId: user.id,
        },
      };
    }
    if (followerUserId === undefined && followingUserId !== undefined) {
      return {
        success: true,
        value: {
          followerUserId: user.id,
          followingUserId: followingUserId,
        },
      };
    }

    if (followerUserId === undefined || followingUserId === undefined) {
      logger.error("At least one (1) user ID must be provided");
      res.sendStatus(StatusCodes.BAD_REQUEST);
      return { success: false, res };
    }
    /* At this point, both user IDs are provided */

    /* Providing both IDs is only valid if at least one of them is of the requesting user */
    if (followerUserId === user.id || followingUserId === user.id) {
      return {
        success: true,
        value: { followerUserId, followingUserId },
      };
    }

    /* Neither of the provided IDs are of the requesting user */
    logger.error("Cannot perform actions on follow entry of other users");
    res.sendStatus(StatusCodes.FORBIDDEN);
    return { success: false, res };
  }
}

{
  const details = endpointDetails("/api/v0/followers", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query } = inputParsing.data;

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

    logger.info("Checking if followers can be fetched...");
    const permissionResult = await ensureAllowedToViewDataOfAnotherUser(
      res,
      query.userId,
      user?.id,
    );
    if (!permissionResult.success) {
      return permissionResult.res;
    }

    logger.info("Fetching followers...");
    const followingUserId = query.userId;
    const followersResult = await safeAsync(() =>
      readFollowers(followingUserId),
    );
    if (!followersResult.success) {
      logger.error(formatError(followersResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const followers = followersResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: followers,
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

    logger.info("Sending output...");
    return res.send(rawOutput);
  });
}
{
  const details = endpointDetails("/api/v0/followings", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  FollowsRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const { headers, query } = inputParsing.data;

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

    logger.info("Checking if followings can be fetched...");
    const permissionResult = await ensureAllowedToViewDataOfAnotherUser(
      res,
      query.userId,
      user?.id,
    );
    if (!permissionResult.success) {
      return permissionResult.res;
    }

    logger.info("Fetching followings...");
    const followerUserId = query.userId;
    const followingsResult = await safeAsync(() =>
      readFollowings(followerUserId),
    );
    if (!followingsResult.success) {
      logger.error(formatError(followingsResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const followings = followingsResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: followings,
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

    logger.info("Sending output...");
    return res.send(rawOutput);
  });
}
