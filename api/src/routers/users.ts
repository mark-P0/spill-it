import {
  isSessionExpired,
  readSessionFromUUID,
} from "@spill-it/db/tables/sessions";
import { readUser } from "@spill-it/db/tables/users";
import { endpointDetails } from "@spill-it/endpoints";
import { parseHeaderAuth } from "@spill-it/header-auth";
import { formatError } from "@spill-it/utils/errors";
import { jsonPack } from "@spill-it/utils/json";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
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
    const parsingInput = parseInputFromRequest(ep, method, req);
    if (!parsingInput.success) {
      logger.error(formatError(parsingInput.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const input = parsingInput.value;

    const { headers } = input;
    const resultHeaderAuth = safe(() =>
      parseHeaderAuth("SPILLITSESS", headers.Authorization),
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res.sendStatus(StatusCodes.BAD_REQUEST);
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Fetching session info...");
    const { id } = headerAuth.params;
    const resultSession = await safeAsync(() => readSessionFromUUID(id));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const session = resultSession.value;

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
    const resultUser = await safeAsync(() => readUser(session.userId));
    if (!resultUser.success) {
      logger.error(formatError(resultUser.error));
      return res.sendStatus(StatusCodes.BAD_GATEWAY);
    }
    const user = resultUser.value;

    logger.info("Verifying user info...");
    if (user === null) {
      logger.error("User of given session does not exist...?");
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    }

    logger.info("Sending user info...");
    const output: Output = {
      data: user,
    };
    const rawOutput = jsonPack(output);
    res.send(rawOutput);
  });
}
