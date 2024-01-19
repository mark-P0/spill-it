/**
 * - https://old.reddit.com/r/reactjs/comments/dvpdgc/how_to_avoid_trycatch_statements_nestingchaining/
 * - https://fsharpforfunandprofit.com/posts/recipe-part2/
 * - https://javascript.plainenglish.io/how-to-avoid-try-catch-statements-nesting-chaining-in-javascript-a79028b325c5
 * - https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5
 * - https://www.youtube.com/watch?v=J-HWmoTKhC8
 */
null;

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let valueStr = "[Thrown value cannot be stringified]";
  try {
    valueStr = JSON.stringify(valueStr);
  } catch {}

  // TODO Log warning to use an Error when throwing?
  return new Error(`A non-Error was thrown, stringified as: ${valueStr}`);
}

// type Result<T> = [T, null] | [null, Error]; // Monadic-ish?
type Result<T> = { success: true; value: T } | { success: false; error: Error }; // Same format as Zod...? Or is it from another source?

/**
 * try-catch wrapper
 *
 * Used primarily to "denest" a try-catch block
 */
export function safe<T>(action: () => T): Result<T> {
  try {
    const value = action();
    return { success: true, value };
  } catch (possibleError) {
    const error = ensureError(possibleError);
    return { success: false, error };
  }
}

/** Async version of {@link safe()} */
export async function safeAsync<T>(
  action: () => Promise<T>,
): Promise<Result<T>> {
  try {
    const value = await action();
    return { success: true, value };
  } catch (possibleError) {
    const error = ensureError(possibleError);
    return { success: false, error };
  }
}
