import { logger } from "./logger";

type Tag = keyof HTMLElementTagNameMap; // From signature of `document.createElement()`
type AttributeValue = string | boolean;
type Child = string | Node; // From signature of `Element.replaceChildren()`

export function E<T extends Tag>(
  tag: T,
  attributes: Record<string, AttributeValue>,
  children: Child[],
): HTMLElementTagNameMap[T] {
  const element = document.createElement(tag);
  return EE(element, attributes, children);
}
export function EE<T extends HTMLElement>(
  element: T,
  attributes: Record<string, AttributeValue>,
  children: Child[],
): T {
  for (const [name, givenValue] of Object.entries(attributes)) {
    let value = givenValue;

    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute
     * - Boolean attributes set to `true` should be set to an empty string
     * - Boolean attributes set to `false` should NOT be present in the element at all
     */
    if (typeof value === "boolean") {
      if (!value) continue;
      value = "";
    }

    element.setAttribute(name, value);
  }

  element.replaceChildren(...children);

  return element;
}

/**
 * Redirect programatically via JS. Gives the effect of clicking an `<a>`.
 *
 * Might be subject to browser privacy/security rules...
 *
 * Alternatives:
 * - `window.location = url`
 * - `window.location.href = url`
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/location#basic_example
 */
export function redirectFull(url: string) {
  window.location.assign(url);
}

const bodyClasses =
  document.body.getAttribute("class") ??
  (() => {
    logger.warn("No document body classes...?");
    return "";
  })();
export function removeBodyClasses() {
  document.body.removeAttribute("class");
}
export function restoreBodyClasses() {
  document.body.setAttribute("class", bodyClasses);
}
