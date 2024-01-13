type Nullish = null | undefined;

/**
 * false-ish, combination of "false" and "nullish"?
 *
 * Not really "falsy" because that includes a lot of other values
 * - https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
type Falseish = false | Nullish;
const falseishArr: Falseish[] = [false, null, undefined];

/**
 * A set membership check would be faster, but the default typings are too narrow...
 * - https://github.com/microsoft/TypeScript/issues/26255
 *
 * If this is too slow (wow), consider declaration merging
 * - https://stackoverflow.com/a/53035048
 * - https://github.com/microsoft/TypeScript/issues/26255#issuecomment-458013731
 */
export function isFalseish<T>(value: T | Falseish): value is Falseish {
  return falseishArr.some((falseish) => value === falseish);
}

export function removeFalseish<T>(items: Array<T | Falseish>): T[] {
  return items.filter((item): item is T => !isFalseish(item));
}
