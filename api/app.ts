import cookieParser from "cookie-parser";
import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import morgan from "morgan";
import path from "path";
import { LoginGoogleManualRouter } from "./routers/login/google-manual";
import { SessionsRouter } from "./routers/sessions";
import { TryRouter } from "./routers/try";
import "./routers/try/ui";
import { UsersRouter } from "./routers/users";
import { env } from "./utils/env";
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
  app.use(SessionsRouter);
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
