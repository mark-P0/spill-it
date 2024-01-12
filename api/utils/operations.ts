type Nullish = null | undefined;
export function isNullish<T>(value: T | Nullish): value is Nullish {
  return value === null || value === undefined;
}

/**
 * false-ish, combination of "false" and "nullish"?
 *
 * Not really "falsy" because that includes a lot of other values
 * - https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
const falseish = new Set<unknown>([false, null, undefined]); // TODO Typed as unknown to accept other values... Maybe a better way?
export function removeFalseish<T>(
  items: Array<T | false | null | undefined>
): T[] {
  return items.filter((item): item is T => !falseish.has(item));
}
