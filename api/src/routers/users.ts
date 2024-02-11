import { readUserWithUsername } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
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
    const { username } = input.query;
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
    const userResult = await safeAsync(() => readUserWithUsername(username));
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const user = userResult.value;

    logger.info("Parsing output...");
    const data: Output["data"] = user === null ? [] : [user];
    const outputParsing = signature.output.safeParse({
      data,
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
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      logger.error(formatError(userResult.error));
      return res.sendStatus(userResult.error.statusCode);
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

    logger.info("Sending user info...");
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
