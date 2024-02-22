import clsx from "clsx";

/**
 * Styling links/anchors seem to work best if set as block elements;
 * they are inline by default
 *
 * "Non-replaced" inline element?
 * - https://stackoverflow.com/a/54773166
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/transform#sect1
 */
export const clsLinkBlock = "block";

const _clsBtnIcon = (options?: {
  withoutDisabled?: boolean;
  size?: "base" | "small";
}) => {
  const { withoutDisabled = false, size = "base" } = options ?? {};
  return clsx(
    ...[
      //
      "aspect-square",
      size === "base" && "w-9",
      size === "small" && "w-6",
    ],
    ...[
      //
      "rounded-full",
      size === "base" && "p-2",
      size === "small" && "p-1",
    ],
    "*:w-full *:h-full", // For children to occupy full size of parent
    ...[
      "transition",
      !withoutDisabled && [
        "disabled:opacity-50",
        "enabled:active:scale-90",
        "enabled:hover:bg-white/25",
      ],
      withoutDisabled && [
        // "disabled:opacity-50",
        "active:scale-90",
        "hover:bg-white/25",
      ],
    ].flat(),
  );
};
export const clsBtnIcon = _clsBtnIcon();
export const clsSmallBtnIcon = _clsBtnIcon({ size: "small" });
export const clsLinkBtnIcon = _clsBtnIcon({ withoutDisabled: true });

const _clsBtnOutline = (options?: { withoutDisabled?: boolean }) => {
  const { withoutDisabled = false } = options ?? {};
  return clsx(
    "select-none",
    "rounded-full px-6 py-3",
    "border border-white/25",
    ...[
      "transition",
      !withoutDisabled && [
        "disabled:opacity-50",
        "enabled:active:scale-95",
        "enabled:hover:bg-white/10",
      ],
      withoutDisabled && [
        // "disabled:opacity-50",
        "active:scale-95",
        "hover:bg-white/10",
      ],
    ].flat(),
  );
};
export const clsBtnOutline = _clsBtnOutline();
export const clsLinkBtnOutline = _clsBtnOutline({ withoutDisabled: true });

// TODO Share common classes with other button types?
const _clsBtn = (options?: {
  withoutDisabled?: boolean;
  type?: "positive" | "negative"; // TODO Good enough names? Follow log levels, e.g. `info`, `error`?
}) => {
  const { withoutDisabled = false, type = "positive" } = options ?? {};
  return clsx(
    "select-none",
    "rounded-full px-6 py-3",
    "font-bold tracking-wide",
    ...[
      "transition",
      !withoutDisabled && [
        "disabled:opacity-50",
        "enabled:active:scale-95",
        type === "positive" && "bg-fuchsia-500 enabled:hover:bg-fuchsia-600",
        type === "negative" && "bg-rose-500 enabled:hover:bg-red-700",
      ],
      withoutDisabled && [
        // "disabled:opacity-50",
        "active:scale-95",
        type === "positive" && "bg-fuchsia-500 hover:bg-fuchsia-600",
        type === "negative" && "bg-rose-500 hover:bg-red-700",
      ],
    ].flat(),
  );
};
export const clsBtn = _clsBtn();
export const clsLinkBtn = _clsBtn({ withoutDisabled: true });
export const clsBtnNegative = _clsBtn({ type: "negative" });
