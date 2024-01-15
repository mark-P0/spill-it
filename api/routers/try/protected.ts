import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { isSessionExpired, readSessionFromUUID } from "../../data/sessions";
import { endpoints, parseHeaderAuthSession } from "../../utils/express";
import { localizeLogger } from "../../utils/logger";
import { safe, safeAsync } from "../../utils/try-catch";
import { TryRouter } from "../try";

const logger = localizeLogger(import.meta.url);

TryRouter.get(endpoints.try.unprotected, (req, res, next) => {
  res.json({
    data: {
      resource: "unprotected",
      access: true,
    },
  });
});

TryRouter.get(endpoints.try.protected, async (req, res, next) => {
  logger.info("Parsing headers...");
  const parsingHeaderAuth = safe(() => parseHeaderAuthSession(req.headers));
  if (!parsingHeaderAuth.success) {
    logger.error(parsingHeaderAuth.error.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }
  const headerAuth = parsingHeaderAuth.value;

  logger.info("Fetching session info...");
  const { id } = headerAuth.params;
  const resultSession = await safeAsync(() => readSessionFromUUID(id));
  if (!resultSession.success) {
    logger.error(resultSession.error.stack);
    return res
      .status(StatusCodes.BAD_GATEWAY)
      .json({ error: "Read session failed" });
  }

  const session = resultSession.value;
  if (session === null) {
    logger.info("Session does not exist");
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Session not found" });
  }
  if (isSessionExpired(session)) {
    logger.info("Session is expired");
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Session expired" });
  }

  logger.info("Session verified; providing requested resource...");
  res.json({
    data: {
      resource: "protected",
      access: id,
    },
  });
});
