import { raise } from "@spill-it/utils/errors";
import { removeFalseish } from "@spill-it/utils/falseish";
import winston, { format, transports } from "winston";
import { env } from "./env";

/** Can't infer keys even on type level, maybe because it is an interface? */
const levels = Object.keys(winston.config.npm.levels);
const longestLevelStr = levels.reduce(
  (running, current) => (current.length > running.length ? current : running),
  "",
);
const longestLevelStrLen = longestLevelStr.length;

// TODO Move this to env parser as Zod refinement? https://zod.dev/?id=refine
/** Ensure provided log level is acceptable */
{
  if (!levels.includes(env.LOG_LEVEL)) {
    const levelsStr = levels.join(",");
    raise(`Unknown log level "${env.LOG_LEVEL}"; must be one of: ${levelsStr}`);
  }
}

const consoleFormat = (withColors = true) => {
  const formats = removeFalseish([
    format(
      /** Seemed like what `winston.format.padLevels()` would do but does not seem like it...? */
      function padUppercaseLevels(info) {
        info.level = info.level.padEnd(longestLevelStrLen, " ").toUpperCase();
        return info;
      },
    )(),
    withColors && format.colorize({ all: true }),
    format.timestamp(),
    format.printf((info) => {
      const { level, message } = info; // Known
      const {
        timestamp, // Provided above
        file, // Provided on logger call
      } = info; // Unknown

      return removeFalseish([timestamp, level, file, message]).join(" | ");
    }),
  ]);
  return format.combine(...formats);
};

/**
 * Naive
 *
 * https://stackoverflow.com/a/29774197/11389648
 */
const logFileId =
  new Date().toISOString().split("T")[0] ??
  raise("Date part does not exist...?");

/**
 * - https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
 * - https://www.npmjs.com/package/winston
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: removeFalseish([
    new transports.Console({
      format: consoleFormat(),
    }),
    env.NODE_ENV === "development" &&
      new transports.File({
        filename: `./logs/console/${logFileId}.log`,
        format: consoleFormat(false), // Save the same output as the Console transport
      }),
    env.NODE_ENV === "development" &&
      new transports.File({
        filename: `./logs/json/${logFileId}.log`,
        format: format.combine(format.timestamp(), format.json()),
      }),
  ]),
});
logger.info(`Logging at "${env.LOG_LEVEL}" level`);

/**
 * - Assumes Node was invoked at the "project root"!
 * - Node.js `__filename` available in TS even in ESM.
 *   It is to be passed from each file on which the logger will be localized.
 */
export function localizeLogger(__filename: string) {
  const file = __filename.replace(process.cwd(), "").replace(/\\/g, "/");
  return logger.child({ file });
}
