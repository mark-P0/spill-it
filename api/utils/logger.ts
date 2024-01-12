import winston from "winston";

/**
 * - https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-winston-and-morgan-to-log-node-js-applications/
 * - https://www.npmjs.com/package/winston
 */
export const logger = winston.createLogger({
  level: "debug", // TODO Change depending on NODE_ENV?
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});
