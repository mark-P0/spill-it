import clsx from "clsx";

const _clsBtnIcon = (options?: {
  size?: "base" | "small";
  withoutDisabled?: boolean;
}) => {
  const { size = "base", withoutDisabled = false } = options ?? {};
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
