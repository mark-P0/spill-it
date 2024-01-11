import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";

export const LoginRouter = Router();

passport.use(GoogleStrategy);
LoginRouter.get("/google", passport.authenticate("google"));
LoginRouter.get("/google/redirect", (req, res, next) => {
  res.json({ data: "Logged in...?" });
});
