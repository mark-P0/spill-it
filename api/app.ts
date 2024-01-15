import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import morgan from "morgan";
import passport from "passport";
import path from "path";
import { LoginRouter } from "./routers/login";
import { LoginGoogleManualRouter } from "./routers/login/google-manual";
import { LogoutRouter } from "./routers/logout";
import { SessionsRouter } from "./routers/sessions";
import { TryRouter } from "./routers/try";
import "./routers/try/ui";
import { UsersRouter } from "./routers/users";
import { env } from "./utils/env";
import { isFalseish } from "./utils/falseish";
import { logger as directLogger, localizeLogger } from "./utils/logger";

const logger = localizeLogger(import.meta.url);

export const app = express();

app.use(
  /** https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/#logging-in-an-express-application-using-winston-and-morgan */
  morgan(
    "tiny", // The format used in the above Winston+Morgan reference is equivalent to this predefined format
    {
      stream: {
        write(message) {
          directLogger.http(message.trim());
        },
      },
    }
  )
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/**
 * Security best practices
 * https://expressjs.com/en/advanced/best-practice-security.html
 */
{
  app.use(helmet());
  app.disable("x-powered-by"); // Should be disabled by `helmet` already... (https://www.npmjs.com/package/helmet#x-powered-by)
}

/** Passport session support */
{
  const dayInMs =
    1 * // Day
    24 * // 1 day == 24 hrs
    60 * // 1 hr == 60 mins
    60 * // 1 min == 60 secs
    1000; // 1 sec == 1000 ms
  const tomorrow = new Date(Date.now() + dayInMs);

  /** https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely */
  const sessionConfig: CookieSessionInterfaces.CookieSessionOptions = {
    name: "SPILLITSESS",
    keys: [env.COOKIE_SESSION_KEY],
    ...{
      maxAge: dayInMs,
      /**
       * https://mrcoles.com/blog/cookies-max-age-vs-expires/
       * - `max-age` is superior
       * - Only works in IE
       */
      expires: tomorrow,
    },
    /** Has cross-site issues on Firefox... */
    ...{
      secure: true,
      httpOnly: true,
      sameSite: "strict", // https://www.rdegges.com/2018/please-stop-using-local-storage/#sensitive-data
    },
  };
  app.use(cookieSession(sessionConfig));
  app.use(
    /**
     * Newer versions of Passport expects the following methods, but `cookie-session` does not provide them.
     * The following makes it seem like they are provided.
     *
     * https://github.com/jaredhanson/passport/issues/904#issuecomment-1307558283
     */
    function mockSessionRegenerateAndSave(req, res, next) {
      if (!isFalseish(req.session)) {
        if (isFalseish(req.session.regenerate)) {
          req.session.regenerate = (callback: CallableFunction) => callback();
        }
        if (isFalseish(req.session.save)) {
          req.session.save = (callback: CallableFunction) => callback();
        }
      }

      next();
    }
  );

  app.use(passport.initialize());
  app.use(passport.session()); // Must come AFTER session middleware
}

/**
 * Normally, routers are mounted to an endpoint, e.g. `app.use('/try', TryRouter)`.
 *
 * However, these implicit assignments make it hard to follow actual endpoints.
 * Redirects are also difficult to follow because they use the "direct" paths that are hidden in that approach.
 *
 * Instead, the following mount the routes directly to the app (at `/`),
 * and the handlers (and redirects!) reference a centralized endpoint map for better maintainability.
 */
{
  if (env.NODE_ENV === "development") {
    logger.debug('Using "try" routes...');
    app.use(TryRouter);
  }
  // app.use(LoginGoogleManualRouter); // DELETEME
  // app.use(LoginRouter); // DELETEME
  app.use(SessionsRouter);
  app.use(LogoutRouter);
  app.use(UsersRouter);
}

/** Custom catch-call handlers, to override Express' defaults */
{
  /** When none of the above handlers are triggered, the requested resource likely does not exist. */
  app.use((req, res, next) => {
    res.status(StatusCodes.NOT_FOUND).json({ error: ReasonPhrases.NOT_FOUND });
  });

  /**
   * When none of the above handlers handled the error, it might be unexpected.
   * Assumes that all expected errors are handled properly!
   *
   * The goal is for the app to NOT reach this handler!
   *
   * Type association for error handlers are broken, so it must be manually done
   * - https://stackoverflow.com/questions/50218878/typescript-express-error-function
   * - https://github.com/DefinitelyTyped/DefinitelyTyped/issues/4212
   */
  app.use(((err: Error, req, res, next) => {
    logger.error(err?.stack ?? `${err}`);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }) satisfies ErrorRequestHandler);
}
