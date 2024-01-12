import winston, { format, transports } from "winston";
import { getFilenameRelativeToRoot } from "./cjs-vars-in-esm";
import { env } from "./env";
import { isNullish, removeFalseish } from "./operations";

// TODO Move this to env parser as Zod refinement? https://zod.dev/?id=refine
/** Ensure provided log level is acceptable */
{
  /** Can't infer keys even on type level, maybe because it is an interface? */
  const levels = Object.keys(winston.config.npm.levels);
  if (!levels.includes(env.LOG_LEVEL)) {
    const levelsStr = levels.join(",");
    throw new Error(
      `Unknown log level "${env.LOG_LEVEL}"; must be one of: ${levelsStr}`
    );
  }
}

function getConsoleFormat(withColors = true) {
  const formats = removeFalseish([
    withColors && format.colorize({ all: true }),
    format.timestamp(),
    format.printf((info) => {
      const { level, message } = info; // Known
      const {
        timestamp, // Provided above
        file: importMetaUrl, // Provided on logger call
      } = info; // Unknown
      const file = isNullish(importMetaUrl)
        ? null
        : getFilenameRelativeToRoot(importMetaUrl);

      return removeFalseish([timestamp, level, file, message]).join(" | ");
    }),
  ]);
  return format.combine(...formats);
}

/**
 * - https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
 * - https://www.npmjs.com/package/winston
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: removeFalseish([
    new transports.Console({
      format: getConsoleFormat(),
    }),
    env.NODE_ENV === "development" &&
      new transports.File({
        filename: "api/logs/console.log", // Save the same output as the Console transport
        format: getConsoleFormat(false),
      }),
    env.NODE_ENV === "development" &&
      new transports.File({
        filename: "api/logs/json.log",
        format: format.combine(format.timestamp(), format.json()),
      }),
  ]),
});

logger.info(`Logging at "${env.LOG_LEVEL}" level`);
