import { formatError } from "@spill-it/utils/errors";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { buildAuthUrl } from "../../auth/google";
import { endpointHandler } from "../utils/endpoint-handler";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(__filename);
export const LinksRouter = Router();

LinksRouter.get(
  ...endpointHandler("/api/v0/links/google", async (req, res, next) => {
    const parsingQuery = z
      .object({
        redirectUri: z.string().url(),
      })
      .safeParse(req.query);
    if (!parsingQuery.success) {
      logger.error(formatError(parsingQuery.error));
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Invalid query",
      });
    }
    const query = parsingQuery.data;

    const authUrl = await buildAuthUrl(query.redirectUri);
    res.json({
      success: true,
      link: authUrl,
    });
  }),
);
