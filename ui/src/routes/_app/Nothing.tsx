/**
 * Can be used to place an "element" (it is a text node) where desired but not necessarily "visible"
 *
 * Alternative entities include:
 * - `&nbsp;`
 * - `&#8203;` Zero-width space
 *
 * ---
 *
 * - https://github.com/typora/typora-issues/issues/4136
 * - https://levelup.gitconnected.com/the-zero-width-space-77543a28c984
 */
export function Nothing() {
  return <>&zwj;</>;
}
