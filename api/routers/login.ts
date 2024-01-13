import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";
import { endpoints } from "../utils/express";
import { localizeLogger } from "../utils/logger";
import { isFalseish } from "../utils/operations";
import { TryRouter } from "./try";

const logger = localizeLogger(import.meta.url);

export const LoginRouter = Router();

LoginRouter.get(endpoints.api.v0.login["/"], (req, res, next) => {
  logger.info("Defaulting login to Google");
  res.redirect(endpoints.api.v0.login.google["/"]);
});

passport.use(GoogleStrategy);
LoginRouter.get(
  endpoints.api.v0.login.google["/"],
  (req, res, next) => {
    logger.info("Logging in with Google");
    next();
  },
  passport.authenticate("google") // [Google Login] Step 1: Trigger login; will redirect to Google
);
/* [Google Login] Step 2: Actually log in on Google's UI */
LoginRouter.get(
  endpoints.api.v0.login.google.redirect, // [Google Login] Step 3: Google will redirect to here
  (req, res, next) => {
    logger.info("Redirected from Google");
    next();
  },
  passport.authenticate("google"), // [Google Login] Step 4: Call again to trigger strategy callback
  (req, res, next) => {
    logger.info("Redirecting to user info");
    res.redirect(endpoints.api.v0.users.me);
  }
);

/* DELETEME */
{
  TryRouter.get(endpoints.try.unprotected, (req, res, next) => {
    res.json({
      data: "This is an unprotected resource. It can be accessed by anyone, logged in or not.",
    });
  });
  TryRouter.get(
    endpoints.try.protected,
    (req, res, next) => {
      if (isFalseish(req.user)) {
        res.redirect(endpoints.api.v0.login["/"]);
        return;
      }

      next();
    },
    (req, res, next) => {
      if (isFalseish(req.user)) {
        throw new Error("Cannot access protected resource if not logged in!");
      }

      res.json({
        data: {
          message:
            "This is a protected resource. You can only view this if you are logged in.",
          user: req.user,
        },
      });
    }
  );
}
