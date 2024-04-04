import clsx from "clsx";
import { BsXLg } from "react-icons/bs";
import { randomKey } from "../../../utils/react";
import { clsSmallBtnIcon } from "../classes";
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
        "flex items-center gap-3",
        "rounded-lg px-6 py-3",
        "shadow-lg shadow-black/50",
        level === "info" && "bg-fuchsia-500 text-white",
        level === "warn" && "bg-yellow-500 text-black",
        level === "critical" && "bg-rose-500 text-white",
        "animate-toast",
      )}
    >
      <span className="tracking-wider">{content}</span>

      <button onClick={discardSelf} className={clsx(clsSmallBtnIcon)}>
        <BsXLg />
      </button>
    </dialog>
  );
}
