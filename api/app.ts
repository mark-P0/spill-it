import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import logger from "morgan";
import passport from "passport";
import path from "path";
import { LoginRouter } from "./routers/login";
import { TryRouter } from "./routers/try";
import { env } from "./utils/env";
import { isNullish } from "./utils/operations";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/** Passport session support */
{
  const dayInMs =
    1 * // Day
    24 * // 1 day == 24 hrs
    60 * // 1 hr == 60 mins
    60 * // 1 min == 60 secs
    1000; // 1 sec == 1000 ms
  app.use(
    cookieSession({
      maxAge: dayInMs,
      keys: [env.COOKIE_SESSION_KEY],
    })
  );
  app.use(
    /**
     * Newer versions of Passport expects the following methods, but `cookie-session` does not provide them.
     * The following makes it seem like they are provided.
     *
     * https://github.com/jaredhanson/passport/issues/904#issuecomment-1307558283
     */
    function mockSessionRegenerateAndSave(req, res, next) {
      if (!isNullish(req.session)) {
        if (isNullish(req.session.regenerate)) {
          req.session.regenerate = (callback: CallableFunction) => callback();
        }
        if (isNullish(req.session.save)) {
          req.session.save = (callback: CallableFunction) => callback();
        }
      }

      next();
    }
  );

  app.use(passport.initialize());
  app.use(passport.session()); // Must come AFTER session middleware
}

if (env.NODE_ENV === "development") {
  app.use("/try", TryRouter);
}

app.use("/login", LoginRouter);
