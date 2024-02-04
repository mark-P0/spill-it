import { endpointDetails } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { convertHeaderAuthToUser } from "../middlewares/header-auth-user";
import { parseInputFromRequest } from "../utils/endpoints";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const UsersRouter = Router();

{
  const details = endpointDetails("/api/v0/users/me", "GET");
  const [ep, method, signature, methodLower] = details;
  type Input = z.infer<typeof signature.input>;
  type Output = z.infer<typeof signature.output>;

  UsersRouter[methodLower](ep, async (req, res, next) => {
    logger.info("Parsing input...");
    const inputParsing = parseInputFromRequest(ep, method, req);
    if (!inputParsing.success) {
      logger.error(formatError(inputParsing.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = inputParsing.value;

    logger.info("Converting header authorization to user info...");
    const { headers } = input;
    const userResult = await convertHeaderAuthToUser(headers.Authorization);
    if (!userResult.success) {
      return res.sendStatus(userResult.error.statusCode);
    }
    const user = userResult.value;

    logger.info("Sending user info...");
    const output: Output = {
      data: user,
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
