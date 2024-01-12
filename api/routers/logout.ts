import { Router } from "express";
import { endpoints } from "../utils/express";

export const LogoutRouter = Router();

/* TODO Use POST method? https://www.passportjs.org/concepts/authentication/logout/ */
LogoutRouter.get(endpoints.api.v0.logout, (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }
    res.redirect(endpoints["/"]);
  });
});
