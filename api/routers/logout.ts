import { Router } from "express";

export const LogoutRouter = Router();

/* TODO Use POST method? https://www.passportjs.org/concepts/authentication/logout/ */
LogoutRouter.get("/", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }
    res.redirect("/");
  });
});
