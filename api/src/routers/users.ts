import { zodBio, zodHandle, zodUsername } from "@spill-it/constraints";
import { readUserViaUsername, updateUser } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { removeFalseish } from "@spill-it/utils/falseish";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { MiddlewareResult, convertHeaderAuthToUser } from "../middlewares";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const UsersRouter = Router();

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
    const { headers, body } = inputParsing.data;

    // TODO Set these on endpoint schema?
    logger.info("Validating provided details...");
    const validationResult = validateDetails(res, body);
    if (!validationResult.success) {
      return validationResult.res;
    }

    logger.info("Converting header authorization to user info...");
    const userResult = await convertHeaderAuthToUser(
      res,
      headers.Authorization,
    );
    if (!userResult.success) {
      return userResult.res;
    }
    const user = userResult.value;

    {
      const { username } = body.details;
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
      updateUser(user.id, body.details),
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

  function validateDetails<T extends Response>(
    res: T,
    body: Input["body"],
  ): MiddlewareResult<null, T> {
    const { details } = body;

    {
      logger.info("Checking username...");
      const { username } = details;

      const parsing = zodUsername.safeParse(username);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        res.sendStatus(StatusCodes.BAD_REQUEST);
        return { success: false, res };
      }
    }

    {
      logger.info("Checking handle name...");
      const { handleName } = details;

      const parsing = zodHandle.safeParse(handleName);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        res.sendStatus(StatusCodes.BAD_REQUEST);
        return { success: false, res };
      }
    }

    {
      logger.info("Checking bio...");
      const { bio } = details;

      const parsing = zodBio.safeParse(bio);
      if (!parsing.success) {
        logger.error(formatError(parsing.error));
        res.sendStatus(StatusCodes.BAD_REQUEST);
        return { success: false, res };
      }
    }

    return { success: true, value: null };
  }
}

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
    const { query } = inputParsing.data;

    // TODO Restrict access?

    logger.info("Routing to other handlers...");
    const { username } = query;
    if (username !== undefined) {
      logger.info("Handling username query...");
      return await handleUsernameQuery(res, username);
    }

    logger.error("Request likely unsupported; has no handler");
    return res.sendStatus(StatusCodes.BAD_REQUEST);
  });

  async function handleUsernameQuery<T extends Response>(
    res: T,
    username: NonNullable<Input["query"]["username"]>,
  ): Promise<T> {
    logger.info("Fetching user info...");
    const userResult = await safeAsync(() => readUserViaUsername(username));
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const user = userResult.value;

    logger.info("Parsing output...");
    const outputParsing = signature.output.safeParse({
      data: removeFalseish([user !== null && user]),
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
