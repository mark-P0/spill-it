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

const bodyClasses =
  document.body.getAttribute("class") ??
  (() => {
    console.warn("No document body classes...?");
    return "";
  })();

export function removeBodyClasses() {
  document.body.removeAttribute("class");
}
export function restoreBodyClasses() {
  document.body.setAttribute("class", bodyClasses);
}
