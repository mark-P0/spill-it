import {
  createFollow,
  readFollowBetweenUsers,
} from "@spill-it/db/tables/follows";
import { readUser } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertHeaderAuthToUser } from "../middlewares/header-auth-user";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const FollowsRouter = Router();

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
    const input = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
    }
    const user = userResult.value;

    logger.info("Checking if user to follow exists...");
    const { followingUserId } = input.query;
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
    const followResult = await safeAsync(() =>
      createFollow({ followerUserId, followingUserId }),
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
