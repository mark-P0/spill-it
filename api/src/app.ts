import { endpoints } from "@spill-it/endpoints";
import { formatError } from "@spill-it/utils/errors";
import { safe } from "@spill-it/utils/safe";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import helmet from "helmet";
import { StatusCodes } from "http-status-codes";
import morgan from "morgan";
import path from "path";
import { LinksRouter } from "./routers/links";
import { PostsRouter } from "./routers/posts";
import { SessionsRouter } from "./routers/sessions";
import { TryRouter } from "./routers/try";
import "./routers/try/protected";
import "./routers/try/ui";
import { UsersRouter } from "./routers/users";
import { uiHost } from "./utils/env";
import { logger as directLogger, localizeLogger } from "./utils/logger";

const logger = localizeLogger(__filename);
export const app = express();

{
  /**
   * https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/#logging-in-an-express-application-using-winston-and-morgan
   * - The `morgan` format used in this seems to be equivalent to the `"tiny"` predefined format
   */
  const combinedMorganWinston = (immediate = false) =>
    morgan("tiny", {
      stream: {
        write(message) {
          directLogger.http(message.trim());
        },
      },

      /**
       * - https://github.com/expressjs/morgan#immediate
       * - https://stackoverflow.com/questions/48282686/how-to-properly-split-logging-between-requests-and-responses-with-morgan
       *
       * Separate instances of the middleware can be used to log both requests and responses
       */
      immediate,
    });
  app.use(combinedMorganWinston(true)); // Log requests immediately
  app.use(combinedMorganWinston()); // Log on response (default)
}

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

{
  app.use(
    cors({
      origin: uiHost,
    }),
  );
}

/**
 * Convert request headers into Pascal-Kebab-Case
 *
 * Express (or Node?) uses lowercase headers because the standards demand them to be case-insensitive
 * - https://stackoverflow.com/a/63113385
 * - https://github.com/nodejs/node-v0.x-archive/issues/1954
 *
 * For the app though, Pascal-Kebab-Case is preferred. Mostly as an aesthetic choice.
 */
{
  function capitalize(str: string): string {
    const first = str[0];
    if (first === undefined) return ""; // Given string is empty if it does not have a "first" character

    return first.toUpperCase() + str.slice(1); // TODO Lower the remaining characters?
  }

  function convertKebabToPascalKebab(str: string): string {
    const words = str.split("-");
    return words.map(capitalize).join("-");
  }

  app.use((req, res, next) => {
    const headersPascalKebab = Object.fromEntries(
      Object.entries(req.headers).map(([header, value]) => [
        convertKebabToPascalKebab(header),
        value,
      ]),
    );

    const result = safe(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Request headers should not be used directly anyway...
      req.headers = headersPascalKebab as any;
    });
    if (!result.success) {
      const error = new Error(
        "Failed converting request headers to Pascal-Kebab-Case",
        { cause: result.error },
      );
      logger.error(formatError(error));
      return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }

    next();
  });
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
  logger.debug(
    "Using the following endpoints: " +
      endpoints.map((ep) => `"${ep}"`).join(" "),
  );

  logger.debug('Using "try" routes...');
  app.use(TryRouter);

  app.use(LinksRouter);
  app.use(SessionsRouter);
  app.use(UsersRouter);
  app.use(PostsRouter);
}

/** Custom catch-call handlers, to override Express' defaults */
{
  /** When none of the above handlers are triggered, the requested resource likely does not exist. */
  app.use((req, res, next) => {
    res.sendStatus(StatusCodes.NOT_FOUND);
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
    logger.error(formatError(err));
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }) satisfies ErrorRequestHandler);
}
