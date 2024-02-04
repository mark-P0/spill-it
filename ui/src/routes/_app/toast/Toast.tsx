import clsx from "clsx";
import { randomKey } from "../../../utils/react";
import { useToastContext } from "./ToastContext";

export function Toast() {
  const { toastAttrs, setToastAttrs } = useToastContext();

  function removeToastComponent() {
    setToastAttrs(null);
  }

  if (toastAttrs === null) return null;
  const { content, level } = toastAttrs;

  return (
    <dialog
      key={randomKey()} // Ensure "new" toast every time content is changed
      open
      onAnimationEnd={removeToastComponent}
      className={clsx(
        "fixed bottom-[5%]",
        "flex gap-4",
        "rounded px-4 py-2",
        "shadow-lg shadow-black/50",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500 text-black",
        "animate-toast",
      )}
    >
      <span className="text-sm tracking-wider">{content}</span>

      <button
        onClick={removeToastComponent}
        className={clsx(
          "font-bold text-sm uppercase tracking-widest",
          "opacity-50 hover:opacity-100 transition",
        )}
      >
        Close
      </button>
    </dialog>
  );
}
