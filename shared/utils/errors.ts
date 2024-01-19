function indent(str: string, amount = 2, char = " "): string {
  const indention = char.repeat(amount);
  return indention + str.replace(/\n/g, "\n" + indention);
}

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let valueStr = "[Thrown value cannot be stringified]";
  try {
    valueStr = JSON.stringify(valueStr);
  } catch {}

  // TODO Log warning to use an Error when throwing?
  return new Error(`A non-Error was thrown, stringified as: ${valueStr}`);
}

/**
 * Convert `error` into string
 *
 * Specifically into its stack message, but if it does not exist
 * (non-standard property), then just convert it directly.
 *
 * Also **manually** attaches the stack messages of the errors that caused it, if any.
 *
 * ---
 *
 * The ideal version of this function is the output of `require('node:util').format(error)`
 * in Node.js, i.e. how it would appear in `console.log(error)`
 * - https://nodejs.org/api/console.html#consolelogdata-args
 */
export function formatError(error: Error): string {
  const string = error.stack ?? error.toString();
  if (error.cause === undefined) {
    return string;
  }
  const cause = ensureError(error.cause);
  return string + "\n" + indent("[cause] " + formatError(cause));
}

export function raise(message: string, cause?: Error): never {
  throw new Error(message, { cause });
}
