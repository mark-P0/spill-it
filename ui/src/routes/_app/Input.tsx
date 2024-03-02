import clsx from "clsx";
import { ComponentPropsWithoutRef, useEffect, useRef } from "react";

/** Allow specifying custom validity(ies) as props */
export function Input(
  props: ComponentPropsWithoutRef<"input"> & {
    validity?: string;
    reportValidity?: boolean;
  },
) {
  const { validity, reportValidity, ...attributes } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return;

    input.setCustomValidity(validity ?? "");
    if (reportValidity) input.reportValidity();
  }, [validity, reportValidity]);

  return <input {...attributes} ref={inputRef} />;
}

/**
 * https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
 * - `<textarea>` cannot automatically grow (on its own at least)
 * - Other elements can grow, e.g. `<div>`
 * - In the following, the value of the `<textarea>` is replicated on a growable element, e.g. `<div>`
 * - The `<textarea>` follows the size of the growable element via the grid parent
 *   - Overlapping grid children takes the dimensions of the largest child
 * - The growable element MUST have the same styles as the `<textarea>`
 *   - Specifically those that affect the effective size, e.g. padding, margins
 *   - Also includes the styles innate to `<textarea>`, e.g. `whitespace`
 *   - Purely visual styles, e.g. background color shouldn't matter, but also shouldn't hurt to reapply
 * - Very similar to the bold-normal font weight transition trick (overlap and opacity)
 */
export function TextArea(props: ComponentPropsWithoutRef<"textarea">) {
  const { ...attributes } = props;

  return (
    <div className="grid *:row-[1] *:col-[1]">
      <textarea {...attributes}></textarea>
      <div
        className={clsx(
          "invisible", // Visually hidden!
          "whitespace-pre-wrap", // Innate to `<textarea>`
          attributes.className, // Styles applied to `<textarea>`
        )}
      >
        {attributes.value}
        {
          /**
           * Used to prevent "jumpy" behavior
           *
           * Any "character" should work, e.g. letters, `&nbsp;`,
           * but a space is probably the simplest
           *
           * "Jumpy" behavior probably happens because of a
           * rendering edge case with trailing newlines
           */
          " "
        }
      </div>
    </div>
  );
}
