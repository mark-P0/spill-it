import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";
import { env } from "../utils/env";
import { endpoints } from "../utils/express";
import { isNullish } from "../utils/operations";
import { TryRouter } from "./try";

export const LoginRouter = Router();

LoginRouter.get(endpoints.login["/"], (req, res, next) => {
  res.redirect(endpoints.login.google["/"]);
});

passport.use(GoogleStrategy);
LoginRouter.get(endpoints.login.google["/"], passport.authenticate("google")); // [Google Login] Step 1: Trigger login; will redirect to Google
/* [Google Login] Step 2: Actually log in on Google's UI */
LoginRouter.get(
  endpoints.login.google.redirect, // [Google Login] Step 3: Google will redirect to here
  passport.authenticate("google"), // [Google Login] Step 4: Call again to trigger strategy callback
  (req, res, next) => {
    /* DELETEME */
    if (env.NODE_ENV === "production") {
      res.json({ data: req.user });
      return;
    }

    res.redirect(endpoints.try.user);
  }
);

/* DELETEME */
{
  TryRouter.get(endpoints.try.user, (req, res, next) => {
    res.json({ data: req.user });
  });

  TryRouter.get(endpoints.try.unprotected, (req, res, next) => {
    res.json({
      data: "This is an unprotected resource. It can be accessed by anyone, logged in or not.",
    });
  });
  TryRouter.get(
    endpoints.try.protected,
    (req, res, next) => {
      if (isNullish(req.user)) {
        res.redirect(endpoints.login["/"]);
        return;
      }

      next();
    },
    (req, res, next) => {
      if (isNullish(req.user)) {
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
