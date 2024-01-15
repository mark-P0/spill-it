import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);
export const UsersRouter = Router();

UsersRouter.get(endpoints.api.v0.users.me, (req, res, next) => {
  // TODO Use session ID in authorization header to determine user info
  logger.warn("Use session ID in authorization header to determine user info");
  res.status(StatusCodes.NOT_IMPLEMENTED).json({ error: "todo" });
});
