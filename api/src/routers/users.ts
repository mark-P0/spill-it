import {
  isSessionExpired,
  readSessionFromUUID,
} from "@spill-it/db/tables/sessions";
import { readUser } from "@spill-it/db/tables/users";
import { parseHeaderAuth } from "@spill-it/header-auth";
import { formatError } from "@spill-it/utils/errors";
import { safe, safeAsync } from "@spill-it/utils/safe";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { endpointHandler } from "../utils/endpoint-handler";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const UsersRouter = Router();

UsersRouter.get(
  ...endpointHandler("/api/v0/users/me", async (req, res, next) => {
    logger.info("Parsing headers...");
    const parsingHeaders = z
      .object({ authorization: z.string() })
      .safeParse(req.headers);
    if (!parsingHeaders.success) {
      logger.error(formatError(parsingHeaders.error));
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, error: "Invalid headers" });
    }
    const headers = parsingHeaders.data;

    const resultHeaderAuth = safe(() =>
      parseHeaderAuth("SPILLITSESS", headers.authorization),
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, error: "Invalid headers" });
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Fetching session info...");
    const { id } = headerAuth.params;
    const resultSession = await safeAsync(() => readSessionFromUUID(id));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ success: false, error: "Read session failed" });
    }

    const session = resultSession.value;
    if (session === null) {
      logger.error("Session does not exist");
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Session not found" });
    }
    if (isSessionExpired(session)) {
      logger.error("Session is expired");
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Session expired" });
    }

    const resultUser = await safeAsync(() => readUser(session.userId));
    if (!resultUser.success) {
      logger.error(formatError(resultUser.error));
      return res
        .status(StatusCodes.BAD_GATEWAY)
        .json({ success: false, error: "Read user failed" });
    }

    const user = resultUser.value;
    if (user === null) {
      logger.error("User of given session does not exist...?");
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, error: "Invalid session" });
    }

    logger.info("Providing user information...");
    res.json({ success: true, data: user });
  }),
);
