import { env } from "@spill-it/env";
import { raise } from "@spill-it/utils/errors";
import { isFalseish, removeFalseish } from "@spill-it/utils/falseish";
import winston, { format, transports } from "winston";
import { getFilenameRelativeToRoot } from "./cjs-vars-in-esm";

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
  const { LOG_LEVEL } = env;
  if (!levels.includes(LOG_LEVEL)) {
    const levelsStr = levels.join(",");
    raise(`Unknown log level "${LOG_LEVEL}"; must be one of: ${levelsStr}`);
  }
}

function getConsoleFormat(withColors = true) {
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
        file: importMetaUrl, // Provided on logger call
      } = info; // Unknown
      const file = isFalseish(importMetaUrl)
        ? null
        : getFilenameRelativeToRoot(importMetaUrl);

      return removeFalseish([timestamp, level, file, message]).join(" | ");
    }),
  ]);
  return format.combine(...formats);
}

/**
 * Naive
 *
 * https://stackoverflow.com/a/29774197/11389648
 */
function createDailyLogFileId() {
  return new Date().toISOString().split("T")[0] ?? "";
}
const logFileId = createDailyLogFileId();

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
        filename: `./logs/console/${logFileId}.log`,
        format: getConsoleFormat(false), // Save the same output as the Console transport
      }),
    env.NODE_ENV === "development" &&
      new transports.File({
        filename: `./logs/json/${logFileId}.log`,
        format: format.combine(format.timestamp(), format.json()),
      }),
  ]),
});
logger.info(`Logging at "${env.LOG_LEVEL}" level`);

export function localizeLogger(importMetaUrl: string) {
  return logger.child({ file: importMetaUrl });
}
