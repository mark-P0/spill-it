import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { endpoints, parseHeaderAuthSession } from "../../utils/express";
import { localizeLogger } from "../../utils/logger";
import { safe } from "../../utils/try-catch";
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

TryRouter.get(endpoints.try.protected, (req, res, next) => {
  logger.info("Parsing headers...");
  const parsingHeaderAuth = safe(() => parseHeaderAuthSession(req.headers));
  if (!parsingHeaderAuth.success) {
    logger.error(parsingHeaderAuth.error.stack);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid headers" });
  }
  const headerAuth = parsingHeaderAuth.value;

  const { id } = headerAuth.params;
  // TODO if expired(id) UNAUTHORIZED

  res.status(StatusCodes.NOT_IMPLEMENTED).json({
    data: {
      resource: "protected",
      access: id,
    },
  });
});
