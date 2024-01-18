import { endpointHandler } from "@spill-it/endpoints";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);
export const UsersRouter = Router();

UsersRouter.get(
  ...endpointHandler("/api/v0/users/me", (req, res, next) => {
    // TODO Use session ID in authorization header to determine user info
    logger.warn(
      "Use session ID in authorization header to determine user info"
    );
    res
      .status(StatusCodes.NOT_IMPLEMENTED)
      .json({ success: false, error: "todo" });
  })
);
