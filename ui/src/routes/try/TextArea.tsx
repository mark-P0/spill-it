import clsx from "clsx";
import { useState } from "react";

/**
 * https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
 */
export function TextArea() {
  const [value, setValue] = useState("");

  const clsTextArea = clsx(
    //
    "bg-red-500",
    "resize-none overflow-clip",
    "p-3",
  );
  return (
    <label className="grid gap-1 p-3">
      TextArea
      {
        //
        /**
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
      }
      <div
        className={clsx(
          //
          "grid",
          "*:row-[1] *:col-[1]",
        )}
      >
        <textarea
          //
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={clsTextArea}
        ></textarea>
        <div
          className={clsx(
            //
            "invisible", // Visually hidden!
            "whitespace-pre-wrap", // Innate to `<textarea>`
            clsTextArea, // Styles applied to `<textarea>`
          )}
        >
          {value}
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
    </label>
  );
}
