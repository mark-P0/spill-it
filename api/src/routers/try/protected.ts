import { endpoint, endpointHandler } from "@spill-it/endpoints";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { isSessionExpired, readSessionFromUUID } from "../../../data/sessions";
import { formatError } from "../../utils/errors";
import { parseHeaderAuth } from "../../utils/express";
import { localizeLogger } from "../../utils/logger";
import { safe, safeAsync } from "../../utils/try-catch";
import { TryRouter } from "../try";

const logger = localizeLogger(import.meta.url);

TryRouter.get(
  ...endpointHandler("/try/unprotected", (req, res, next) => {
    res.json({
      success: true,
      data: {
        resource: "unprotected",
        access: true,
      },
    });
  })
);

TryRouter.get(
  ...endpointHandler("/try/protected", async (req, res, next) => {
    logger.info("Parsing headers...");
    const parsingHeaders = z
      .object({ authorization: z.string() })
      .safeParse(req.headers);
    if (!parsingHeaders.success) {
      logger.error("Invalid headers");
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Invalid headers",
      });
    }
    const headers = parsingHeaders.data;

    const resultHeaderAuth = safe(() =>
      parseHeaderAuth("SPILLITSESS", headers.authorization)
    );
    if (!resultHeaderAuth.success) {
      logger.error(formatError(resultHeaderAuth.error));
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Invalid headers",
      });
    }
    const headerAuth = resultHeaderAuth.value;

    logger.info("Fetching session info...");
    const { id } = headerAuth.params;
    const resultSession = await safeAsync(() => readSessionFromUUID(id));
    if (!resultSession.success) {
      logger.error(formatError(resultSession.error));
      return res.status(StatusCodes.BAD_GATEWAY).json({
        success: false,
        error: "Read session failed",
      });
    }

    const session = resultSession.value;
    if (session === null) {
      logger.info("Session does not exist");
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: "Session not found",
      });
    }
    if (isSessionExpired(session)) {
      logger.info("Session is expired");
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: "Session expired",
      });
    }

    logger.info("Session verified; providing requested resource...");
    res.json({
      success: true,
      data: {
        resource: "protected",
        access: id,
      },
    });
  })
);
