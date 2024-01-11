import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";
import { TryRouter } from "./try";

export const LoginRouter = Router();

passport.use(GoogleStrategy);
LoginRouter.get("/google", passport.authenticate("google"));
LoginRouter.get(
  "/google/redirect",
  passport.authenticate("google"),
  (req, res, next) => {
    res.redirect("/try/user");
  }
);

TryRouter.get("/user", (req, res, next) => {
  res.json({ data: req.user });
});
