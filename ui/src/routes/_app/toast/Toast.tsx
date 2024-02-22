import clsx from "clsx";
import { randomKey } from "../../../utils/react";
import { useToastContext } from "./ToastContext";

export function Toast() {
  const { content, level, showOnToast } = useToastContext();

  function discardSelf() {
    showOnToast(null);
  }

  if (content === null) return null;
  return (
    <dialog
      key={randomKey()} // Ensure "new" toast every time content is changed
      open
      onAnimationEnd={discardSelf}
      className={clsx(
        "fixed bottom-9",
        "flex gap-6",
        "rounded px-6 py-3",
        "shadow-lg shadow-black/50",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500 text-black",
        level === "critical" && "bg-rose-500 text-white",
        "animate-toast",
      )}
    >
      <span className="text-sm tracking-wider">{content}</span>

      <button
        onClick={discardSelf}
        className={clsx(
          "font-bold text-sm uppercase tracking-widest",
          ...["transition", "opacity-50 hover:opacity-100"],
        )}
      >
        Close
      </button>
    </dialog>
  );
}
