import { Router } from "express";
import passport from "passport";
import { GoogleStrategy } from "../auth/google";
import { isNullish } from "../utils/operations";
import { TryRouter } from "./try";

export const LoginRouter = Router();

LoginRouter.get("/", (req, res, next) => {
  res.redirect("/login/google");
});

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

/* DELETEME */
{
  TryRouter.get("/user", (req, res, next) => {
    res.json({ data: req.user });
  });

  TryRouter.get("/unprotected", (req, res, next) => {
    res.json({
      data: "This is an unprotected resource. It can be accessed by anyone, logged in or not.",
    });
  });
  TryRouter.get(
    "/protected",
    (req, res, next) => {
      if (isNullish(req.user)) {
        res.redirect("/login");
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
