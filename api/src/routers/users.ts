import { User } from "@spill-it/db/schema/drizzle";
import { readFollowBetweenUsers } from "@spill-it/db/tables/follows";
import {
  isUsernameCharsValid,
  readUserViaUsername,
  updateUser,
} from "@spill-it/db/tables/users";
import {
  BIO_LEN_MAX,
  BIO_LEN_MIN,
  HANDLE_LEN_MAX,
  HANDLE_LEN_MIN,
  USERNAME_LEN_MAX,
  USERNAME_LEN_MIN,
} from "@spill-it/db/utils/constants";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { removeFalseish } from "@spill-it/utils/falseish";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertHeaderAuthToUser } from "../middlewares/header-auth-user";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const UsersRouter = Router();

{
  const details = endpointDetails("/api/v0/users", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  UsersRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = inputParsing.data;

    // TODO Restrict access?

    logger.info("Routing to other handlers...");
    const { Authorization } = input.headers;
    const { username } = input.query;
    if (username !== undefined) {
      logger.info("Handling username query...");
      return await handleUsernameQuery(res, Authorization, username);
    }

    logger.error("Request likely unsupported; has no handler");
    return res.sendStatus(StatusCodes.BAD_REQUEST);
  });

  async function handleUsernameQuery<T extends Response>(
    res: T,
    Authorization: Input["headers"]["Authorization"],
    username: NonNullable<Input["query"]["username"]>,
  ): Promise<T> {
    logger.info("Fetching user info...");
    const userResult = await safeAsync(() => readUserViaUsername(username));
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const user = userResult.value;

    logger.info("Checking follow acceptance...");
    let followAcceptance: boolean | null = null;
    if (Authorization !== undefined && user !== null) {
      logger.info("Converting header authorization to user info...");
      const requestingUserResult = await convertHeaderAuthToUser(
        res,
        Authorization,
      );
      if (!requestingUserResult.success) {
        return requestingUserResult.error.res;
      }
      const requestingUser = requestingUserResult.value;

      logger.info("Fetching follow info...");
      const followResult = await safeAsync(() =>
        readFollowBetweenUsers(requestingUser.id, user.id),
      );
      if (!followResult.success) {
        logger.error(formatError(followResult.error));
        return res.sendStatus(StatusCodes.BAD_GATEWAY);
      }
      const follow = followResult.value;

      followAcceptance = follow?.isAccepted ?? null;
    }

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: removeFalseish([user !== null && { user, followAcceptance }]),
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

    logger.info("Sending user info...");
    return res.send(rawOutput);
  }
}

{
  const details = endpointDetails("/api/v0/users/me", "GET");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  UsersRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = inputParsing.data;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.error.res;
    }
    const user = userResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: user,
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

    logger.info("Sending user info...");
    return res.send(rawOutput);
  });
}
{
  const details = endpointDetails("/api/v0/users/me", "PATCH");
  const [ep, , signature, method] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  UsersRouter[method](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = signature.input.safeParse(req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = inputParsing.data;

    // TODO Set these on endpoint schema?
    logger.info("Checking provided details...");
    const { details } = input.body;
    {
      logger.info("Checking username...");
      const { username } = details;

      const schema = z
        .string()
        .min(USERNAME_LEN_MIN)
        .max(USERNAME_LEN_MAX)
        .refine(isUsernameCharsValid, "Invalid username characters")
        .optional();
      username satisfies z.infer<typeof schema>;

      const parsing = schema.safeParse(username);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        return res.sendStatus(StatusCodes.BAD_REQUEST);
      }
    }
    {
      logger.info("Checking handle name...");
      const { handleName } = details;

      const schema = z
        .string()
        .min(HANDLE_LEN_MIN)
        .max(HANDLE_LEN_MAX)
        .optional();
      handleName satisfies z.infer<typeof schema>;

      const parsing = schema.safeParse(handleName);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        return res.sendStatus(StatusCodes.BAD_REQUEST);
      }
    }
    {
      logger.info("Checking bio...");
      const { bio } = details;

      const schema = z.string().min(BIO_LEN_MIN).max(BIO_LEN_MAX).optional();
      bio satisfies z.infer<typeof schema>;

      const parsing = schema.safeParse(bio);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        return res.sendStatus(StatusCodes.BAD_REQUEST);
      }
    }

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.error.res;
    }
    const user = userResult.value;

    {
      const { username } = details;
      if (username !== undefined) {
        logger.info("Checking username against database...");
        const existingUser = await readUserViaUsername(username);
        if (existingUser !== null && existingUser.id !== user.id) {
          logger.error("Username already taken");
          return res.sendStatus(StatusCodes.BAD_REQUEST);
        }
      }
    }

    logger.info("Updating user...");
    const updatedUserResult = await safeAsync(() =>
      updateUser(user.id, details),
    );
    if (!updatedUserResult.success) {
      logger.error(formatError(updatedUserResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const updatedUser = updatedUserResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: updatedUser,
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

    logger.info("Sending updated user info...");
    return res.send(rawOutput);
  });
}
