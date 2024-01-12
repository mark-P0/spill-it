import winston, { format, transports } from "winston";
import { env } from "./env";

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

/**
 * - https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
 * - https://www.npmjs.com/package/winston
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        format.timestamp(),
        format.printf(
          ({ level, message, timestamp = "Time" }) =>
            `${timestamp} | ${level} | ${message}`
        )
      ),
    }),
  ],
});
