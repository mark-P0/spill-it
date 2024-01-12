import { Router } from "express";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";

const logger = localizeLogger(import.meta.url);

export const LogoutRouter = Router();

/* TODO Use POST method? https://www.passportjs.org/concepts/authentication/logout/ */
LogoutRouter.get(endpoints.api.v0.logout, (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }

    logger.info("Redirecting after logout");
    res.redirect(endpoints["/"]);
  });
});
