import util from "node:util";

/**
 * Return `error` as a string like how it would be formatted in `console.log(error)`
 * - https://nodejs.org/api/console.html#consolelogdata-args
 */
export function formatError(error: Error): string {
  return util.format(error);
}
