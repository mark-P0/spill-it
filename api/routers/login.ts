import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";
import { TryRouter } from "./try";

export const LoginRouter = Router();

passport.use(GoogleStrategy);
LoginRouter.get("/google", passport.authenticate("google")); // [Google Login] Step 1: Trigger login; will redirect to Google
/* [Google Login] Step 2: Actually log in on Google's UI */
LoginRouter.get(
  "/google/redirect", // [Google Login] Step 3: Google will redirect to here
  passport.authenticate("google"), // [Google Login] Step 4: Call again to trigger strategy callback
  (req, res, next) => {
    res.redirect("/try/user");
  }
);

TryRouter.get("/user", (req, res, next) => {
  res.json({ data: req.user });
});
